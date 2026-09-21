const express = require("express");
const { userAuth } = require("../middlewares/auth");
const ConnectionRequest = require("../models/connectionRequest");
const User = require("../models/user");

const userRouter = express.Router();

//used to populate
const USER_SAFE_DATA = "firstName lastName gender age photoUrl skills about";

//get all the pending connection requests for logged in user nothing more
userRouter.get("/user/requests/received", userAuth, async (req, res) => {
  try {
    const loggedInUser = req.user;
    const connectionRequest = await ConnectionRequest.find({
      toUserId: loggedInUser._id,
      status: "interested",
    }).populate("fromUserId", USER_SAFE_DATA);
    res.json({ message: "Data fetched successfully", data: connectionRequest });
  } catch (err) {
    res.status(400).send("ERROR:" + err.message);
  }
});







//who has accepted my connection, check status of accepted and check loggedin user is formuserId or toUserId
userRouter.get("/user/connections", userAuth, async (req, res) => {
  try {
    const loggedInUser = req.user;

    const connectionRequest = await ConnectionRequest.find({
      $or: [
        { toUserId: loggedInUser._id, status: "accepted" },
        { fromUserId: loggedInUser._id, status: "accepted" },
      ],
    })
      .populate("fromUserId", USER_SAFE_DATA)
      .populate("toUserId", USER_SAFE_DATA);

    //it will just give info about connections
    const data = connectionRequest.map((row) => {
      if (row.fromUserId._id.toString() === loggedInUser._id.toString()) {
        // you are the sender, so the other person is the receiver
        return row.toUserId;
      }
      //if you are not sender, you are receiver
      return row.fromUserId;
    });
    res.json({data});
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});






userRouter.get("/feed", userAuth, async (req, res) => {
  try {


      //string m data ayega req se lekin url m int m chaiye
    const page = parseInt(req.query.page)||1
    let limit = parseInt(req.query.limit)||10
    limit=limit>50?50:limit
    
    const skip = (page-1)*limit


    //cards to avoid showing users such as: his own card profile, card of his connections, card of the people he/she rejected,or people he is rejected by,already sent the connection request

    const loggedInUser = req.user;

    //find all connection request i have sent or received
    const connectionRequests = await ConnectionRequest.find({
      $or: [
        {
          fromUserId: loggedInUser._id,
        },
        {
          toUserId: loggedInUser._id,
        },
      ],
    }).select("fromUserId toUserId");

    const hideUsersFromFeed = new Set();
    connectionRequests.forEach((req) => {
      hideUsersFromFeed.add(req.fromUserId.toString());
      hideUsersFromFeed.add(req.toUserId.toString());
    });

    const user = await User.find({
      $and: [
        { _id: { $nin: Array.from(hideUsersFromFeed) } },
        { _id: { $ne: loggedInUser._id } },
      ],
    }).select(USER_SAFE_DATA).skip(skip).limit(limit)

    res.json({data:user});
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

module.exports = userRouter;
