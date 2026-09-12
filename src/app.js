const express = require("express");

const app = express();

app.get("/getUserData", (req, res) => {
  try {
    //logic of db call adn get user data
    throw new Error("sdjkasjf");
    res.send("user data sent");
  } catch (err) {
    res.status(500).send("some error contact support team");
  }
});

app.use("/", (err, req, res, next) => {
  if (err) {
    //also log errors
    res.status(500).send("something went wrong");
  }
  //good way is to use try catch only in that same route handler
});

app.listen(3002, () => {
  console.log("Server is successfully listening on port 3002...");
});
