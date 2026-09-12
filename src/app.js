const express = require("express");
const { connectDb } = require("./config/db");
const User = require("./models/user");

const app = express();

app.use(express.json());
// Parses requests with JSON payloads.,Express will automatically convert that JSON into a JavaScript object
app.use(express.urlencoded());
//Parses requests with URL‑encoded payloads (like HTML form submissions),handles form submissions with x-www-form-urlencoded.

app.post("/signup", async (req, res) => {
    console.log(req.body);

  //creating a new instance of the user model
  const user = new User(req.body);

  try {
    await user.save();

    res.send("user added successfully")
    res.send(userObj);

  } catch (err) {
    res.status(400).send("error saving user");
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
app.patch("/user", async (req, res) => {
  const userId = req.body.userId;
  const data = req.body;
  try {
    const updateduser = await User.findByIdAndUpdate(userId , data,{
      returnDocument:"after",
      runValidators:true
    });
    res.send("updated successfully");
    console.log(updateduser);
    
  } catch (err) {
    res.status(400).send("error updating user");
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
