const razorpay = require('../config/razorpay');
const User = require('../models/User');
const nodemailer = require('nodemailer');
const crypto = require('crypto');

const PLAN_PRICES = {
  bronze: 10,
  silver: 50,
  gold: 100
};

const createOrder = async (req, res) => {
  try {
    const { plan } = req.body;
    if (!PLAN_PRICES[plan]) return res.status(400).json({ error: 'Invalid plan' });
    const options = {
      amount: PLAN_PRICES[plan] * 100,
      currency: 'INR',
      receipt: `receipt_${plan}_${Date.now()}`
    };
    const order = await razorpay.orders.create(options);
    res.json({ order });
  } catch (err) {
    res.status(500).json({ error: 'Order creation failed', details: err.message });
  }
};

const handleWebhook = async (req, res) => {
  // Verify Razorpay webhook signature
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  const signature = req.headers['x-razorpay-signature'];
  const body = JSON.stringify(req.body);
  const expectedSignature = crypto.createHmac('sha256', secret).update(body).digest('hex');
  if (signature !== expectedSignature) {
    return res.status(400).json({ error: 'Invalid webhook signature' });
  }
  try {
    const { payload } = req.body;
    const payment = payload && payload.payment && payload.payment.entity;
    if (!payment) return res.status(400).json({ error: 'Invalid webhook payload' });
    // Find user by email or custom field (assume email in notes)
    const user = await User.findOne({ email: payment.notes && payment.notes.email });
    if (!user) return res.status(404).json({ error: 'User not found' });
    // Upgrade plan based on amount
    let plan = 'bronze';
    if (payment.amount === 1000) plan = 'bronze';
    else if (payment.amount === 5000) plan = 'silver';
    else if (payment.amount === 10000) plan = 'gold';
    user.plan = plan;
    await user.save();
    // Send invoice
    await sendInvoice(user.email, payment);
    res.json({ message: 'Plan upgraded and invoice sent' });
  } catch (err) {
    res.status(500).json({ error: 'Webhook handling failed', details: err.message });
  }
};

async function sendInvoice(email, payment) {
  // Use nodemailer to send invoice
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Your Payment Invoice',
    text: `Thank you for your payment. Details:\nOrder ID: ${payment.order_id}\nAmount: ₹${payment.amount/100}\nStatus: ${payment.status}`
  };
  await transporter.sendMail(mailOptions);
}

module.exports = { createOrder, handleWebhook }; 