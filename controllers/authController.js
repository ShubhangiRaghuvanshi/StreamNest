// signup, login, sendOtp, and verifyOtp controller methods will be implemented here 
const jwt = require('jsonwebtoken');
const { sendEmailOtp } = require('../utils/email');
const { sendMobileOtp } = require('../utils/mobile'); // To be created
const { getStateFromIP } = require('../utils/geolocation');
const User = require('../models/User'); // To be created

// Mock OTP store (in-memory for now)
const otpStore = {};

// Helper: Determine if state is in South India
const isSouthIndia = (state) => {
  const southStates = ['Andhra Pradesh', 'Karnataka', 'Kerala', 'Tamil Nadu', 'Telangana'];
  return southStates.includes(state);
};

// Send OTP (signup/login)
exports.sendOtp = async (req, res) => {
  const { email, mobile } = req.body;
  const ip = req.ip;
  const state = await getStateFromIP(ip);
  let otp = Math.floor(100000 + Math.random() * 900000).toString();

  // Store OTP with identifier
  const identifier = email || mobile;
  otpStore[identifier] = { otp, expires: Date.now() + 5 * 60 * 1000, state };

  try {
    if (isSouthIndia(state) && email) {
      await sendEmailOtp(email, otp);
      return res.json({ message: 'OTP sent to email', via: 'email', state });
    } else if (mobile) {
      await sendMobileOtp(mobile, otp); // To be implemented
      return res.json({ message: 'OTP sent to mobile', via: 'mobile', state });
    } else {
      return res.status(400).json({ error: 'No valid contact method' });
    }
  } catch (err) {
    console.error('OTP send error:', err);
    return res.status(500).json({ error: 'Failed to send OTP', details: err.message });
  }
};


exports.verifyOtp = async (req, res) => {
  const { email, mobile, otp } = req.body;
  const identifier = email || mobile;
  const record = otpStore[identifier];
  if (!record || record.otp !== otp || record.expires < Date.now()) {
    return res.status(400).json({ error: 'Invalid or expired OTP' });
  }

  let user = await User.findOne({ $or: [{ email }, { mobile }] });
  if (!user) {
    user = await User.create({ email, mobile, state: record.state });
  }
 
  const token = jwt.sign({ id: user._id, state: record.state }, process.env.JWT_SECRET, { expiresIn: '30d' });
  delete otpStore[identifier];
  return res.json({ token, user });
}; 