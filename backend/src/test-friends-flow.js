require('dotenv').config();
const connectDB = require('./config/db');
const User = require('./models/User');
const FriendRequest = require('./models/FriendRequest');
const {
  getFriends,
  getFriendRequests,
  sendFriendRequest,
  acceptFriendRequest,
  searchUsers,
  getOrCreateDM,
} = require('./controllers/friendController');

// Helper to mock express req/res
const mockReqRes = (user, params = {}, query = {}, body = {}) => {
  const req = { user, params, query, body };
  let resData = null;
  let resStatus = 200;

  const res = {
    status: (s) => {
      resStatus = s;
      return res;
    },
    json: (d) => {
      resData = d;
      return res;
    },
  };

  const next = (err) => {
    if (err) throw err;
  };

  return { req, res, getData: () => resData, getStatus: () => resStatus, next };
};

async function testFriendFlow() {
  console.log('--- Testing Complete Friend Request & Acceptance Flow ---');
  await connectDB();

  // Create two distinct users
  let userAlice = await User.findOne({ email: 'alice_test@chatflow.ai' });
  if (!userAlice) {
    userAlice = await User.create({
      name: 'Alice Wonder',
      username: 'alice_test',
      email: 'alice_test@chatflow.ai',
      password: 'Password123',
    });
  }

  let userBob = await User.findOne({ email: 'bob_test@chatflow.ai' });
  if (!userBob) {
    userBob = await User.create({
      name: 'Bob Builder',
      username: 'bob_test',
      email: 'bob_test@chatflow.ai',
      password: 'Password123',
    });
  }

  // Clear existing relationships between Alice and Bob
  await FriendRequest.deleteMany({
    $or: [
      { sender: userAlice._id, recipient: userBob._id },
      { sender: userBob._id, recipient: userAlice._id },
    ],
  });
  await User.findByIdAndUpdate(userAlice._id, { $pull: { friends: userBob._id } });
  await User.findByIdAndUpdate(userBob._id, { $pull: { friends: userAlice._id } });

  console.log('1. Cleared previous test data.');

  // Step 1: Alice sends friend request to Bob
  const sendStep = mockReqRes(userAlice, { targetUserId: userBob._id.toString() });
  await sendFriendRequest(sendStep.req, sendStep.res, sendStep.next);
  console.log('2. Alice sent request to Bob:', sendStep.getData()?.message);
  const createdReq = sendStep.getData()?.request;

  // Step 2: Bob checks incoming requests
  const bobReqs = mockReqRes(userBob);
  await getFriendRequests(bobReqs.req, bobReqs.res, bobReqs.next);
  const incoming = bobReqs.getData()?.incoming || [];
  console.log(`3. Bob sees ${incoming.length} incoming request(s). Sender:`, incoming[0]?.sender?.name);
  if (incoming.length !== 1) throw new Error('Bob did not receive incoming request');

  // Step 3: Bob accepts Alice's request
  const acceptStep = mockReqRes(userBob, { requestId: createdReq._id.toString() });
  await acceptFriendRequest(acceptStep.req, acceptStep.res, acceptStep.next);
  console.log('4. Bob accepted request:', acceptStep.getData()?.message);

  // Step 4: Verify Alice's friends list
  const aliceFriends = mockReqRes(userAlice);
  await getFriends(aliceFriends.req, aliceFriends.res, aliceFriends.next);
  const aliceList = aliceFriends.getData()?.friends || [];
  console.log(`5. Alice friends count: ${aliceList.length}. Friend name:`, aliceList[0]?.name);
  if (aliceList.length !== 1 || aliceList[0]?.username !== 'bob_test') {
    throw new Error('Alice does not have Bob in friends list');
  }

  // Step 5: Verify Bob's friends list
  const bobFriends = mockReqRes(userBob);
  await getFriends(bobFriends.req, bobFriends.res, bobFriends.next);
  const bobList = bobFriends.getData()?.friends || [];
  console.log(`6. Bob friends count: ${bobList.length}. Friend name:`, bobList[0]?.name);
  if (bobList.length !== 1 || bobList[0]?.username !== 'alice_test') {
    throw new Error('Bob does not have Alice in friends list');
  }

  // Step 6: Verify Search Status
  const searchStep = mockReqRes(userAlice, {}, { q: 'bob_test' });
  await searchUsers(searchStep.req, searchStep.res, searchStep.next);
  const searchResults = searchStep.getData()?.users || [];
  console.log('7. Alice searching for Bob -> Relationship:', searchResults[0]?.relationship);
  if (searchResults[0]?.relationship !== 'friends') {
    throw new Error(`Expected relationship 'friends', got: ${searchResults[0]?.relationship}`);
  }

  // Step 7: Create DM between Alice and Bob
  const dmStep = mockReqRes(userAlice, { friendId: userBob._id.toString() });
  await getOrCreateDM(dmStep.req, dmStep.res, dmStep.next);
  console.log('8. DM Channel created:', dmStep.getData()?.room?.name);

  console.log('\n🎉 ALL FRIEND REQUEST ACCEPTANCE & DM TESTS PASSED 100%!');
  process.exit(0);
}

testFriendFlow().catch((err) => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
