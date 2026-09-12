const express = require("express");

const app = express();

const { adminAuth,userAuth } = require("./middlewares/auth");

//handle auth middleware for all request get post patch put etc .all also work
app.use("/admin", adminAuth);

app.get("/user",userAuth, (req, res) => {
  res.send("user data Sent");
});

app.get("/admin/getAllData", (req, res) => {
  res.send("All Data Sent");
});

app.get("/admin/deleteUser", (req, res) => {
  res.send("Deleted a user");
});

app.listen(3002, () => {
  console.log("Server is successfully listening on port 3002...");
});
