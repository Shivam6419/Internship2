import express from 'express';
import { roomManager } from '../game/RoomManager.js';

const router = express.Router();

// Health check
router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'online',
    message: 'Skribbl Clone Server is healthy and running',
    activeRooms: roomManager.rooms.size,
    timestamp: new Date().toISOString()
  });
});

// Check if a specific room exists
router.get('/rooms/:roomId', (req, res) => {
  const { roomId } = req.params;
  const room = roomManager.getRoom(roomId);

  if (!room) {
    return res.status(404).json({ exists: false, message: 'Room not found' });
  }

  res.status(200).json({
    exists: true,
    roomId: room.id,
    phase: room.phase,
    playerCount: room.players.size,
    maxPlayers: room.settings.maxPlayers,
    isPrivate: room.settings.isPrivate
  });
});

// List public active rooms (for public lobby feature)
router.get('/rooms', (req, res) => {
  const publicRooms = [];

  for (const [id, room] of roomManager.rooms.entries()) {
    if (!room.settings.isPrivate && room.phase === 'LOBBY') {
      publicRooms.push({
        id: room.id,
        playerCount: room.players.size,
        maxPlayers: room.settings.maxPlayers,
        rounds: room.settings.rounds,
        drawTime: room.settings.drawTime
      });
    }
  }

  res.status(200).json({ rooms: publicRooms });
});

// Recent match history from MongoDB Atlas
router.get('/history', async (req, res) => {
  try {
    const { GameResult } = await import('../models/GameResult.js');
    const history = await GameResult.find().sort({ createdAt: -1 }).limit(10);
    res.status(200).json({ history });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch match history', message: error.message });
  }
});

export default router;
