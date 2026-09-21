const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

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
      unique: true,
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
      select:false,
      required: true,
    },
    age: {
      min: 18,
      max: 100,
      type: Number,
    },
    gender: {
      type: String,
      enum: {
        values: ["male", "female", "others"],
        message: `{VALUE} it is not supported gender type`,
      },
      // validate(value) {
      //   if (!["male", "female", "others"].includes(value)) {
      //     throw new Error("gender is not specified", err.message);
      //   }
      // },
    },
    photoUrl: {
      type: String,
      default:
        "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTro-iMp3rwLVEqt6I6NyOlW4JpSkSezwVXo1xiLPGSMQ&s=10",
    },
    about: {
      type: String,
      default: "Just match na matachaa!",
      minLength: 20,
      maxLength: 200,
    },
    skills: {
      type: [String],
      validate: {
        validator: function (value) {
          return value.length <= 10;
        },
        message: "Skills cannot have more than 10 items",
      },
    },
  },
  {
    timestamps: true,
  },
);


userSchema.index({firstName:1,lastName:1})

userSchema.methods.getJWT = async function () {
  const user = this;
  const token = await jwt.sign({ _id: user._id }, "DEV@12121313", {
    expiresIn: "1d",
  });
  return token;
};



userSchema.methods.validatePassword = async function (passwordByUser) {
  const user = this;
  const isPasswordValid = await bcrypt.compare(passwordByUser, user.password);
  return isPasswordValid;
};

const User = mongoose.model("User", userSchema);
module.exports = User;
