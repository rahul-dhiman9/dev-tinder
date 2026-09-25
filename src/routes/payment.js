const express = require("express");
const { userAuth } = require("../middlewares/auth");
const razorpayInstance = require("../utils/razorpay");
const paymentRouter = express.Router();
const Payment = require("../models/payment");
const { membershipAmount } = require("../utils/constants");

const {
  validateWebhookSignature,
} = require("razorpay/dist/utils/razorpay-utils");

const User = require("../models/user");

paymentRouter.post("/payment/create", userAuth, async (req, res) => {
  try {
    const { firstName, lastName } = req.user;
    const { memberShipType } = req.body;

    const order = await razorpayInstance.orders.create({
      amount: membershipAmount[memberShipType] * 100,
      currency: "INR",
      receipt: `rcpt_${Date.now()}`,
      notes: {
        firstName: firstName,
        lastName: lastName,
        memberShipType: memberShipType,
      },
    });

    // Save to DB with status "created"
    const payment = new Payment({
      userId: req.user._id,
      orderId: order.id,
      receipt: order.receipt,
      amount: order.amount,
      currency: order.currency,
      status: order.status,
      notes: order.notes,
    });

    const savedPayment = await payment.save();

    res.json({
      ...savedPayment.toJSON(),
      keyId: process.env.RAZORPAY_KEY_ID,
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;


// Webhook
paymentRouter.post(
  "/payment/webhook",

  // Razorpay sends JSON, but we need the original body
  // for signature verification.
  express.raw({ type: "application/json" }),

  async (req, res) => {
    try {

      const webhookSignature =
        req.get("X-Razorpay-Signature");

      const isWebHookValid =
        validateWebhookSignature(
          req.body.toString(),
          webhookSignature,
          webhookSecret
        );

      if (!isWebHookValid) {
        return res.status(400).json({
          message: "webhook signature is not valid",
        });
      }

      // Signature is valid, so convert Buffer into JavaScript object
      const webhookData =
        JSON.parse(req.body.toString());

      const paymentDetails =
        webhookData.payload.payment.entity;

      const payment = await Payment.findOne({
        orderId: paymentDetails.order_id,
      });

      if (!payment) {
        return res.status(404).json({
          message: "Payment not found",
        });
      }

      payment.status = paymentDetails.status;

      await payment.save();

      const user = await User.findById(payment.userId);

      if (!user) {
        return res.status(404).json({
          message: "User not found",
        });
      }

      // update my payment status in db if webhook valid and update the user as premium

      if (webhookData.event === "payment.captured") {

        user.isPremium = true;

        user.memberShipType =
          payment.notes.memberShipType;

        await user.save();
      }

      // if (req.body.event == "payment.captured") {
      // }

      // if (req.body.event == "payment.failed") {
      // }

      //return success response to razorpay
      return res.status(200).json({
        msg: "webhook received successfully",
      });

    } catch (err) {

      console.error(err);

      return res.status(500).json({
        message: "Webhook processing failed",
      });
    }
  }
);


module.exports = paymentRouter;