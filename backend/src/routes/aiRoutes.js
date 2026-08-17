const express = require('express');
const router = express.Router();
const {
  chatWithAI,
  summarizeRoomChat,
  generateSmartReplies,
  improveMessage,
  translateMessage,
  searchMessagesAI,
  analyzeSentiment,
  moderateContent,
  catchUpChat,
  explainCode,
  fixCode,
} = require('../controllers/aiController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect); // All AI capabilities are protected behind authenticated session

router.post('/chat', chatWithAI);
router.post('/summarize', summarizeRoomChat);
router.post('/smart-reply', generateSmartReplies);
router.post('/improve', improveMessage);
router.post('/translate', translateMessage);
router.post('/search', searchMessagesAI);
router.post('/sentiment', analyzeSentiment);
router.post('/moderate', moderateContent);
router.post('/catch-up', catchUpChat);
router.post('/code/explain', explainCode);
router.post('/code/fix', fixCode);

module.exports = router;
