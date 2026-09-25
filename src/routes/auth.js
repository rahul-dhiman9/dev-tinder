const express = require("express");
const { validateSignUpData } = require("../utils/validation");
const authRouter = express.Router();
const bcrypt = require("bcrypt");
const User = require("../models/user");
const validator = require("validator");
const cloudinary = require("../config/cloudinary");
const fs = require("fs");

const upload = require("../middlewares/multer");

authRouter.post("/signup", upload.single("photo"), async (req, res) => {
  try {
    // Validate request
    await validateSignUpData(req);

    // Get data from FormData
    const {
      firstName,
      emailId,
      password,
      lastName,
      age,
      gender,
      skills,
      about,
    } = req.body;

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user
    const user = new User({
      firstName,
      lastName,
      age,
      gender,
      emailId,
      password: passwordHash,
      skills,
      about,
    });

    // Check if user uploaded a photo
    if (req.file) {
      // Upload Multer's temporary file to Cloudinary
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: "devTinder/profile",
      });

      // Save Cloudinary URL in MongoDB
      user.photoUrl = result.secure_url;

      // Delete temporary file from your server
      fs.unlinkSync(req.file.path);
    }

    // Save user
    await user.save();

    res.status(201).json({
      message: "User added successfully",
      data: user,
    });
  } catch (err) {
    console.error("SIGNUP ERROR:", err);

    // If Multer uploaded a file but Cloudinary/database failed,
    // remove the temporary file
    if (req.file) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (fileError) {
        console.log("Temporary file cleanup failed");
      }
    }

    res.status(400).json({
      message: err.message,
    });
  }
});

authRouter.post("/login", async (req, res) => {
  try {
    const { emailId, password } = req.body;

    if (!emailId || !password || !validator.isEmail(emailId)) {
      return res.send("email id or password is wrong");
    }

    const user = await User.findOne({ emailId }).select("+password");

    if (!user) {
      return res.status(401).send("Invalid credentials");
    }

    const isPasswordValid = await user.validatePassword(password);

    if (!isPasswordValid) {
      return res.status(401).send("Email ID or password is wrong");
    }

    //create a jwt token
    const token = await user.getJWT();

    //add the token to cookie and send the response back to the user
    res.cookie("token", token, {
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000,
    });
    user.password = undefined;
    //password na jaaye user ke pass
    // Login successful
    res.json({ user });
  } catch (err) {
    res.status(500).send("error  " + err.message);
  }
});

authRouter.post("/logout", async (req, res) => {
  res
    .cookie("token", null, {
      expires: new Date(Date.now()),
    })
    .json({ message: "LOGGED OUT" });
});

module.exports = authRouter;
