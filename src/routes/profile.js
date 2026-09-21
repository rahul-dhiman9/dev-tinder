const express = require("express");
const { userAuth } = require("../middlewares/auth");
const { validateEditProfileData } = require("../utils/validation");
const upload = require("../middlewares/multer");
const profileRouter = express.Router();
const bcrypt = require("bcrypt")
const validator = require("validator")

profileRouter.get("/profile/view", userAuth, async (req, res) => {
  try {
    const user = req.user;
    res.json({data:user});
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

      loggedInUser.firstName = req.body.firstName;
      loggedInUser.lastName = req.body.lastName;
      loggedInUser.age = req.body.age;
      loggedInUser.gender = req.body.gender;
      loggedInUser.skills = req.body.skills;
      loggedInUser.about = req.body.about;

      if (req.file) {
        loggedInUser.photoUrl =
          "/uploads/" + req.file.filename;
      }

      await loggedInUser.save();

      res.json({
        message: "Profile updated successfully",
        data: loggedInUser,
      });

    } catch (err) {
      console.error("EDIT PROFILE ERROR:", err);

      res.status(500).json({
        message: err.message,
      });
    }
  }
);

profileRouter.patch("/profile/updatepassword",userAuth,async(req,res)=>{
 try{
 const userPtoBeUpdated = req.user
 const {newPassword} = req.body
if(!newPassword){
  return res.status(400).send("new password is required")
}

  const isStrongPassword = validator.isStrongPassword(newPassword)
  if(!isStrongPassword){
    throw new Error("password is too weak")
  }
  userPtoBeUpdated.password = await bcrypt.hash(newPassword,10)
  await userPtoBeUpdated.save()
  res.json({message:"password updated successfully"})
 }
 catch(err){
    res.status(400).send("error  " + err.message);

 }

})

module.exports = profileRouter;
