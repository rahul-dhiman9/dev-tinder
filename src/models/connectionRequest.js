const mongoose = require("mongoose");

const connectionRequestSchema = new mongoose.Schema({
  fromUserId: {
    type: mongoose.Schema.Types.ObjectId,
    required:true,
    ref:"User" //reference to the User collection

  },
  toUserId: {
    ref:"User",
    type: mongoose.Schema.Types.ObjectId,
    required:true,

  },
  status:{
    type:String,
    required:true,
    enum:{values:["ignored","interested","accepted","rejected"],
      message:`{VALUE} is incorrect status type`
    } 
  }
},
{
  timestamps:true,
}
);


connectionRequestSchema.index({fromUserId:1,toUserId:1})


//every time before save    //apne app ko toh nhi bhejra request
connectionRequestSchema.pre("save",async function(){
  const connectionRequest = this;
  //check if fromUserId is same as toUserId
  if(connectionRequest.fromUserId.equals(connectionRequest.toUserId)){
    throw new Error("you can not send request to yourself")
  }
})


const ConnectionRequestModel =  mongoose.model("ConnectionRequest",connectionRequestSchema)
module.exports = ConnectionRequestModel