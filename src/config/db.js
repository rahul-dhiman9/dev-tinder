const mongoose = require("mongoose");

const connectDb = async () => {
  await mongoose.connect(
    "mongodb://rahul:rahul23@ac-d1u8wwg-shard-00-00.mnst93m.mongodb.net:27017,ac-d1u8wwg-shard-00-01.mnst93m.mongodb.net:27017,ac-d1u8wwg-shard-00-02.mnst93m.mongodb.net:27017/devTinder?ssl=true&replicaSet=atlas-tw545c-shard-0&authSource=admin&appName=Cluster0",
  );
};

module.exports = {
  connectDb
};
