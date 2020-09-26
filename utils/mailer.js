const nodemailer = require("nodemailer");

exports.sendEmail = async (options) => {
  // 1) Create transporter
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: false,
    auth: {
      user: process.env.EMAIL_USERNAME,
      pass: process.env.EMAIL_PASSWORD,
    },
    // Activate in gmail "less secure app" option
  });

  // 2) Define the email options
  const mailOptions = {
    from: "Franky Venus <frankyvenus@hello.io>",
    to: options.email,
    subject: options.subject,
    text: options.message,
    html: "<h1>Hello man!</h1>",
  };

  // 3) Send the email with nodemailer
  await transporter.sendMail(mailOptions);
};
