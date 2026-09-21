const express = require("express");
const { validateSignUpData } = require("../utils/validation");
const authRouter = express.Router();
const bcrypt = require("bcrypt");
const User = require("../models/user");
const validator = require("validator");

const upload = require("../middlewares/multer");

authRouter.post("/signup", upload.single("photo"), async (req, res) => {
  try {
    await validateSignUpData(req);

    const { firstName, emailId, password, lastName, age } = req.body;

    const passwordHash = await bcrypt.hash(password, 10);

    const user = new User({
      firstName,
      gender,
      lastName,
      age,
      emailId,
      password: passwordHash,
      skills,
      about,
    });

    if (req.file) {
      user.photoUrl = "/uploads/" + req.file.filename;
    }

    await user.save();

    res.status(201).json({
      message: "User added successfully",
      data: user,
    });
  } catch (err) {
    console.error(err);
    res.status(400).send("error " + err.message);
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
