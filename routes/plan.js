const express = require('express');
const router = express.Router();
const controller = require('../controllers/planController');
const verifyToken = require('../middleware/auth');

router.post('/order', verifyToken, controller.createOrder);
router.post('/webhook', controller.handleWebhook);

module.exports = router; 