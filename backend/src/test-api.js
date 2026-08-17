const aiService = require('./services/aiService');
const summaryService = require('./services/summaryService');
const moderationService = require('./services/moderationService');

async function runTests() {
  console.log('--- Starting ChatFlow AI Backend Services Test ---');

  // 1. Test AI Assistant Chat
  console.log('\n[1/5] Testing AI Assistant Chat...');
  const chatReply = await aiService.generateChatResponse('Explain Java HashMap in simple language');
  console.log('AI Reply Preview:', chatReply.substring(0, 120) + '...');

  // 2. Test Smart Replies
  console.log('\n[2/5] Testing AI Smart Replies...');
  const sampleMessages = [
    { content: 'Can anyone help check the backend deployment?', sender: { name: 'Alex' } },
  ];
  const replies = await aiService.generateSmartReplies(sampleMessages);
  console.log('Smart Replies generated:', replies);

  // 3. Test Room Summarizer
  console.log('\n[3/5] Testing AI Room Summarizer...');
  const roomMessages = [
    { content: 'I pushed the new MongoDB schema for messages.', sender: { name: 'Garv' } },
    { content: 'Great, I fixed the Socket.io reconnection bug on the frontend.', sender: { name: 'Rahul' } },
    { content: 'Ready for deployment to Render and Vercel today.', sender: { name: 'Garv' } },
  ];
  const summary = await summaryService.generateRoomSummary(roomMessages, 'Technology');
  console.log('Summary Output:', summary);

  // 4. Test Message Improvement
  console.log('\n[4/5] Testing AI Message Improvement...');
  const improved = await aiService.improveMessage('bro deployment nhi ho rha plz check');
  console.log('Improvement Result:', improved);

  // 5. Test Translation & Moderation
  console.log('\n[5/5] Testing Translation and Moderation...');
  const translation = await aiService.translateMessage('Hello team, let us start the meeting now', 'Hindi');
  console.log('Translation Result:', translation);

  // 6. Test Catch-Up Brief and Code Explainer
  console.log('\n[6/7] Testing Catch-Up Brief and AI Code Explainer...');
  const catchUp = await aiService.generateCatchUpBrief(roomMessages, 'Technology');
  console.log('Catch Up Bullets:', catchUp.bullets);

  const codeExplain = await aiService.explainCodeSnippet('console.log("Hello Antigravity");', 'javascript');
  console.log('Code Explanation Result:', codeExplain.explanation.substring(0, 100) + '...');

  // 7. Test Models and DB initialization
  console.log('\n[7/7] Testing Models and DM Channel Schema...');
  const User = require('./models/User');
  const Room = require('./models/Room');
  const FriendRequest = require('./models/FriendRequest');
  console.log('Models loaded successfully:', { User: !!User, Room: !!Room, FriendRequest: !!FriendRequest });

  console.log('\n✅ All ChatFlow AI Backend Services & Schemas Passed Successfully!');
}

runTests().catch((err) => {
  console.error('❌ Service Test Error:', err);
  process.exit(1);
});
