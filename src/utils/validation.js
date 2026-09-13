const validator = require("validator");
const User = require("../models/user");
const validateSignUpData = async (req) => {
  const { firstName, emailId, password, age } = req.body;

  // API-level validations using validator
  if (!firstName || !validator.isLength(firstName, { min: 2, max: 50 })) {
    throw new Error("name is not valid");
  }

  if (!emailId || !validator.isEmail(emailId)) {
    throw new Error("email is not valid");
  }

  if (!password || !validator.isStrongPassword(password, { minLength: 8 })) {
    throw new Error("password is not valid");
  }

  if (age && !validator.isInt(age.toString(), { min: 18, max: 100 })) {
    throw new Error("age is not valid");
  }

  const existingUser = await User.findOne({ emailId });
  if (existingUser) {
    throw new Error("email already exists");
  }
};

module.exports = validateSignUpData;
