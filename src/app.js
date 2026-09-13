const express = require("express");
const { connectDb } = require("./config/db");
const User = require("./models/user");
const validator = require("validator");
const validateSignUpData = require("./utils/validation");
const bcrypt = require("bcrypt");

const app = express();

app.use(express.json());
// Parses requests with JSON payloads.,Express will automatically convert that JSON into a JavaScript object
app.use(express.urlencoded());
//Parses requests with URL‑encoded payloads (like HTML form submissions),handles form submissions with x-www-form-urlencoded.

app.post("/signup", async (req, res) => {
  try {
    await validateSignUpData(req);

    const { firstName, emailId, password, lastName, photoUrl, age } = req.body;

    //encrypt the password
    const passwordHash = await bcrypt.hash(password, 10);
    console.log(passwordHash);

    // Save new user
    const user = new User({
      firstName: firstName,
      lastName: lastName,
      age: age,
      emailId: emailId,
      password: passwordHash,
      photoUrl: photoUrl,
    });
    await user.save();

    res.status(201).json({
      message: "User added successfully",
      user,
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("error  " + err.message);
  }
});

app.post("/login", async (req, res) => {
  try {
    const { emailId, password } = req.body;

    if (!emailId || !password || !validator.isEmail(emailId)) {
      return res.send("email id or password is wrong");
    }

    const user = await User.findOne({ emailId: emailId });
    if (!user) {
      return res.send("invalid credentials");
    }
    const userPassword = user.password;
    const isPasswordValid = await bcrypt.compare(password, userPassword);
    if (!isPasswordValid) {
      return res.send("email id or password is wrong");
    }

    // Login successful
    res.send("Login successful");
  } catch (err) {
    res.status(500).send("error  " + err.message);
  }
});

// //feed api get /feed get all the users from the db
// //get user by email
// app.get("/user",async(req,res)=>{
//   try{
//   const users = await User.find({emailId:req.body.emailId})
//   res.send(users)
//   console.log(users.length)
//   }
//   catch(err){
//     res.status(404).send("something went wrong")
//   }
// })
// //to get all the users
// app.get("/feed",async(req,res)=>{
//   try{
//   const users = await User.find({})
//   res.send(users)
//   console.log(users.length)
//   }
//   catch(err){
//     res.status(404).send("something went wrong")
//   }
// })
// //to get ONE OF TWO the users
// app.get("/oneuser",async(req,res)=>{
//   try{
//   const user = await User.findOne({emailId:req.body.emailId})
//   if(!user){
//     res.status(404).send("no user")
//   }
//   res.send(user)
//   }
//   catch(err){
//     res.status(404).send("something went wrong")
//   }
// })

// //to get by id the users
// app.get("/iduser/:_id",async(req,res)=>{
//   try{
//     const id = req.params._id
//   const user = await User.findById(id)
//   if(!user){
//     res.status(404).send("no user")
//   }
//   res.send(user)
//   }
//   catch(err){
//     res.status(404).send("something went wrong")
//   }
// })

app.delete("/user", async (req, res) => {
  const userId = req.body.userId;
  try {
    const user = await User.findByIdAndDelete(userId);
    res.send("deleted successfully");
    console.log("deleted");
  } catch (err) {
    res.status(400).send("error saving user");
  }
});

//updating the data of the user
app.patch("/user/:userId", async (req, res) => {
  const userId = req.params?.userId;
  const data = req.body;
  const AllowedUpdates = ["photUrl", "about", "gender", "age", "skills"];
  const isUpdateAllowed = Object.keys(data).every((key) =>
    AllowedUpdates.includes(key),
  );
  if (!isUpdateAllowed) {
    return res.status(400).send("Update not allowed");
  }
  if (data?.skills.length > 10) {
    throw new Error("skills can not be more than 10");
  }
  try {
    const updateduser = await User.findByIdAndUpdate(userId, data, {
      returnDocument: "after",
      runValidators: true,
    });
    res.send("updated successfully");
    console.log(updateduser);
  } catch (err) {
    res
      .status(400)
      .send({ message: "error updating user", error: err.message });
  }
});

connectDb()
  .then(() => {
    console.log("database connected successfully");

    app.listen(3002, () => {
      console.log("Server is successfully listening on port 3002...");
    });
  })
  .catch((err) => {
    console.log("database can not be connected");
  });
