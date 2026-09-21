const express = require("express");
const { connectDb } = require("./config/db");
const User = require("./models/user");
const validator = require("validator");
const validateSignUpData = require("./utils/validation");
const bcrypt = require("bcrypt");
const cookieParser = require("cookie-parser");
const jwt = require("jsonwebtoken");
const { userAuth } = require("./middlewares/auth");
const app = express();
const authRouter = require("./routes/auth");
const profileRouter = require("./routes/profile");
const requestRouter = require("./routes/requests");
const userRouter = require("./routes/user");
const cors = require("cors");
const path = require("path");



require("dotenv").config();

//multer ke liye,  Serve files from the local uploads folder at /uploads/<filename>
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

app.use(
  cors({
    origin: "http://localhost:5173", // frontend URL
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    credentials: true, // allow cookies/auth headers,
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

app.use(express.json());
// Parses requests with JSON payloads.,Express will automatically convert that JSON into a JavaScript object

app.use(express.urlencoded());
//Parses requests with URL‑encoded payloads (like HTML form submissions),handles form submissions with x-www-form-urlencoded.

app.use(cookieParser());
// Reads cookies sent by the browser and makes them accessible in Express via req.cookies

app.use("/", authRouter);
app.use("/", profileRouter);
app.use("/", requestRouter);
app.use("/", userRouter);

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
