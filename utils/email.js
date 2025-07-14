// Utility to send OTP via email using Nodemailer will be implemented here 
const nodemailer = require('nodemailer');

exports.sendEmailOtp = async (email, otp) => {
  // Configure transporter (use real credentials in production)
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Your OTP Code',
    text: `Your OTP is: ${otp}`,
  };
  await transporter.sendMail(mailOptions);
}; 