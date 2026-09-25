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

// Fail loudly at startup if the webhook secret is missing — otherwise
// validateWebhookSignature() silently gets `undefined` and every
// webhook call fails signature verification with no clear reason.
if (!webhookSecret) {
  console.error(
    "[payment] RAZORPAY_WEBHOOK_SECRET is not set. Webhook verification will fail.",
  );
}

/**
 * POST /payment/create
 * Creates a Razorpay order for the logged-in user and stores a
 * corresponding "created" Payment record in our DB. The frontend
 * uses the returned order + keyId to open the Razorpay checkout.
 */
paymentRouter.post("/payment/create", userAuth, async (req, res) => {
  try {
    const { firstName, lastName } = req.user;
    const { memberShipType } = req.body;

    // Validate membership type BEFORE calling Razorpay — otherwise
    // an unknown type silently becomes NaN * 100 and Razorpay
    // returns a confusing error instead of a clean 400.
    const amount = membershipAmount[memberShipType];
    if (!amount) {
      console.warn(
        `[payment] Invalid memberShipType "${memberShipType}" from user ${req.user._id}`,
      );
      return res.status(400).json({ error: "Invalid membership type" });
    }

    console.log(
      `[payment] Creating order for user ${req.user._id}, type=${memberShipType}, amount=${amount}`,
    );

    const order = await razorpayInstance.orders.create({
      amount: amount * 100, // Razorpay expects amount in the smallest unit (paise)
      currency: "INR",
      receipt: `rcpt_${Date.now()}`,
      notes: {
        firstName,
        lastName,
        memberShipType,
      },
    });

    console.log(`[payment] Razorpay order created: ${order.id}`);

    // Save to DB with status "created" — this row gets updated
    // to "captured"/"failed" etc. later by the webhook handler.
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

    console.log(`[payment] Payment record saved: ${savedPayment._id}`);

    res.json({
      ...savedPayment.toJSON(),
      keyId: process.env.RAZORPAY_KEY_ID,
    });
  } catch (err) {
    console.error("[payment] /payment/create failed:", err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /payment/webhook
 * Called by Razorpay's servers when a payment event happens.
 *
 * Note: this relies on the global `express.json()` middleware in
 * app.js to parse req.body, then re-stringifies it to check the
 * signature — same pattern Razorpay's own docs use. It works fine
 * for normal traffic; the only theoretical gap is that
 * JSON.stringify(JSON.parse(raw)) isn't 100% guaranteed to match
 * the original raw bytes in every edge case (unusual number
 * formatting, escaped unicode, etc.). Fine to leave as-is unless
 * this goes to real production with real transactions.
 */
paymentRouter.post("/payment/webhook", async (req, res) => {
  try {
    const webhookSignature = req.get("X-Razorpay-Signature");

    if (!webhookSignature) {
      console.warn("[webhook] Missing X-Razorpay-Signature header");
      return res.status(400).json({ message: "Missing signature header" });
    }

    const isWebHookValid = validateWebhookSignature(
      JSON.stringify(req.body),
      webhookSignature,
      webhookSecret,
    );

    if (!isWebHookValid) {
      console.warn("[webhook] Invalid signature — rejecting request");
      return res.status(400).json({
        message: "webhook signature is not valid",
      });
    }

    // Signature confirmed valid — safe to trust req.body now.
    const paymentDetails = req.body.payload.payment.entity;

    console.log(
      `[webhook] Verified event="${req.body.event}" order_id=${paymentDetails.order_id}`,
    );

    const payment = await Payment.findOne({
      orderId: paymentDetails.order_id,
    });

    if (!payment) {
      console.warn(
        `[webhook] No Payment record found for order_id=${paymentDetails.order_id}`,
      );
      return res.status(404).json({
        message: "Payment not found",
      });
    }

    // Idempotency guard: Razorpay may retry the same webhook event
    // (e.g. if our server timed out replying last time). If we've
    // already recorded this exact status, skip reprocessing so we
    // don't redo side effects (like re-granting premium) twice.
    if (payment.status === paymentDetails.status) {
      console.log(
        `[webhook] Payment ${payment._id} already at status "${payment.status}" — skipping duplicate`,
      );
      return res.status(200).json({ msg: "already processed" });
    }

    payment.status = paymentDetails.status;
    await payment.save();

    console.log(
      `[webhook] Payment ${payment._id} status updated to "${paymentDetails.status}"`,
    );

    const user = await User.findById(payment.userId);

    if (!user) {
      console.warn(`[webhook] No User found for id=${payment.userId}`);
      return res.status(404).json({
        message: "User not found",
      });
    }

    if (req.body.event === "payment.captured") {
      user.isPremium = true;
      user.memberShipType = payment.notes.memberShipType;
      await user.save();
      console.log(
        `[webhook] User ${user._id} upgraded to premium (${payment.notes.memberShipType})`,
      );
    }

    // TODO: handle "payment.failed" if you want to notify the user
    // or clean up the pending order on their account.

    // Always return 200 quickly once processed successfully —
    // Razorpay will retry on non-2xx responses.
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

module.exports = paymentRouter;
