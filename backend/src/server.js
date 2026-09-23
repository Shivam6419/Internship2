import express from 'express';
import http from 'http';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { Server as SocketIOServer } from 'socket.io';
import { registerSocketHandlers } from './socket/socketHandler.js';
import apiRoutes from './routes/api.js';
import { connectDB } from './config/db.js';

// Load environment variables
dotenv.config();

// Initialize MongoDB Atlas connection
connectDB();

const app = express();
const server = http.createServer(app);

const PORT = process.env.PORT || 5001;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

// Setup Socket.IO with CORS
const io = new SocketIOServer(server, {
  cors: {
    origin: [CLIENT_URL, 'http://localhost:5173', 'http://127.0.0.1:5173'],
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Middleware
app.use(cors({
  origin: [CLIENT_URL, 'http://localhost:5173', 'http://127.0.0.1:5173'],
  methods: ['GET', 'POST'],
  credentials: true
}));
app.use(express.json());

// Resolve paths for production static files
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distPath = path.resolve(__dirname, '../../frontend/dist');

// REST API routes
app.use('/api', apiRoutes);

// In production or fullstack mode, serve frontend dist build if present
app.use(express.static(distPath));

// SPA catch-all fallback for client-side routing
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api') || req.path.startsWith('/socket.io')) {
    return next();
  }
  res.sendFile(path.join(distPath, 'index.html'), (err) => {
    if (err) next();
  });
});

// Socket.IO connection entry point
io.on('connection', (socket) => {
  registerSocketHandlers(io, socket);
});

// Start listening
server.listen(PORT, () => {
  console.log(`🚀 [SERVER] Running on http://localhost:${PORT}`);
  console.log(`🌐 [CLIENT_URL] Allowed origin: ${CLIENT_URL}`);
  console.log(`⚡ [WEBSOCKET] Socket.IO initialized`);
});

export { app, server, io };
