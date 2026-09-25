const express = require("express");
const { userAuth } = require("../middlewares/auth");
const razorpayInstance = require("../utils/razorpay");
const paymentRouter = express.Router();
const Payment = require("../models/payment");
const { membershipAmount } = require("../utils/constants");
const { error } = require("node:console");
const {
  validateWebhookSignature,
} = require("razorpay/dist/utils/razorpay-utils");
const User = require("../models/user");

paymentRouter.post("/payment/create", userAuth, async (req, res) => {
  try {
    const { firstName, lastName } = req.user;
    const { memberShipType } = req.body;
    // const amount = plan === "pro" ? 49900 : 99900; // decide server-side

    const order = await razorpayInstance.orders.create({
      amount: membershipAmount[memberShipType] * 100,
      currency: "INR",
      receipt: `rcpt_${Date.now()}`,
      notes: {
        firstName: firstName,
        lastName: lastName,
        memberShipType: memberShipType /**,plan*/,
      },
    });

    // Save to DB with status "created"
    const payment = await new Payment({
      userId: req.user._id,
      orderId: order.id,
      receipt: order.receipt,
      amount: order.amount,
      currency: order.currency,
      status: order.status,
      notes: order.notes,
    });

    const savedPayment = await payment.save();

    res.json({ ...savedPayment.toJSON(), keyId: process.env.RAZORPAY_KEY_ID });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
paymentRouter.post("/payment/webhook", async () => {
  try {
    const webhookSignature = req.get["X-Razorpay-Signature"];
    const isWebHookValid = validateWebhookSignature(
      JSON.stringify(req.body),
      webhookSignature,
      webhookSecret,
    );
    if (!isWebHookValid) {
      return res
        .status(400)
        .json({ message: "webhook signature is not valid" });
    }

    //update my payment status in db if webhook valid and update the user as premium

    const paymentDetails = req.body.payload.payment.entity
    const payment = await Payment.findOne({orderId:paymentDetails.order_id}) 
    payment.status = paymentDetails.status
    await payment.save()
    const user = await User.findOne({_id:payment.userId})
    user.isPremium=true
    user.memberShipType = payment.notes.membershipType
    await user.save()

    // if (req.body.event == "payment.captured") {
    // }

    // if (req.body.event == "payment.failed") {
    // }

    //return success response to razorpay
    return res.status(200).json({ msg: "webhook received successfully" });
  } catch (err) {
    console.error(err);
  }
});

module.exports = paymentRouter;
