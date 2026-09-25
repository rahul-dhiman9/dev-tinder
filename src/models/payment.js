const mongoose = require("mongoose");
const { timeStamp } = require("node:console");
const paymentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Types.ObjectId,
      ref: "User",
    },
    PaymentId: {
      type: String,
    },
    orderId: {
      type: String,
      require: true,
    },
    status: {
      type: String,
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    currency: {
      type: String,
      required: true,
    },
    notes: {
      firstName: {
        type: String,
      },
      lastName: {
        type: String,
      },
      memberShipType: {
        type: String,
      },
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Payment", paymentSchema);
