const downloadTracker = {};

module.exports = (req, res, next) => {
  const userId = req.user.id;
  const today = new Date().toISOString().slice(0, 10);
  if (!downloadTracker[userId]) downloadTracker[userId] = {};
  if (downloadTracker[userId][today]) {
    return res.status(429).json({ error: 'Download limit reached for today' });
  }
  downloadTracker[userId][today] = true;
  next();
};