const express = require('express');
const router = express.Router();
const controller = require('../controllers/groupController');
const verifyToken = require('../middleware/auth');

router.post('/', verifyToken, controller.createGroup);
router.put('/:id', verifyToken, controller.updateGroup);
router.delete('/:id', verifyToken, controller.deleteGroup);
router.post('/:id/invite', verifyToken, controller.inviteUser);
router.get('/search', verifyToken, controller.searchGroups);

module.exports = router; 