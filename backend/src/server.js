const dotenv = require('dotenv');
// Load environment variables before anything else
dotenv.config();

const http = require('http');
const { Server } = require('socket.io');
const app = require('./app');
const connectDB = require('./config/db');
const { initSocketHandler } = require('./socket/socketHandler');

const PORT = process.env.PORT || 5000;

// Connect Database
connectDB();

// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.io with production-grade CORS
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
    credentials: true,
  },
  pingTimeout: 60000,
  pingInterval: 25000,
});

// Initialize Socket Handlers
initSocketHandler(io);

// Start listening
server.listen(PORT, () => {
  console.log(`=========================================`);
  console.log(`🚀 ChatFlow AI Server running on PORT: ${PORT}`);
  console.log(`📡 Socket.io engine initialized and ready`);
  console.log(`🤖 AI Service configured: ${process.env.AI_PROVIDER || 'Gemini'} (${process.env.AI_MODEL || 'gemini-1.5-flash'})`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`=========================================`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error(`[Unhandled Rejection]: ${err.message}`);
  // In production, keep running or let process manager restart
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error(`[Uncaught Exception]: ${err.message}`);
});
