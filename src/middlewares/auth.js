const jwt = require("jsonwebtoken");
const User = require("../models/user");

const userAuth = async (req, res, next) => {
  try {
    //read the token from the req cookie
    const cookies = req.cookies;
    const { token } = cookies;
    if(!token){
     return res.status(401).send("You are not logged in ,please login")
    }
    //validate the token and find the token of that user exist and user exists or not
    const decodedDataObj = await jwt.verify(token, "DEV@12121313");
    const { _id } = decodedDataObj;
    const user = await User.findById(_id);
    if (!user) {
      throw new Error("please try again or maybe user not found");
    }

    req.user = user;
    next();
  } catch (err) {
    res.status(400).send("ERROR :" + err.message);
  }
};

module.exports = {
  userAuth,
};
