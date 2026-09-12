const adminAuth = (req,res,next)=>{
  console.log("admin auth is checked");
  
      // Logic of checking if the request is authorized
    const token = "xyz";
    const isAdminAuthorized = token === "xyz";
    if(!isAdminAuthorized){
      res.status(401).send("unauthorized requests")
    }
    else{
      next()
    }
}
 

const userAuth = (req,res,next)=>{
  console.log("user auth is checked");
  
      // Logic of checking if the request is authorized
    const token = "xyz";
    const isAdminAuthorized = token === "xyz";
    if(!isAdminAuthorized){
      res.status(401).send("unauthorized requests")
    }
    else{
      next()
    }
}

module.exports ={
  adminAuth,
  userAuth
}
