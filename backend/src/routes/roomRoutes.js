const express = require('express');
const router = express.Router();
const {
  getRooms,
  createRoom,
  getRoomById,
  joinRoom,
  leaveRoom,
} = require('../controllers/roomController');
const { protect } = require('../middleware/authMiddleware');
const { validateRoom } = require('../middleware/validationMiddleware');

router.use(protect); // All room routes require authentication

router.route('/')
  .get(getRooms)
  .post(validateRoom, createRoom);

router.route('/:roomId')
  .get(getRoomById);

router.post('/:roomId/join', joinRoom);
router.post('/:roomId/leave', leaveRoom);

module.exports = router;
