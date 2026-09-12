const mongoose = require("mongoose");

const userSchema = mongoose.Schema({
  firstName: {
    type: String,
    required: true,
    minLength:4,
    maxLength:20,
  },
  lastName: {
    type: String,
  },
  emailId: {
    type: String,
    required: true,
    lowercase:true,
    trim:true,
  },
  password: {
    type: String,
    required: true,
    unique: true,
  },
  age: {
    min:18,
    max:100,
    type: Number,
  },
  gender: {
    validate(value){
      if(!["male","female","others"].includes(value)){
        throw new Error("gender is not specified",err.message)
      } 
    },
    type: String,
  },
  photoUrl: {
    type: String,
    default:"https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTro-iMp3rwLVEqt6I6NyOlW4JpSkSezwVXo1xiLPGSMQ&s=10"
  },
  about:{
    type:String,
    default:"Just match na matachaa!",
    minLength:20,
    maxLength:200,
  },
  skills:{
    type:[String],
    minLength:20,
    maxLength:200,
  }
},
{
  timestamps:true
}
);

const User = mongoose.model("User", userSchema);
module.exports = User;
