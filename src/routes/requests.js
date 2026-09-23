const express = require("express");
const { userAuth } = require("../middlewares/auth");
const ConnectionRequest = require("../models/connectionRequest");
const User = require("../models/user");
const requestRouter = express.Router();
const sendEmail = require("../utils/sendEmail");

requestRouter.post(
  "/request/send/:status/:toUserId",
  userAuth,
  async (req, res) => {
    //fromUserId toh logged in user se mil ajyegi

    try {
      const fromUserId = req.user._id;
      const toUserId = req.params.toUserId;
      const status = req.params.status;
      const allowedStatus = ["ignored", "interested"];
      if (!allowedStatus.includes(status)) {
        return res
          .status(400)
          .json({ message: "Invalid status type: " + status });
      }

      //to check user jisko ja rhi h vo apna user h na
      const toUser = await User.findById(toUserId);
      if (!toUser) {
        return res.status(404).json({
          message: "User not found !",
        });
      }

      //IF there is an existing Connection request
      const existingConnectionRequest = await ConnectionRequest.findOne({
        $or: [
          { fromUserId, toUserId },
          { fromUserId: toUserId, toUserId: fromUserId },
        ],
      });
      if (existingConnectionRequest) {
        return res
          .status(400)
          .json({ message: "connection request already exist!!" });
      }

      const connectionRequest = new ConnectionRequest({
        fromUserId,
        toUserId,
        status,
      });

      const data = await connectionRequest.save();

      const response = await sendEmail({
        to: "raadevelopedit@gmail.com",
        subject: "SES Test",
        text: "Testing AWS SES",
      }).catch((err) => {
        console.error("SES email failed:", err.message);
      });
      console.log(response);

      res.json({
        message: `${req.user.firstName} has ${status}  ${toUser.firstName}`,
        data,
      });
    } catch (err) {
      res.status(400).send("ERROR: " + err.message);
    }
  },
);

requestRouter.post(
  "/request/review/:status/:requestId",
  userAuth,
  async (req, res) => {
    try {
      const loggedInUser = req.user;
      const status = req.params.status;
      const requestId = req.params.requestId;

      //validate the status
      const allowedStatus = ["accepted", "rejected"];
      if (!allowedStatus.includes(status)) {
        return res.status(400).json({ message: "status not allowed" });
      }

      //is logged in person is the receiver na... and
      //if the req.params.requestId should be valid
      const connectionRequest = await ConnectionRequest.findOne({
        _id: requestId,
        toUserId: loggedInUser._id,
        status: "interested",
      });
      if (!connectionRequest) {
        return res.status(404).json({ message: "connection req not found" });
      }

      //status from param wala status dedo
      connectionRequest.status = status;

      const data = await connectionRequest.save();
      res.json({ message: "connection request " + status, data });

      //the logged in person can only accept the connection req if it is in interested state and nobody can change reverse the ignored  ...so the status should be definitely interested, status=interested
    } catch (err) {
      res.status(500).send("can not see the response");
    }
  },
);
module.exports = requestRouter;
