require('dotenv').config();
const http = require('http');
const { Server } = require('socket.io');
const { io: ClientIO } = require('socket.io-client');
const app = require('./app');
const connectDB = require('./config/db');
const { initSocketHandler } = require('./socket/socketHandler');
const User = require('./models/User');
const Room = require('./models/Room');
const generateToken = require('./utils/generateToken');

async function testRealtimeChat() {
  console.log('--- Starting Real-Time End-to-End Chat Test ---');

  await connectDB();

  // Create temporary test server
  const server = http.createServer(app);
  const io = new Server(server, { cors: { origin: '*' } });
  initSocketHandler(io);

  await new Promise((resolve) => server.listen(5099, resolve));
  console.log('[Test Server] Listening on port 5099');

  // Create or get 2 test users
  let user1 = await User.findOne({ email: 'user1_test@chatflow.ai' });
  if (!user1) {
    user1 = await User.create({
      name: 'User One',
      username: 'user1_test',
      email: 'user1_test@chatflow.ai',
      password: 'Password123',
    });
  }

  let user2 = await User.findOne({ email: 'user2_test@chatflow.ai' });
  if (!user2) {
    user2 = await User.create({
      name: 'User Two',
      username: 'user2_test',
      email: 'user2_test@chatflow.ai',
      password: 'Password123',
    });
  }

  const token1 = generateToken(user1._id);
  const token2 = generateToken(user2._id);

  const room = await Room.findOne({ isDefault: true }) || await Room.findOne({});
  const roomId = String(room._id);
  console.log(`[Test Room] Using room #${room.name} (${roomId})`);

  // Connect Client 1
  const client1 = ClientIO('http://localhost:5099', {
    auth: { token: token1 },
    transports: ['websocket'],
  });

  // Connect Client 2
  const client2 = ClientIO('http://localhost:5099', {
    auth: { token: token2 },
    transports: ['websocket'],
  });

  await new Promise((resolve) => {
    let connected = 0;
    client1.on('connect', () => { if (++connected === 2) resolve(); });
    client2.on('connect', () => { if (++connected === 2) resolve(); });
  });
  console.log('✅ Both client sockets connected successfully with JWT auth!');

  // Join Room
  client1.emit('joinRoom', { roomId });
  client2.emit('joinRoom', { roomId });

  await new Promise((resolve) => setTimeout(resolve, 500));

  // Test Message: Client 1 sends message, Client 2 receives
  const messageReceivedPromise = new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('Timeout waiting for message')), 5000);

    client2.on('receiveMessage', (msg) => {
      clearTimeout(timeout);
      console.log(`✅ Client 2 received message: "${msg.content}" from ${msg.sender?.name}`);
      resolve(msg);
    });
  });

  console.log('[Test] Client 1 sending message: "Hello from User 1 to room!"');
  client1.emit('sendMessage', {
    roomId,
    content: 'Hello from User 1 to room!',
  });

  await messageReceivedPromise;

  // Cleanup
  client1.disconnect();
  client2.disconnect();
  server.close();

  console.log('\n🎉 ALL REAL-TIME SOCKET MESSAGING TESTS PASSED WITH 100% SUCCESS!');
  process.exit(0);
}

testRealtimeChat().catch((err) => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
