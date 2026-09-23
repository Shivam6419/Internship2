import { EVENTS } from '../constants/events.js';
import { roomManager } from '../game/RoomManager.js';

/**
 * Registers room and lobby event listeners on a socket
 * 
 * @param {import('socket.io').Server} io 
 * @param {import('socket.io').Socket} socket 
 */
export function registerRoomHandlers(io, socket) {
  // CREATE ROOM
  socket.on(EVENTS.CREATE_ROOM, ({ hostName, avatar, settings } = {}) => {
    try {
      const room = roomManager.createRoom(io, socket, hostName, avatar, settings);
      const player = room.players.get(socket.id);

      socket.emit(EVENTS.ROOM_CREATED, {
        roomId: room.id,
        player: player.toJSON(),
        roomState: room.getPublicState()
      });
    } catch (err) {
      console.error(`Error creating room:`, err.message);
      socket.emit(EVENTS.ERROR, { message: err.message });
    }
  });

  // JOIN ROOM
  socket.on(EVENTS.JOIN_ROOM, ({ roomId, playerName, avatar } = {}) => {
    try {
      const room = roomManager.joinRoom(socket, roomId, playerName, avatar);
      const player = room.players.get(socket.id);

      socket.emit(EVENTS.ROOM_JOINED, {
        roomId: room.id,
        player: player.toJSON(),
        roomState: room.getPublicState()
      });
    } catch (err) {
      console.error(`Error joining room ${roomId}:`, err.message);
      socket.emit(EVENTS.ERROR, { message: err.message });
    }
  });

  // UPDATE SETTINGS (Host only)
  socket.on(EVENTS.UPDATE_SETTINGS, ({ settings } = {}) => {
    try {
      const room = roomManager.getRoomBySocket(socket.id);
      if (!room) return;
      room.updateSettings(settings, socket.id);
    } catch (err) {
      socket.emit(EVENTS.ERROR, { message: err.message });
    }
  });

  // START GAME (Host only)
  socket.on(EVENTS.START_GAME, () => {
    try {
      const room = roomManager.getRoomBySocket(socket.id);
      if (!room) throw new Error('You are not in an active room');
      room.startGame(socket.id);
    } catch (err) {
      console.warn(`Cannot start game:`, err.message);
      socket.emit(EVENTS.ERROR, { message: err.message });
    }
  });
}
