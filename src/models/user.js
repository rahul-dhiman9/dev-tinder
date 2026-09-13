const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcrypt")
const jwt = require("jsonwebtoken")

const userSchema = mongoose.Schema(
  {
    firstName: {
      type: String,
      required: true,
      minLength: 4,
      maxLength: 20,
    },
    lastName: {
      type: String,
      minLength: 4,
      maxLength: 20,
    },
    emailId: {
      type: String,
      unique:true,
      required: true,
      lowercase: true,
      trim: true,
      validate(value) {
        if (!validator.isEmail(value)) {
          throw new Error("invalid email address" + value);
        }
      },
    },
    password: {
      type: String,
      required: true,
      validate(value) {
        if (!validator.isStrongPassword(value, { minLength: 8 })) {
          throw new Error("Password is too weak");
        }
      },
    },
    age: {
      min: 18,
      max: 100,
      type: Number,
    },
    gender: {
      validate(value) {
        if (!["male", "female", "others"].includes(value)) {
          throw new Error("gender is not specified", err.message);
        }
      },
      type: String,
    },
    photoUrl: {
      type: String,
      default:
        "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTro-iMp3rwLVEqt6I6NyOlW4JpSkSezwVXo1xiLPGSMQ&s=10",
         validate(value) {
      if (!validator.isURL(value)) {
        throw new Error("Invalid photo URL");
      }
    }
    },
    about: {
      type: String,
      default: "Just match na matachaa!",
      minLength: 20,
      maxLength: 200,
    },
    skills: {
      type: [String],
      minLength: 20,
      maxLength: 200,
    },
  },
  {
    timestamps: true,
  },
);


userSchema.methods.getJWT = async function(){
  const user = this;
   const token = await jwt.sign({ _id:user._id }, "DEV@12121313", {
      expiresIn: "1d",  
    });
    return token
}

userSchema.methods.validatePassword=async function(passwordByUser){
  const user = this;
  const isPasswordValid = await bcrypt.compare(passwordByUser, user.password)
    return isPasswordValid;
}

const User = mongoose.model("User", userSchema);
module.exports = User;
