const mongoose = require("mongoose");
require("dotenv").config();

const uri = process.env.DB_URL;
const connectDb = async () => {
  await mongoose.connect(uri);
};

module.exports = {
  connectDb,
};
