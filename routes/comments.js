const express = require('express');
const router = express.Router();
const controller = require('../controllers/commentController');
const verifyToken = require('../middleware/auth');

router.post('/', verifyToken, controller.addComment);
router.post('/:id/like', verifyToken, controller.likeComment);
router.post('/:id/dislike', verifyToken, controller.dislikeComment);
router.get('/', controller.getComments);

module.exports = router; 