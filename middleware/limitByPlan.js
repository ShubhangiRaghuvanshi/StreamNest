const streamTracker = {};

module.exports = (req, res, next) => {
  const userId = req.user.id;
  const plan = req.user.plan || 'basic';
  const today = new Date().toISOString().slice(0, 10);

  if (plan === 'premium') return next();

  if (!streamTracker[userId]) streamTracker[userId] = {};
  if (!streamTracker[userId][today]) streamTracker[userId][today] = 0;

  if (plan === 'basic') {
    if (streamTracker[userId][today] >= 3) {
      return res.status(403).json({ error: 'Daily stream limit reached for your plan' });
    }
    streamTracker[userId][today]++;
    return next();
  }

  return res.status(403).json({ error: 'Your plan does not allow video streaming' });
}; 