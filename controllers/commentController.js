const Comment = require('../models/Comment');
const axios = require('axios');

// Helper: Validate comment (no special characters)
function isValidComment(text) {
  return /^[a-zA-Z0-9\s.,!?]+$/.test(text);
}

// Helper: Translate comment using Google Translate API
async function translateText(text, target = 'en') {
  try {
    const apiKey = process.env.GOOGLE_TRANSLATE_KEY;
    if (!apiKey) {
      console.log('Google Translate API key not found, skipping translation');
      return text; // Return original text if no API key
    }
    const url = `https://translation.googleapis.com/language/translate/v2?key=${apiKey}`;
    const res = await axios.post(url, { q: text, target });
    return res.data.data.translations[0].translatedText;
  } catch (error) {
    console.log('Translation failed:', error.message);
    return text; // Return original text if translation fails
  }
}

// Helper: Get city from IP using GeoIP API
async function getCityFromIP(ip) {
  try {
    const res = await axios.get(`https://ipapi.co/${ip}/json/`);
    return res.data.city || '';
  } catch (error) {
    console.log('Geolocation failed:', error.message);
    return '';
  }
}

const addComment = async (req, res) => {
  try {
    const { text, videoId, lang } = req.body;
    
    // Validate required fields
    if (!text || !videoId) {
      return res.status(400).json({ error: 'Text and videoId are required' });
    }
    
    if (!isValidComment(text)) {
      return res.status(400).json({ error: 'Invalid comment - only letters, numbers, spaces, and basic punctuation allowed' });
    }
    
    // Validate ObjectId format
    if (!require('mongoose').Types.ObjectId.isValid(videoId)) {
      return res.status(400).json({ error: 'Invalid videoId format' });
    }
    
    const translatedText = await translateText(text, lang || 'en');
    const city = await getCityFromIP(req.ip);
    
    const comment = await Comment.create({
      text,
      translatedText,
      user: req.user.id,
      video: videoId,
      city
    });
    
    res.json({ comment });
  } catch (err) {
    console.error('Add comment error:', err);
    res.status(500).json({ error: 'Add comment failed', details: err.message });
  }
};

const likeComment = async (req, res) => {
  try {
    const { id } = req.params;
    const comment = await Comment.findByIdAndUpdate(id, { $inc: { likes: 1 } }, { new: true });
    res.json({ comment });
  } catch (err) {
    res.status(500).json({ error: 'Like failed', details: err.message });
  }
};

const dislikeComment = async (req, res) => {
  try {
    const { id } = req.params;
    const comment = await Comment.findByIdAndUpdate(id, { $inc: { dislikes: 1 } }, { new: true });
    if (comment.dislikes >= 2) {
      await Comment.findByIdAndDelete(id);
      return res.json({ message: 'Comment auto-deleted due to dislikes' });
    }
    res.json({ comment });
  } catch (err) {
    res.status(500).json({ error: 'Dislike failed', details: err.message });
  }
};

const getComments = async (req, res) => {
  try {
    const { videoId } = req.query;
    const comments = await Comment.find({ video: videoId }).populate('user', 'email');
    res.json({ comments });
  } catch (err) {
    res.status(500).json({ error: 'Fetch comments failed', details: err.message });
  }
};

module.exports = { addComment, likeComment, dislikeComment, getComments }; 