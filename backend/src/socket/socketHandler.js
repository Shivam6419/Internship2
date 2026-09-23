import { registerRoomHandlers } from './roomHandlers.js';
import { registerDrawHandlers } from './drawHandlers.js';
import { registerGuessHandlers } from './guessHandlers.js';
import { registerGameHandlers } from './gameHandlers.js';
import { roomManager } from '../game/RoomManager.js';

/**
 * Main Socket.IO connection dispatcher
 * Subscribes the socket to room, draw, guess, and game event groups.
 * 
 * @param {import('socket.io').Server} io 
 * @param {import('socket.io').Socket} socket 
 */
export function registerSocketHandlers(io, socket) {
  console.log(`🔌 [SOCKET CONNECTED] ${socket.id}`);

  // Register domain handlers
  registerRoomHandlers(io, socket);
  registerDrawHandlers(io, socket);
  registerGuessHandlers(io, socket);
  registerGameHandlers(io, socket);

  // Handle client disconnection
  socket.on('disconnect', (reason) => {
    console.log(`🔌 [SOCKET DISCONNECTED] ${socket.id} (${reason})`);
    roomManager.handleDisconnect(socket.id);
  });
}
