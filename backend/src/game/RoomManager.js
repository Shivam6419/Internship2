import { Room } from './Room.js';
import { Player } from './Player.js';

/**
 * RoomManager Class (Singleton)
 * Global in-memory registry of all active game rooms.
 */
class RoomManager {
  constructor() {
    /** @type {Map<string, Room>} */
    this.rooms = new Map();
    /** @type {Map<string, string>} Maps socket.id -> roomId */
    this.socketToRoom = new Map();
  }

  /**
   * Generates an uppercase 6-character alphanumeric room code
   * @returns {string}
   */
  generateRoomId() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Avoid confusing chars like O, 0, 1, I
    let code = '';
    do {
      code = '';
      for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
      }
    } while (this.rooms.has(code));
    return code;
  }

  /**
   * Creates a new room and sets the creator as host
   * 
   * @param {import('socket.io').Server} io 
   * @param {import('socket.io').Socket} socket 
   * @param {string} hostName 
   * @param {string} avatar 
   * @param {object} settings 
   * @returns {Room}
   */
  createRoom(io, socket, hostName, avatar, settings) {
    const roomId = this.generateRoomId();
    const hostPlayer = new Player(socket.id, hostName, avatar, true);
    const room = new Room(roomId, socket.id, settings, io);

    this.rooms.set(roomId, room);
    this.socketToRoom.set(socket.id, roomId);

    room.addPlayer(hostPlayer, socket);
    console.log(`🏰 [ROOM MANAGER] Room created: ${roomId} by ${hostName} (${socket.id})`);
    return room;
  }

  /**
   * Adds an existing player to an active room
   * 
   * @param {import('socket.io').Socket} socket 
   * @param {string} roomId 
   * @param {string} playerName 
   * @param {string} avatar 
   * @returns {Room}
   */
  joinRoom(socket, roomId, playerName, avatar) {
    const cleanRoomId = (roomId || '').trim().toUpperCase();
    const room = this.rooms.get(cleanRoomId);

    if (!room) {
      throw new Error(`Room "${cleanRoomId}" does not exist`);
    }

    const player = new Player(socket.id, playerName, avatar, false);
    room.addPlayer(player, socket);
    this.socketToRoom.set(socket.id, cleanRoomId);

    return room;
  }

  /**
   * Retrieves a room by room ID
   * @param {string} roomId 
   * @returns {Room | null}
   */
  getRoom(roomId) {
    if (!roomId) return null;
    return this.rooms.get(roomId.toUpperCase()) || null;
  }

  /**
   * Retrieves the room associated with a given socket ID
   * @param {string} socketId 
   * @returns {Room | null}
   */
  getRoomBySocket(socketId) {
    const roomId = this.socketToRoom.get(socketId);
    if (!roomId) return null;
    return this.rooms.get(roomId) || null;
  }

  /**
   * Handles player disconnection and deletes room if empty
   * @param {string} socketId 
   */
  handleDisconnect(socketId) {
    const roomId = this.socketToRoom.get(socketId);
    if (!roomId) return;

    this.socketToRoom.delete(socketId);
    const room = this.rooms.get(roomId);
    if (!room) return;

    const isEmpty = room.removePlayer(socketId);
    if (isEmpty) {
      this.rooms.delete(roomId);
      console.log(`🧹 [ROOM MANAGER] Room ${roomId} cleaned up (all players left)`);
    }
  }
}

// Export singleton instance
export const roomManager = new RoomManager();
