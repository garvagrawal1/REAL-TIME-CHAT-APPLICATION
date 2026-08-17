const aiService = require('./aiService');

/**
 * Summary Service
 * Formats room message context and coordinates AI summarization
 */
class SummaryService {
  /**
   * Summarize a room's recent messages with intelligent limit caps
   * @param {Array} messages - Message array from DB
   * @param {string} roomName - Room display name
   * @returns {Promise<Object>} Summarization object
   */
  async generateRoomSummary(messages, roomName) {
    // Cap at most 30 recent messages to optimize token usage and response time
    const boundedMessages = messages.slice(-30);
    return await aiService.summarizeMessages(boundedMessages, roomName);
  }
}

module.exports = new SummaryService();
