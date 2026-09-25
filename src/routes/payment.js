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


// ===============================
// CREATE PAYMENT ORDER
// ===============================

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
    console.error(err);

    res.status(500).json({
      error: err.message,
    });
  }
});


// ===============================
// RAZORPAY WEBHOOK
// ===============================

const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

paymentRouter.post(
  "/payment/webhook",

  express.raw({ type: "application/json" }),

  async (req, res) => {
    try {

      console.log("🔥 WEBHOOK RECEIVED");


      // Razorpay sends the signature in this header
      const webhookSignature =
        req.get("X-Razorpay-Signature");

      console.log(
        "SIGNATURE:",
        webhookSignature
      );


      // req.body is a Buffer because we used express.raw()
      // Convert the Buffer into the exact raw JSON string
      // that Razorpay sent.
      const rawBody = req.body.toString();

      console.log(
        "RAW BODY RECEIVED:",
        rawBody
      );


      // Verify that the webhook really came from Razorpay
      const isWebHookValid =
        validateWebhookSignature(
          rawBody,
          webhookSignature,
          webhookSecret
        );

      console.log(
        "SIGNATURE VALID:",
        isWebHookValid
      );


      if (!isWebHookValid) {

        return res.status(400).json({
          message: "webhook signature is not valid",
        });

      }


      // Signature is valid.
      // Now convert the raw JSON string into a JavaScript object.
      const webhookData =
        JSON.parse(rawBody);


      console.log(
        "EVENT:",
        webhookData.event
      );


      // ===============================
      // PAYMENT CAPTURED
      // ===============================

      if (webhookData.event === "payment.captured") {

        const paymentDetails =
          webhookData.payload.payment.entity;


        console.log(
          "RAZORPAY ORDER ID:",
          paymentDetails.order_id
        );


        console.log(
          "RAZORPAY PAYMENT ID:",
          paymentDetails.id
        );


        console.log(
          "RAZORPAY PAYMENT STATUS:",
          paymentDetails.status
        );


        // Find our Payment document using
        // Razorpay's order_id
        const payment =
          await Payment.findOne({
            orderId: paymentDetails.order_id,
          });


        console.log(
          "DB PAYMENT:",
          payment
        );


        if (!payment) {

          console.log(
            "❌ Payment not found in database"
          );

          return res.status(404).json({
            message: "Payment not found",
          });

        }


        // Update payment status in DB
        payment.status =
          paymentDetails.status;

        await payment.save();


        console.log(
          "✅ Payment status updated:",
          payment.status
        );


        // Find the user who made the payment
        const user =
          await User.findById(
            payment.userId
          );


        if (!user) {

          console.log(
            "❌ User not found"
          );

          return res.status(404).json({
            message: "User not found",
          });

        }


        // update my payment status in db if webhook valid
        // and update the user as premium

        user.isPremium = true;

        user.memberShipType =
          payment.notes.memberShipType;


        await user.save();


        console.log(
          "✅ User upgraded to Premium"
        );

      }


      // ===============================
      // PAYMENT FAILED
      // ===============================

      if (webhookData.event === "payment.failed") {

        const paymentDetails =
          webhookData.payload.payment.entity;


        console.log(
          "❌ PAYMENT FAILED:",
          paymentDetails.order_id
        );


        const payment =
          await Payment.findOne({
            orderId: paymentDetails.order_id,
          });


        if (payment) {

          payment.status =
            paymentDetails.status;

          await payment.save();

          console.log(
            "Payment marked as:",
            payment.status
          );

        }

      }


      // if (req.body.event == "payment.captured") {
      // }

      // if (req.body.event == "payment.failed") {
      // }


      // return success response to razorpay
      return res.status(200).json({
        msg: "webhook received successfully",
      });


    } catch (err) {

      console.error(
        "❌ WEBHOOK ERROR:",
        err
      );


      return res.status(500).json({
        message: "Webhook processing failed",
      });

    }
  }
);


module.exports = paymentRouter;