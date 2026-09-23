const { SendEmailCommand } = require("@aws-sdk/client-ses");

const sesClient = require("./sesClient");

const sendEmail = async ({ to, subject, text, html }) => {
  const command = new SendEmailCommand({
    Source: process.env.SES_FROM_EMAIL,

    Destination: {
      ToAddresses: [to],
    },

    Message: {
      Subject: {
        Charset: "UTF-8",
        Data: subject,
      },

      Body: {
        Text: {
          Charset: "UTF-8",
          Data: text,
        },

        ...(html && {
          Html: {
            Charset: "UTF-8",
            Data: html,
          },
        }),
      },
    },
  });

  const response = await sesClient.send(command);

  return response;
};

module.exports = sendEmail;
