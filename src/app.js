const express = require("express");

const app = express();

// app.use("/user",(req,res)=>{
//   console.log("hahahaha");
// })

//this will only handle get call to /user
app.get("/user", (req, res) => {
  res.send({ name: "Rahul" });
});
app.post("/user", (req, res) => {
  res.send("data saved successfully");
});
app.put("/user", (req, res) => {
  res.send("data updated successfully");
});
app.patch("/user", (req, res) => {
  res.send("data partially successfully");
});
app.delete("/user", (req, res) => {
  res.send("data deleted successfully");
});




// app.use("/", (req, res) => {
//   res.send("Hello ji");
// });

//this will match all the http method to /test
app.use("/test", (req, res) => {
  res.send("Hello ji");
});

app.listen(3002, () => {
  console.log("server is started");
});
