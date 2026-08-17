const express = require('express');
const router = express.Router();
const {
  getMessagesByRoom,
  createMessage,
  deleteMessage,
} = require('../controllers/messageController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect); // All message routes require authentication

router.route('/:roomId')
  .get(getMessagesByRoom)
  .post(createMessage);

router.route('/item/:messageId')
  .delete(deleteMessage);

module.exports = router;
