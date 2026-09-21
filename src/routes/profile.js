const express = require("express");
const { userAuth } = require("../middlewares/auth");
const { validateEditProfileData } = require("../utils/validation");
const upload = require("../middlewares/multer");
const profileRouter = express.Router();
const bcrypt = require("bcrypt");
const validator = require("validator");
const cloudinary = require("../config/cloudinary");
const fs = require("fs");

profileRouter.get("/profile/view", userAuth, async (req, res) => {
  try {
    const user = req.user;
    res.json({ data: user });
  } catch (err) {
    res.status(500).send("error  " + err.message);
  }
});

profileRouter.patch(
  "/profile/edit",
  userAuth,
  upload.single("photo"),

  async (req, res) => {
    try {
      console.log("BODY:", req.body);
      console.log("FILE:", req.file);

      const loggedInUser = req.user;

      // Update normal fields
      loggedInUser.firstName = req.body.firstName;
      loggedInUser.lastName = req.body.lastName;
      loggedInUser.age = req.body.age;
      loggedInUser.gender = req.body.gender;
      loggedInUser.skills = req.body.skills;
      loggedInUser.about = req.body.about;

      // If user uploaded a new photo
      if (req.file) {
        // Upload temporary Multer file to Cloudinary
        const result = await cloudinary.uploader.upload(req.file.path, {
          folder: "devTinder/profile",
        });

        // Save Cloudinary URL
        loggedInUser.photoUrl = result.secure_url;

        // Delete temporary local file
        fs.unlinkSync(req.file.path);
      }

      // Save changes to MongoDB
      await loggedInUser.save();

      res.json({
        message: "Profile updated successfully",
        data: loggedInUser,
      });
    } catch (err) {
      console.error("EDIT PROFILE ERROR:", err);

      // Clean up temporary file if something failed
      if (req.file) {
        try {
          fs.unlinkSync(req.file.path);
        } catch (fileError) {
          console.log("Temporary file cleanup failed");
        }
      }

      res.status(500).json({
        message: err.message,
      });
    }
  },
);

profileRouter.patch("/profile/updatepassword", userAuth, async (req, res) => {
  try {
    const userPtoBeUpdated = req.user;
    const { newPassword } = req.body;
    if (!newPassword) {
      return res.status(400).send("new password is required");
    }

    const isStrongPassword = validator.isStrongPassword(newPassword);
    if (!isStrongPassword) {
      throw new Error("password is too weak");
    }
    userPtoBeUpdated.password = await bcrypt.hash(newPassword, 10);
    await userPtoBeUpdated.save();
    res.json({ message: "password updated successfully" });
  } catch (err) {
    res.status(400).send("error  " + err.message);
  }
});

module.exports = profileRouter;
