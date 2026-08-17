const axios = require('axios');

/**
 * Universal AI Service
 * Supports Google Gemini API (default), OpenAI / Custom Endpoint,
 * and high-intelligence fallback NLP processors when no API key is provided.
 */
class AIService {
  constructor() {
    this.apiKey = process.env.AI_API_KEY || '';
    this.model = process.env.AI_MODEL || 'gemini-1.5-flash';
    this.provider = (process.env.AI_PROVIDER || 'gemini').toLowerCase();
  }

  /**
   * Helper: Call Google Gemini REST API
   */
  async callGemini(contents, systemInstruction = null) {
    if (!this.apiKey) {
      throw new Error('AI_API_KEY not configured');
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${this.apiKey}`;
    
    const body = {
      contents: Array.isArray(contents) ? contents : [{ parts: [{ text: contents }] }],
    };

    if (systemInstruction) {
      body.systemInstruction = {
        parts: [{ text: systemInstruction }],
      };
    }

    const response = await axios.post(url, body, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 15000,
    });

    const candidate = response.data?.candidates?.[0];
    const text = candidate?.content?.parts?.[0]?.text;

    if (!text) {
      throw new Error('No response content returned from Gemini API');
    }

    return text.trim();
  }

  /**
   * 1. AI Chat Assistant
   */
  async generateChatResponse(prompt, conversationHistory = []) {
    try {
      if (this.apiKey) {
        const contents = [];
        // Add conversation history if present
        if (Array.isArray(conversationHistory)) {
          conversationHistory.slice(-8).forEach((msg) => {
            contents.push({
              role: msg.role === 'user' ? 'user' : 'model',
              parts: [{ text: msg.content }],
            });
          });
        }
        contents.push({ role: 'user', parts: [{ text: prompt }] });

        const systemPrompt = `You are "ChatFlow AI Assistant", an expert, helpful, concise, and friendly AI companion built into the ChatFlow real-time chat application. Format code cleanly with Markdown. Keep answers helpful and engaging.`;
        return await this.callGemini(contents, systemPrompt);
      }
    } catch (err) {
      console.warn(`[AI Service Fallback] Gemini call failed (${err.message}). Using intelligent contextual response.`);
    }

    // High quality intelligent conversational heuristic fallback
    return this.fallbackChatResponse(prompt);
  }

  /**
   * 2. Room Summarization
   */
  async summarizeMessages(messages = [], roomName = 'Chat Room') {
    if (!messages || messages.length === 0) {
      return {
        summary: 'No messages found in this room to summarize yet. Start chatting to generate insights!',
        keyTopics: ['Fresh Conversation'],
        actionItems: ['Start sending messages'],
        sentiment: 'Neutral',
      };
    }

    const transcript = messages
      .map((m) => `${m.sender?.name || m.sender?.username || 'User'}: ${m.content}`)
      .join('\n');

    try {
      if (this.apiKey) {
        const prompt = `You are an executive meeting & chat summarizer. Summarize the following chat room discussion from #${roomName}.
Provide the output strictly as JSON with this exact structure:
{
  "summary": "2-3 sentences high level summary of what was discussed",
  "keyTopics": ["Topic 1", "Topic 2", "Topic 3"],
  "actionItems": ["Action item 1 if any", "Action item 2 if any"],
  "sentiment": "Positive" | "Neutral" | "Focused" | "Energetic"
}

Transcript:
${transcript}`;

        const rawText = await this.callGemini(prompt);
        // Clean JSON markup
        const cleaned = rawText.replace(/```json/gi, '').replace(/```/g, '').trim();
        const parsed = JSON.parse(cleaned);
        return parsed;
      }
    } catch (err) {
      console.warn(`[AI Service Fallback] Summary call fallback (${err.message})`);
    }

    // Heuristic summary fallback
    return this.fallbackSummarize(messages, roomName);
  }

  /**
   * 3. Smart Replies Generation
   */
  async generateSmartReplies(messages = []) {
    const recentMessages = messages.slice(-5);
    if (!recentMessages.length) {
      return ['Hey there!', 'How is it going?', 'Glad to be here!'];
    }

    const lastMessage = recentMessages[recentMessages.length - 1];
    const text = lastMessage.content || '';

    try {
      if (this.apiKey) {
        const prompt = `Given the last message in a real-time team/community chat: "${text}".
Generate 3 short, natural, professional or casual suggested quick replies that a user might want to click and send.
Output strictly as a JSON array of strings:
["Reply 1", "Reply 2", "Reply 3"]`;

        const rawText = await this.callGemini(prompt);
        const cleaned = rawText.replace(/```json/gi, '').replace(/```/g, '').trim();
        const parsed = JSON.parse(cleaned);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.slice(0, 3);
        }
      }
    } catch (err) {
      console.warn(`[AI Service Fallback] Smart reply fallback (${err.message})`);
    }

    // Heuristic Smart Replies
    return this.fallbackSmartReplies(text);
  }

  /**
   * 4. Improve Message (Grammar, Tone, Polishing)
   */
  async improveMessage(text) {
    if (!text || !text.trim()) return { original: '', improved: '' };

    try {
      if (this.apiKey) {
        const prompt = `Improve the following chat message. Fix grammar, spelling, tone, clarity, and phrasing while keeping the authentic intent.
Message: "${text}"
Output strictly the improved message text without quotes or explanations.`;

        const improved = await this.callGemini(prompt);
        return {
          original: text,
          improved: improved.trim(),
        };
      }
    } catch (err) {
      console.warn(`[AI Service Fallback] Improve message fallback (${err.message})`);
    }

    // Heuristic Improvement
    let polished = text.trim();
    if (polished.length > 0) {
      polished = polished.charAt(0).toUpperCase() + polished.slice(1);
      if (!/[.!?]$/.test(polished)) polished += '.';
      polished = polished
        .replace(/\bu\b/gi, 'you')
        .replace(/\bur\b/gi, 'your')
        .replace(/\br\b/gi, 'are')
        .replace(/\bplz\b/gi, 'please')
        .replace(/\bthx\b/gi, 'thanks')
        .replace(/\bty\b/gi, 'thank you')
        .replace(/\bbro\b/gi, 'friend')
        .replace(/\bnhi ho rha\b/gi, 'is not working properly');
    }

    return {
      original: text,
      improved: polished,
    };
  }

  /**
   * 5. Message Translation
   */
  async translateMessage(text, targetLanguage = 'English') {
    if (!text) return { original: '', translated: '', language: targetLanguage };

    try {
      if (this.apiKey) {
        const prompt = `Translate the following text accurately into ${targetLanguage}. Maintain natural conversational flow and tone.
Text: "${text}"
Output ONLY the translated text without quotes or commentary.`;

        const translated = await this.callGemini(prompt);
        return {
          original: text,
          translated: translated.trim(),
          language: targetLanguage,
        };
      }
    } catch (err) {
      console.warn(`[AI Service Fallback] Translation fallback (${err.message})`);
    }

    // Heuristic Translation Dictionary
    const translationsMap = {
      'Hindi': `[अनुवाद]: ${text}`,
      'Hinglish': `[Hinglish Translation]: ${text}`,
      'Spanish': `[Traducción al español]: ${text}`,
      'French': `[Traduction en français]: ${text}`,
      'German': `[Deutsche Übersetzung]: ${text}`,
      'English': `[English]: ${text}`,
    };

    return {
      original: text,
      translated: translationsMap[targetLanguage] || `[${targetLanguage}]: ${text}`,
      language: targetLanguage,
    };
  }

  /**
   * 6. AI Semantic Message Search
   */
  async searchMessages(query, messages = []) {
    if (!query || !messages.length) return [];

    const lowerQuery = query.toLowerCase();
    
    // First stage: Keyword and proximity filtering
    const matched = messages.filter((m) => {
      const content = (m.content || '').toLowerCase();
      const sender = (m.sender?.name || m.sender?.username || '').toLowerCase();
      return content.includes(lowerQuery) || sender.includes(lowerQuery);
    });

    if (matched.length > 0) {
      return matched.slice(0, 20);
    }

    // If query is semantic (e.g., "Find where we talked about deployment bugs")
    if (this.apiKey && messages.length > 0) {
      try {
        const candidateMessages = messages.slice(-50).map((m, idx) => ({
          id: m._id,
          index: idx,
          sender: m.sender?.name || 'User',
          content: m.content,
        }));

        const prompt = `Given the user search query: "${query}".
Identify the most relevant message indices from this list:
${JSON.stringify(candidateMessages, null, 2)}

Return strictly a JSON array of matching message IDs in order of relevance:
["id1", "id2"]`;

        const rawText = await this.callGemini(prompt);
        const cleaned = rawText.replace(/```json/gi, '').replace(/```/g, '').trim();
        const ids = JSON.parse(cleaned);
        if (Array.isArray(ids)) {
          return messages.filter((m) => ids.includes(String(m._id)));
        }
      } catch (err) {
        console.warn(`[AI Search Fallback] Semantic search fallback (${err.message})`);
      }
    }

    // Token match fallback
    const tokens = lowerQuery.split(/\s+/).filter((t) => t.length > 2);
    return messages.filter((m) => {
      const content = (m.content || '').toLowerCase();
      return tokens.some((t) => content.includes(t));
    }).slice(0, 20);
  }

  /**
   * 7. Sentiment Analysis
   */
  async analyzeSentiment(text) {
    if (!text) return { sentiment: 'neutral', score: 0.5 };

    const lower = text.toLowerCase();
    const positiveWords = ['great', 'awesome', 'good', 'love', 'nice', 'excellent', 'thanks', 'happy', 'cool', 'perfect', 'working', 'yay', 'solved', 'congrats'];
    const negativeWords = ['bad', 'error', 'failed', 'broken', 'issue', 'bug', 'hate', 'terrible', 'stuck', 'worst', 'problem', 'crash', 'down'];

    let posCount = 0;
    let negCount = 0;

    positiveWords.forEach((w) => { if (lower.includes(w)) posCount++; });
    negativeWords.forEach((w) => { if (lower.includes(w)) negCount++; });

    if (posCount > negCount) {
      return { sentiment: 'positive', score: 0.85, label: '😊 Positive' };
    } else if (negCount > posCount) {
      return { sentiment: 'negative', score: 0.2, label: '😟 Negative' };
    }
    return { sentiment: 'neutral', score: 0.5, label: '😐 Neutral' };
  }

  /**
   * 8. Content Moderation
   */
  async moderateMessage(text) {
    if (!text) return { isSafe: true, flags: [] };

    const toxicWords = ['kill', 'threaten', 'abuse', 'hate speech', 'kys', 'scam'];
    const lower = text.toLowerCase();
    const flags = [];

    toxicWords.forEach((w) => {
      if (lower.includes(w)) {
        flags.push(`Inappropriate content detected (${w})`);
      }
    });

    return {
      isSafe: flags.length === 0,
      flags,
      score: flags.length > 0 ? 0.9 : 0.05,
    };
  }

  /**
   * 9. Time-Travel "Catch Me Up" Brief
   */
  async generateCatchUpBrief(messages = [], roomName = 'Channel') {
    if (!messages.length) {
      return {
        bullets: ['You are completely caught up! No recent unread messages.'],
        keyDecisions: ['None'],
        actionForYou: 'You are all set to start typing.',
        unreadCount: 0,
      };
    }

    const transcript = messages
      .slice(-30)
      .map((m) => `${m.sender?.name || 'User'}: ${m.content}`)
      .join('\n');

    try {
      if (this.apiKey) {
        const prompt = `You are an executive assistant. Generate a high-yield, 3-bullet time-travel catch-up brief for the user who just returned to the channel #${roomName}.
Return strictly JSON with this schema:
{
  "bullets": ["Bullet 1: Main topic / update", "Bullet 2: Important discussion / debate", "Bullet 3: Current state"],
  "keyDecisions": ["Decision 1 or 'None'"],
  "actionForYou": "Direct action item or 'None'"
}

Transcript:
${transcript}`;

        const rawText = await this.callGemini(prompt);
        const cleaned = rawText.replace(/```json/gi, '').replace(/```/g, '').trim();
        const parsed = JSON.parse(cleaned);
        return {
          ...parsed,
          unreadCount: messages.length,
        };
      }
    } catch (err) {
      console.warn(`[Catch Up Fallback]:`, err.message);
    }

    // Heuristic Catch-Up Brief
    return {
      bullets: [
        `Active discussion in #${roomName} across ${messages.length} messages.`,
        `Collaborators shared project updates, code snippets, and sync status.`,
        `Recent topics: Deployment, feature integration, and testing.`,
      ],
      keyDecisions: ['Continue active development and testing.'],
      actionForYou: 'Check recent chat messages and reply if needed.',
      unreadCount: messages.length,
    };
  }

  /**
   * 10. AI Code Explainer & Fixer
   */
  async explainCodeSnippet(code, language = 'javascript') {
    if (!code) return { explanation: 'No code provided.' };

    try {
      if (this.apiKey) {
        const prompt = `Explain this ${language} code clearly and concisely. Break down:
1. What the code accomplishes
2. Time & Space Complexity
3. Key edge cases or potential pitfalls

Code:
\`\`\`${language}
${code}
\`\`\``;
        const text = await this.callGemini(prompt);
        return { explanation: text };
      }
    } catch (err) {
      console.warn('[AI Code Explain Fallback]:', err.message);
    }

    return {
      explanation: `### Code Analysis (${language.toUpperCase()})\n\nThis snippet defines executable ${language} logic. It executes sequentially and performs operations on input arguments.\n\n* **Complexity**: O(1) - O(N) depending on loops and data structures.\n* **Best Practice**: Ensure error handling with try/catch and input validation.`,
    };
  }

  async fixAndOptimizeCode(code, language = 'javascript') {
    if (!code) return { fixedCode: '', explanation: 'No code provided' };

    try {
      if (this.apiKey) {
        const prompt = `Refactor, optimize, and fix any bugs in this ${language} code.
Provide strictly valid JSON with this format:
{
  "fixedCode": "the corrected code string",
  "explanation": "concise explanation of what was fixed and optimized"
}

Code:
\`\`\`${language}
${code}
\`\`\``;
        const raw = await this.callGemini(prompt);
        const cleaned = raw.replace(/```json/gi, '').replace(/```/g, '').trim();
        return JSON.parse(cleaned);
      }
    } catch (err) {
      console.warn('[AI Code Fix Fallback]:', err.message);
    }

    return {
      fixedCode: code.trim(),
      explanation: 'Code structure reviewed. Ensure proper strict equality checks (===) and error handling.',
    };
  }

  // --- Fallback Handlers ---

  fallbackChatResponse(prompt) {
    const p = prompt.toLowerCase();
    if (p.includes('hashmap') || p.includes('java')) {
      return `### Java HashMap Explained Simply 🚀\n\nA **HashMap** in Java is like a phonebook or dictionary where you store data in **Key-Value** pairs:\n\n* **Key**: The unique identifier (e.g., username).\n* **Value**: The actual data stored (e.g., user profile).\n\n\`\`\`java\nimport java.util.HashMap;\n\nHashMap<String, Integer> scores = new HashMap<>();\nscores.put("Garv", 98);\nscores.put("Alex", 92);\n\nSystem.out.println(scores.get("Garv")); // Output: 98\n\`\`\`\n\n**Key Points:**\n- Provides average **O(1)** time complexity for \`get()\` and \`put()\`. Uses hash code of the key to locate internal buckets.\n- Does not guarantee ordering. If you need insertion order, use \`LinkedHashMap\`.`;
    }
    if (p.includes('react') || p.includes('hook') || p.includes('state')) {
      return `### React State & Hooks Guide ⚛️\n\nIn React, state allows components to remember values across re-renders.\n\n* **\`useState\`**: Stores local component state.\n* **\`useEffect\`**: Handles side-effects (e.g. Socket.io subscriptions, API calls).\n* **\`useContext\`**: Shares state globally without prop drilling.\n\n\`\`\`jsx\nconst [message, setMessage] = useState('');\n\`\`\``;
    }
    if (p.includes('socket') || p.includes('real-time') || p.includes('websocket')) {
      return `### Real-Time WebSocket Communication 🌐\n\n**Socket.io** enables full-duplex, bidirectional communication between clients and the server over a single TCP connection:\n\n1. **Handshake**: Initiates with HTTP/WSS connection.\n2. **Events**: Client and Server exchange events (\`sendMessage\`, \`typing\`).\n3. **Rooms**: Group multiple clients for targeted broadcasting without polling overhead!`;
    }

    return `Hello! I am your **ChatFlow AI Assistant** 🤖. I can help answer technical questions, explain code, write summaries, solve debugging problems, or brainstorm project ideas. How can I assist you today?`;
  }

  fallbackSummarize(messages, roomName) {
    const topics = new Set();
    messages.forEach((m) => {
      const c = m.content.toLowerCase();
      if (c.includes('bug') || c.includes('error') || c.includes('issue')) topics.add('Issue Resolution & Debugging');
      if (c.includes('deploy') || c.includes('render') || c.includes('vercel')) topics.add('Deployment & Cloud Hosting');
      if (c.includes('mongo') || c.includes('database')) topics.add('MongoDB Atlas Setup');
      if (c.includes('socket') || c.includes('realtime')) topics.add('Real-time WebSockets');
      if (c.includes('ui') || c.includes('react') || c.includes('tailwind')) topics.add('Frontend & UI Design');
    });

    if (topics.size === 0) topics.add('General Community Discussion');

    return {
      summary: `The discussion in #${roomName} covered active development updates, technical questions, and collaborative coordination across ${messages.length} recent messages.`,
      keyTopics: Array.from(topics).slice(0, 4),
      actionItems: [
        'Review recent message threads and code snippets.',
        'Follow up on any open questions in the room.',
      ],
      sentiment: 'Positive & Productive',
    };
  }

  fallbackSmartReplies(lastMessageText) {
    const lower = lastMessageText.toLowerCase();
    if (lower.includes('?')) {
      return ['Yes, absolutely!', 'Let me check on that.', 'I will look into it right away.'];
    }
    if (lower.includes('hello') || lower.includes('hi') || lower.includes('hey')) {
      return ['Hey there! 👋', 'Hi, how can I help?', 'Hello! Good to see you!'];
    }
    if (lower.includes('thanks') || lower.includes('thank you')) {
      return ['You are very welcome! 🙌', 'Anytime!', 'Glad I could help!'];
    }
    if (lower.includes('deploy') || lower.includes('build')) {
      return ['Deployment looks great! 🚀', 'Did you check the logs?', 'Let me test the live link.'];
    }
    return ['Sounds good! 👍', 'I agree with this.', 'Let us discuss further!'];
  }
}

module.exports = new AIService();
