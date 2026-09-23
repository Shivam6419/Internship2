import { EVENTS } from '../constants/events.js';
import { roomManager } from '../game/RoomManager.js';

/**
 * Registers game flow event handlers (word selection, restart)
 * 
 * @param {import('socket.io').Server} io 
 * @param {import('socket.io').Socket} socket 
 */
export function registerGameHandlers(io, socket) {
  // WORD CHOSEN BY DRAWER
  socket.on(EVENTS.WORD_CHOSEN, ({ word } = {}) => {
    try {
      const room = roomManager.getRoomBySocket(socket.id);
      if (!room || !room.game) return;

      if (room.game.currentDrawerId !== socket.id) {
        socket.emit(EVENTS.ERROR, { message: 'Only the active drawer can select a word' });
        return;
      }

      room.game.selectWord(socket.id, word);
    } catch (err) {
      console.error('Error selecting word:', err);
      socket.emit(EVENTS.ERROR, { message: err.message });
    }
  });

  // PLAY AGAIN (Return to lobby from GameOver)
  socket.on(EVENTS.PLAY_AGAIN, () => {
    try {
      const room = roomManager.getRoomBySocket(socket.id);
      if (!room) return;

      if (socket.id !== room.hostId) {
        socket.emit(EVENTS.ERROR, { message: 'Only the host can restart the game' });
        return;
      }

      room.phase = 'LOBBY';
      room.game = null;

      // Reset all players
      for (const player of room.players.values()) {
        player.score = 0;
        player.resetForNewRound();
      }

      room.broadcast(EVENTS.GAME_STATE, room.getPublicState());
    } catch (err) {
      socket.emit(EVENTS.ERROR, { message: err.message });
    }
  });
}
