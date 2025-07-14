const fs = require('fs');
const path = require('path');
const Video = require('../models/Video');
const multer = require('multer');
const uploadPath = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadPath)) fs.mkdirSync(uploadPath);
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadPath),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage });
const uploadMiddleware = upload.fields([
  { name: 'video_1080p', maxCount: 1 },
  { name: 'video_720p', maxCount: 1 },
  { name: 'video_480p', maxCount: 1 }
]);

const uploadVideo = async (req, res) => {
  try {
    const { title, description } = req.body;
    const resolutions = [];
    ['video_1080p', 'video_720p', 'video_480p'].forEach(q => {
      if (req.files[q]) {
        resolutions.push({
          quality: q.replace('video_', ''),
          url: `/uploads/${req.files[q][0].filename}`
        });
      }
    });
    const video = await Video.create({
      title,
      description,
      resolutions,
      uploader: req.user.id
    });
    res.json({ message: 'Video uploaded', video });
  } catch (err) {
    res.status(500).json({ error: 'Upload failed', details: err.message });
  }
};

const fetchVideos = async (req, res) => {
  const videos = await Video.find().sort({ createdAt: -1 });
  res.json({ videos });
};

const streamVideo = async (req, res) => {
  try {
    const { id } = req.params;
    const { quality = '720p' } = req.query;
    const video = await Video.findById(id);
    if (!video) return res.status(404).json({ error: 'Video not found' });
    const resObj = video.resolutions.find(r => r.quality === quality);
    if (!resObj) return res.status(404).json({ error: 'Resolution not found' });
    const filePath = path.join(__dirname, '..', resObj.url);
    const stat = fs.statSync(filePath);
    const range = req.headers.range;
    if (!range) {
      res.writeHead(200, {
        'Content-Length': stat.size,
        'Content-Type': 'video/mp4',
      });
      fs.createReadStream(filePath).pipe(res);
    } else {
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : stat.size - 1;
      const chunkSize = end - start + 1;
      const file = fs.createReadStream(filePath, { start, end });
      res.writeHead(206, {
        'Content-Range': `bytes ${start}-${end}/${stat.size}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunkSize,
        'Content-Type': 'video/mp4',
      });
      file.pipe(res);
    }
  } catch (err) {
    res.status(500).json({ error: 'Stream failed', details: err.message });
  }
};

const handleDownload = async (req, res) => {
  try {
    const { id } = req.params;
    const { quality = '720p' } = req.query;
    const video = await Video.findById(id);
    if (!video) return res.status(404).json({ error: 'Video not found' });
    const resObj = video.resolutions.find(r => r.quality === quality);
    if (!resObj) return res.status(404).json({ error: 'Resolution not found' });
    const filePath = path.join(__dirname, '..', resObj.url);
    res.download(filePath);
  } catch (err) {
    res.status(500).json({ error: 'Download failed', details: err.message });
  }
};

module.exports = {
  uploadMiddleware,
  uploadVideo,
  fetchVideos,
  streamVideo,
  handleDownload
}; 