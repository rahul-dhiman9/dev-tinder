const express = require("express");

const app = express();

// app.use("/user",(req,res)=>{
//   //route handler
//   res.send("router 1")
// })

app.use(
  "/user",
  (req, res, next) => {
    //route handler1
    console.log("handler the route user 1");
    next();
    // res.send("router 1");
  },
  [(req, res, next) => {
    console.log("handler the route user 2");
    //route handler
    next();
    // res.send("router 2");
  },
  (req, res, next) => {
    console.log("handler the route user 3");
    //route handler
    res.send("router 3");
    next()
  }],
    (req, res, next) => {
    console.log("handler the route user 3");
    //route handler
    // res.send("router 4");
    next()
  },
);
//output above is router1 in postman, cause line by line v8 sync code h na hang hojega agr res nahi bhejoge first route m , krna h hi 2 print toh next() use kro

app.listen(3002, () => {
  console.log("server is started");
});
