const mongoose = require('mongoose');
const Room = require('../models/Room');
const User = require('../models/User');

const DEFAULT_ROOMS = [
  {
    name: 'General',
    description: 'Public chat room for general discussions, introductions, and casual banter.',
    topic: 'Welcome to ChatFlow AI! Say hello to the community.',
    isDefault: true,
    icon: 'MessageSquare',
  },
  {
    name: 'Technology',
    description: 'Discuss web dev, AI, cloud infrastructure, programming languages, and tech trends.',
    topic: 'React, Node.js, WebSockets, Python, AI/ML, and DevOps.',
    isDefault: true,
    icon: 'Cpu',
  },
  {
    name: 'Gaming',
    description: 'Share games, esports, streams, tips, and gaming culture.',
    topic: 'PC, Console, Mobile gaming, and esports tournament discussions.',
    isDefault: true,
    icon: 'Gamepad2',
  },
  {
    name: 'Random',
    description: 'Memes, fun topics, off-topic thoughts, and serendipitous chats.',
    topic: 'Anything goes! Keep it friendly and respectful.',
    isDefault: true,
    icon: 'Sparkles',
  },
];

/**
 * Seed default rooms and a demo account if not already present
 */
const seedDatabase = async () => {
  try {
    // 1. Seed Rooms
    for (const roomData of DEFAULT_ROOMS) {
      const existing = await Room.findOne({ name: roomData.name });
      if (!existing) {
        await Room.create(roomData);
        console.log(`[Seed] Created channel #${roomData.name}`);
      }
    }

    // 2. Seed Demo User for instant testing
    const demoEmail = 'garv@chatflow.ai';
    const existingUser = await User.findOne({ email: demoEmail });
    if (!existingUser) {
      await User.create({
        name: 'Garv Agarwal',
        username: 'garv_dev',
        email: demoEmail,
        password: 'Password123',
        bio: 'Full-Stack Developer & ChatFlow AI Creator 🚀',
        status: 'online',
        avatar: 'https://api.dicebear.com/7.x/initials/svg?seed=Garv%20Agarwal&backgroundColor=4f46e5',
      });
      console.log(`[Seed] Demo account created: ${demoEmail} (Password: Password123)`);
    }
  } catch (err) {
    console.error('[Seed Error]:', err.message);
  }
};

let mongoMemoryServer = null;

/**
 * Connect to MongoDB with automatic In-Memory fallback for instant zero-setup execution
 */
const connectDB = async () => {
  const uri = process.env.MONGODB_URI || '';
  const isAtlas = uri.startsWith('mongodb+srv://');

  // 1. If user configured Atlas, connect directly
  if (isAtlas) {
    try {
      console.log(`[Database] Connecting to MongoDB Atlas cloud...`);
      const conn = await mongoose.connect(uri, { serverSelectionTimeoutMS: 8000 });
      console.log(`[Database] Connected to MongoDB Atlas: ${conn.connection.host}`);
      await seedDatabase();
      return;
    } catch (err) {
      console.error(`[Database Error] MongoDB Atlas connection failed: ${err.message}`);
    }
  }

  // 2. Try local MongoDB first if URI is provided
  if (uri && !isAtlas) {
    try {
      const conn = await mongoose.connect(uri, { serverSelectionTimeoutMS: 2000 });
      console.log(`[Database] Connected to Local MongoDB: ${conn.connection.host}`);
      await seedDatabase();
      return;
    } catch (err) {
      console.warn(`[Database Notice] Local MongoDB service on port 27017 is not running.`);
    }
  }

  // 3. Instant Zero-Setup Auto Fallback: Launch In-Memory MongoDB
  try {
    console.log(`[Database Engine] Starting automated In-Memory MongoDB instance...`);
    const { MongoMemoryServer } = require('mongodb-memory-server');
    mongoMemoryServer = await MongoMemoryServer.create();
    const memoryUri = mongoMemoryServer.getUri();

    const conn = await mongoose.connect(memoryUri);
    console.log(`======================================================`);
    console.log(`⚡ [Database Ready] Connected to In-Memory MongoDB: ${conn.connection.host}`);
    console.log(`✅ Zero-Setup Mode Active: Chat, Auth, and Rooms are 100% functional!`);
    console.log(`💡 Note: To persist permanently in cloud, set MONGODB_URI in backend/.env`);
    console.log(`======================================================`);

    await seedDatabase();
  } catch (err) {
    console.error(`[Fatal Database Error] Could not start In-Memory MongoDB: ${err.message}`);
  }
};

module.exports = connectDB;
