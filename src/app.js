const express = require("express");
const { connectDb } = require("./config/db");
const User = require("./models/user");

const app = express();

app.post("/signup", async (req, res) => {
  const userObj = {
    firstName: "MY",
    lastName: "Kholi",
    emailId: "vk@232gmai.com",
    password: "vk12",
  };
  //creating a new instance of the user model
  const user = new User(userObj);

  try {
    await user.save();

    // res.send("user added successfully")
    res.send(userObj);
  } catch (err) {
    res.status(400).send("error saving user");
  }
});

connectDb()
  .then(() => {
    console.log("database connected successfully");
  })
  .catch((err) => {
    console.log("database can not be connected");
  });

app.listen(3002, () => {
  console.log("Server is successfully listening on port 3002...");
});
