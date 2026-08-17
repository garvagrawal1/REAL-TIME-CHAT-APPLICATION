const aiService = require('../services/aiService');
const summaryService = require('../services/summaryService');
const moderationService = require('../services/moderationService');
const Message = require('../models/Message');
const Room = require('../models/Room');
const ErrorResponse = require('../utils/errorResponse');

/**
 * @desc    Chat directly with AI Assistant
 * @route   POST /api/ai/chat
 * @access  Private
 */
const chatWithAI = async (req, res, next) => {
  try {
    const { prompt, history } = req.body;

    if (!prompt || !prompt.trim()) {
      return next(new ErrorResponse('Prompt cannot be empty', 400));
    }

    const response = await aiService.generateChatResponse(prompt.trim(), history || []);

    res.status(200).json({
      success: true,
      reply: response,
      timestamp: new Date(),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Summarize chat room discussion
 * @route   POST /api/ai/summarize
 * @access  Private
 */
const summarizeRoomChat = async (req, res, next) => {
  try {
    const { roomId } = req.body;

    if (!roomId) {
      return next(new ErrorResponse('Room ID is required', 400));
    }

    const room = await Room.findById(roomId);
    if (!room) {
      return next(new ErrorResponse('Room not found', 404));
    }

    // Fetch latest 30 messages for summary
    const messages = await Message.find({ room: roomId })
      .sort({ createdAt: -1 })
      .limit(30)
      .populate('sender', 'name username');

    const result = await summaryService.generateRoomSummary(messages.reverse(), room.name);

    res.status(200).json({
      success: true,
      roomName: room.name,
      messageCount: messages.length,
      ...result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Generate smart replies based on recent conversation
 * @route   POST /api/ai/smart-reply
 * @access  Private
 */
const generateSmartReplies = async (req, res, next) => {
  try {
    const { roomId, contextText } = req.body;

    let messages = [];
    if (roomId) {
      messages = await Message.find({ room: roomId })
        .sort({ createdAt: -1 })
        .limit(5)
        .populate('sender', 'name username');
      messages = messages.reverse();
    } else if (contextText) {
      messages = [{ content: contextText, sender: { name: 'User' } }];
    }

    const replies = await aiService.generateSmartReplies(messages);

    res.status(200).json({
      success: true,
      replies,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Improve and polish draft message
 * @route   POST /api/ai/improve
 * @access  Private
 */
const improveMessage = async (req, res, next) => {
  try {
    const { text } = req.body;

    if (!text || !text.trim()) {
      return next(new ErrorResponse('Message text is required for improvement', 400));
    }

    const result = await aiService.improveMessage(text.trim());

    res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Translate a message
 * @route   POST /api/ai/translate
 * @access  Private
 */
const translateMessage = async (req, res, next) => {
  try {
    const { messageId, text, targetLanguage } = req.body;

    let contentToTranslate = text;
    let messageDoc = null;

    if (messageId) {
      messageDoc = await Message.findById(messageId);
      if (messageDoc) {
        // Check if translation already cached
        const lang = targetLanguage || 'English';
        if (messageDoc.translations && messageDoc.translations.get(lang)) {
          return res.status(200).json({
            success: true,
            original: messageDoc.content,
            translated: messageDoc.translations.get(lang),
            language: lang,
            cached: true,
          });
        }
        contentToTranslate = messageDoc.content;
      }
    }

    if (!contentToTranslate || !contentToTranslate.trim()) {
      return next(new ErrorResponse('Text or valid messageId is required', 400));
    }

    const result = await aiService.translateMessage(
      contentToTranslate.trim(),
      targetLanguage || 'English'
    );

    // Cache translation in document if message exists
    if (messageDoc) {
      if (!messageDoc.translations) {
        messageDoc.translations = new Map();
      }
      messageDoc.translations.set(targetLanguage || 'English', result.translated);
      await messageDoc.save();
    }

    res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Intelligent Semantic Search across room messages
 * @route   POST /api/ai/search
 * @access  Private
 */
const searchMessagesAI = async (req, res, next) => {
  try {
    const { query, roomId } = req.body;

    if (!query || !query.trim()) {
      return next(new ErrorResponse('Search query is required', 400));
    }

    const filter = {};
    if (roomId) {
      filter.room = roomId;
    }

    // Limit initial pool to latest 100 messages for rapid responsive AI search
    const pool = await Message.find(filter)
      .sort({ createdAt: -1 })
      .limit(100)
      .populate('sender', 'name username avatar')
      .populate('room', 'name');

    const results = await aiService.searchMessages(query.trim(), pool);

    res.status(200).json({
      success: true,
      query: query.trim(),
      count: results.length,
      results,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Analyze sentiment of a message
 * @route   POST /api/ai/sentiment
 * @access  Private
 */
const analyzeSentiment = async (req, res, next) => {
  try {
    const { text, messageId } = req.body;

    let content = text;
    let messageDoc = null;

    if (messageId) {
      messageDoc = await Message.findById(messageId);
      if (messageDoc) {
        content = messageDoc.content;
      }
    }

    if (!content) {
      return next(new ErrorResponse('Text or messageId is required', 400));
    }

    const result = await aiService.analyzeSentiment(content);

    // Optionally update message model
    if (messageDoc && result.sentiment) {
      messageDoc.sentiment = result.sentiment;
      await messageDoc.save();
    }

    res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Moderate message content for safety
 * @route   POST /api/ai/moderate
 * @access  Private
 */
const moderateContent = async (req, res, next) => {
  try {
    const { content } = req.body;

    if (!content) {
      return next(new ErrorResponse('Content is required', 400));
    }

    const result = await moderationService.checkContentSafety(content);

    res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  chatWithAI,
  summarizeRoomChat,
  generateSmartReplies,
  improveMessage,
  translateMessage,
  searchMessagesAI,
  analyzeSentiment,
  moderateContent,
};
