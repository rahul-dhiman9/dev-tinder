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

const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

// Fail early if webhook secret is missing
if (!webhookSecret) {
  console.error(
    "[payment] RAZORPAY_WEBHOOK_SECRET is not set. Webhook verification will fail.",
  );
}

// Create Razorpay payment order
paymentRouter.post("/payment/create", userAuth, async (req, res) => {
  try {
    const { firstName, lastName } = req.user;
    const { memberShipType } = req.body;

    const amount = membershipAmount[memberShipType];

    if (!amount) {
      return res.status(400).json({
        error: "Invalid membership type",
      });
    }

    const order = await razorpayInstance.orders.create({
      amount: amount * 100,
      currency: "INR",
      receipt: `rcpt_${Date.now()}`,
      notes: {
        firstName,
        lastName,
        memberShipType,
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
    res.status(500).json({
      error: err.message,
    });
  }
});

// Razorpay webhook
paymentRouter.post("/payment/webhook", async (req, res) => {
  try {
    const webhookSignature = req.get("X-Razorpay-Signature");

    if (!webhookSignature) {
      return res.status(400).json({
        message: "Missing signature header",
      });
    }

    // Verify webhook using the request body and Razorpay secret
    const isWebHookValid = validateWebhookSignature(
      JSON.stringify(req.body),
      webhookSignature,
      webhookSecret,
    );

    if (!isWebHookValid) {
      return res.status(400).json({
        message: "webhook signature is not valid",
      });
    }

    const paymentDetails = req.body.payload.payment.entity;

    const payment = await Payment.findOne({
      orderId: paymentDetails.order_id,
    });

    if (!payment) {
      return res.status(404).json({
        message: "Payment not found",
      });
    }

    // Update payment status
    payment.status = paymentDetails.status;
    await payment.save();

    const user = await User.findById(payment.userId);

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    if (req.body.event === "payment.captured") {
      const newMembership = payment.notes?.memberShipType;

      if (!newMembership) {
        return res.status(400).json({
          message: "Membership type missing",
        });
      }

      if (payment.userId.toString() !== user._id.toString()) {
        return res.status(403).json({
          message: "Payment does not belong to this user",
        });
      }

      if (user.isPremium && user.memberShipType === "gold") {
        return res.status(400).json({
          message: "You already have a Gold membership",
        });
      }

      if (
        user.isPremium &&
        user.memberShipType === "silver" &&
        newMembership !== "gold"
      ) {
        return res.status(400).json({
          message: "Silver members can only upgrade to Gold",
        });
      }

      user.isPremium = true;
      user.memberShipType = newMembership;

      await user.save();
    }

    if (req.body.event === "payment.failed") {
      return res.status(200).json({
        msg: "Payment failure received",
      });
    }

    // Return success response to Razorpay
    return res.status(200).json({
      msg: "webhook received successfully",
    });
  } catch (err) {
    console.error("[webhook] Processing failed:", err);

    return res.status(500).json({
      message: "Webhook processing failed",
    });
  }
});

paymentRouter.get("/premium/verify", userAuth, async (req, res) => {
  const user = req.user;

  return res.status(200).json({
    isPremium: user.isPremium,
    memberShipType: user.memberShipType || null,
  });
});

module.exports = paymentRouter;
