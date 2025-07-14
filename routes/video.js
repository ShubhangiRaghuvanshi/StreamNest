const express = require('express');
const router = express.Router();
const controller = require('../controllers/videoController');
const verifyToken = require('../middleware/auth');
const limitByPlan = require('../middleware/limitByPlan');
const limitDownload = require('../middleware/limitDownload');

console.log('verifyToken:', typeof verifyToken);
console.log('uploadMiddleware:', typeof controller.uploadMiddleware);
console.log('uploadVideo:', typeof controller.uploadVideo);


router.post('/upload', verifyToken, controller.uploadMiddleware, controller.uploadVideo);

router.get('/', verifyToken, controller.fetchVideos);

router.get('/stream/:id', verifyToken, limitByPlan, controller.streamVideo);
router.post('/download/:id', verifyToken, limitDownload, controller.handleDownload);

module.exports = router; 