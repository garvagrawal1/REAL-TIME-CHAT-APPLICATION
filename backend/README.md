# ChatFlow AI — Backend Server & WebSocket Engine

Node.js, Express.js, MongoDB/Mongoose, Socket.io, and AI-powered service backend for the ChatFlow AI platform.

## Architecture

- **`src/config/db.js`**: Database connection pool and automatic default room seeder.
- **`src/models/`**: Mongoose schemas for User, Room, and Message.
- **`src/controllers/`**: REST API controllers for Auth, Rooms, Messages, and AI.
- **`src/services/`**: Modular AI service (Gemini API / Fallback), Room Summary service, and Moderation service.
- **`src/socket/socketHandler.js`**: WebSocket engine managing real-time chat, multi-tab presence, typing indicators, and notifications.
- **`src/middleware/`**: JWT authentication, error handling, rate limiting, and input sanitization.

## Environment Variables

```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.abcde.mongodb.net/chatflow?retryWrites=true&w=majority
JWT_SECRET=your_super_secret_jwt_key
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:5173
AI_API_KEY=your_gemini_api_key
AI_MODEL=gemini-1.5-flash
AI_PROVIDER=gemini
```

## Running Locally

```bash
npm install
npm run dev
```
