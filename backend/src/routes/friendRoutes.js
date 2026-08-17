const express = require('express');
const router = express.Router();
const {
  getFriends,
  getFriendRequests,
  sendFriendRequest,
  acceptFriendRequest,
  rejectFriendRequest,
  searchUsers,
  getOrCreateDM,
} = require('../controllers/friendController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect); // All routes require authentication

router.get('/', getFriends);
router.get('/requests', getFriendRequests);
router.get('/search', searchUsers);
router.post('/request/:targetUserId', sendFriendRequest);
router.post('/accept/:requestId', acceptFriendRequest);
router.post('/reject/:requestId', rejectFriendRequest);
router.post('/dm/:friendId', getOrCreateDM);

module.exports = router;
