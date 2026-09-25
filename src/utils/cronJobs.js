const cron = require("node-cron");
const { subDays, startOfDay, endOfDay } = require("date-fns");

const ConnectionRequestModel = require("../models/connectionRequest");
const sendEmail = require("./sendEmail");

cron.schedule(
  "0 8 * * *",
  async () => {
    try {
      // Get yesterday's date
      const yesterday = subDays(new Date(), 1);

      const yesterdayStart = startOfDay(yesterday);
      const yesterdayEnd = endOfDay(yesterday);

      // Find all pending friend requests created yesterday
      const pendingRequests = await ConnectionRequestModel.find({
        status: "interested",
        createdAt: {
          $gte: yesterdayStart,
          $lte: yesterdayEnd,
        },
      }).populate("fromUserId toUserId");

      // Get unique recipient emails
      const recipientEmails = [
        ...new Set(pendingRequests.map((request) => request.toUserId.emailId)),
      ];

      // Send only ONE email per recipient
      for (const email of recipientEmails) {
        await sendEmail({
          // Temporary SES sandbox testing
          to: "raadevelopedit@gmail.com",

          // After SES production access:
          // to: email,

          subject: "You have pending friend requests on DevTinder",

          text: "You have pending friend requests on DevTinder. Open DevTinder to review them.",

          html: `
            <h2>Pending Friend Requests</h2>

            <p>
              You have pending friend requests on DevTinder.
            </p>

            <p>
              Open DevTinder to review your requests.
            </p>
          `,
        });

        console.log(`Email sent for recipient: ${email}`);
      }
    } catch (err) {
      console.error("Cron email error:", err);
    }
  },
  {
    timezone: "Asia/Kolkata",
  },
);
