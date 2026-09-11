const express = require('express')

const app = express()

app.use("/test",(req,res)=>{
  res.send("Hello ji")
})


app.use("/hello",(req,res)=>{
  res.send("Hello ji hello")
})


app.listen(3002,()=>{
  console.log("server is started");
})
