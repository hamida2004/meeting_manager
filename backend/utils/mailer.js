const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: process.env.MAIL_HOST,
  port: process.env.MAIL_PORT,
  secure: true,
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
});

exports.sendResetEmail = async (to, token) => {
  const resetLink = `${process.env.APP_URL}/reset-password?token=${token}`;

  await transporter.sendMail({
    from: `"Meeting App" <${process.env.MAIL_USER}>`,
    to,
    subject: "Password Reset",
    html: `
      <h2>Password Reset</h2>
      <p>Click the link below to reset your password:</p>
      <a href="${resetLink}">${resetLink}</a>
      <p>This link expires in 15 minutes.</p>
    `,
  });
};