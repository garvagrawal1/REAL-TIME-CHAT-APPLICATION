const aiService = require('./aiService');

/**
 * Moderation Service
 * Inspects messages for inappropriate, spam, or toxic content
 */
class ModerationService {
  /**
   * Check message safety
   * @param {string} content - Message text
   * @returns {Promise<{isSafe: boolean, flags: Array<string>}>}
   */
  async checkContentSafety(content) {
    return await aiService.moderateMessage(content);
  }
}

module.exports = new ModerationService();
