import { EVENTS } from '../constants/events.js';
import { Game } from './Game.js';

/**
 * Room Class
 * Manages player roster, host privileges, room lifecycle, settings, and messaging.
 */
export class Room {
  /**
   * @param {string} id - 6-character room identifier
   * @param {string} hostId - Socket ID of the room creator
   * @param {object} settings - Initial room settings
   * @param {import('socket.io').Server} io - Socket.IO server instance
   */
  constructor(id, hostId, settings = {}, io) {
    this.id = id;
    this.hostId = hostId;
    this.io = io;

    // Room configuration
    this.settings = {
      maxPlayers: Math.min(20, Math.max(2, Number(settings.maxPlayers) || 8)),
      rounds: Math.min(10, Math.max(2, Number(settings.rounds) || 3)),
      drawTime: Math.min(240, Math.max(15, Number(settings.drawTime) || 60)),
      wordCount: Math.min(5, Math.max(1, Number(settings.wordCount) || 3)),
      hints: Math.min(5, Math.max(0, Number(settings.hints) !== undefined ? Number(settings.hints) : 2)),
      isPrivate: Boolean(settings.isPrivate)
    };

    // Players map: socketId -> Player
    this.players = new Map();

    // Lifecycle
    this.phase = 'LOBBY';
    this.game = null;
    this.createdAt = Date.now();
  }

  /**
   * Adds a player to the room
   * @param {import('./Player.js').Player} player 
   * @param {import('socket.io').Socket} socket 
   */
  addPlayer(player, socket) {
    if (this.players.size >= this.settings.maxPlayers) {
      throw new Error('Room is full (maximum capacity reached)');
    }

    if (this.phase !== 'LOBBY') {
      // Allow late-joining as guesser if under capacity
      console.log(`ℹ️ [ROOM ${this.id}] Player ${player.name} joined mid-game`);
    }

    this.players.set(player.id, player);
    socket.join(this.id);

    console.log(`👤 [ROOM ${this.id}] Player joined: ${player.name} (${player.id}). Total: ${this.players.size}`);

    // Broadcast new player to all existing participants
    this.broadcast(EVENTS.PLAYER_JOINED, {
      player: player.toJSON(),
      players: this.getPlayerList()
    });

    // If game is in progress, sync current canvas and masked word to the new player
    if (this.game && this.phase === 'DRAWING') {
      socket.emit(EVENTS.GAME_STATE, this.getPublicState());
      // Replay all strokes
      this.game.strokeHistory.forEach(stroke => {
        socket.emit(EVENTS.DRAW_DATA, stroke);
      });
    }
  }

  /**
   * Removes a player when they leave or disconnect
   * @param {string} socketId 
   * @returns {boolean} True if room is now empty and should be cleaned up
   */
  removePlayer(socketId) {
    const player = this.players.get(socketId);
    if (!player) return this.players.size === 0;

    this.players.delete(socketId);
    console.log(`🚪 [ROOM ${this.id}] Player left: ${player.name} (${socketId}). Remaining: ${this.players.size}`);

    // If room is empty, clear any active timers
    if (this.players.size === 0) {
      if (this.game) {
        this.game.clearAllTimers();
      }
      return true; // Signal RoomManager to delete room
    }

    // Reassign host if the host left
    let newHostId = this.hostId;
    if (socketId === this.hostId) {
      const firstRemainingPlayer = this.players.values().next().value;
      if (firstRemainingPlayer) {
        this.hostId = firstRemainingPlayer.id;
        firstRemainingPlayer.isHost = true;
        newHostId = firstRemainingPlayer.id;
        console.log(`👑 [ROOM ${this.id}] Host migrated to ${firstRemainingPlayer.name} (${firstRemainingPlayer.id})`);
      }
    }

    // If game is active and drawer left, advance turn immediately
    if (this.game && (this.phase === 'WORD_SELECTION' || this.phase === 'DRAWING')) {
      if (socketId === this.game.currentDrawerId) {
        console.log(`⚠️ [ROOM ${this.id}] Drawer disconnected! Advancing turn.`);
        this.game.endTurn('drawer_left');
      }
    }

    // Broadcast player_left to remaining clients
    this.broadcast(EVENTS.PLAYER_LEFT, {
      playerId: socketId,
      playerName: player.name,
      players: this.getPlayerList(),
      newHostId
    });

    return false;
  }

  /**
   * Updates room settings (restricted to host)
   */
  updateSettings(newSettings, socketId) {
    if (socketId !== this.hostId) {
      throw new Error('Only the room host can update settings');
    }
    if (this.phase !== 'LOBBY') {
      throw new Error('Settings cannot be changed after the game has started');
    }

    if (newSettings.maxPlayers !== undefined) {
      this.settings.maxPlayers = Math.min(20, Math.max(2, Number(newSettings.maxPlayers)));
    }
    if (newSettings.rounds !== undefined) {
      this.settings.rounds = Math.min(10, Math.max(2, Number(newSettings.rounds)));
    }
    if (newSettings.drawTime !== undefined) {
      this.settings.drawTime = Math.min(240, Math.max(15, Number(newSettings.drawTime)));
    }
    if (newSettings.wordCount !== undefined) {
      this.settings.wordCount = Math.min(5, Math.max(1, Number(newSettings.wordCount)));
    }
    if (newSettings.hints !== undefined) {
      this.settings.hints = Math.min(5, Math.max(0, Number(newSettings.hints)));
    }

    this.broadcast(EVENTS.SETTINGS_UPDATED, { settings: this.settings });
  }

  /**
   * Starts the game (host only, min 2 players)
   */
  startGame(socketId) {
    if (socketId !== this.hostId) {
      throw new Error('Only the room host can start the game');
    }
    if (this.players.size < 2) {
      throw new Error('At least 2 players are required to start the game');
    }
    if (this.phase !== 'LOBBY' && this.phase !== 'GAME_OVER') {
      throw new Error('Game is already in progress');
    }

    this.game = new Game(this);
    this.game.start();
  }

  /**
   * Helper to get Socket instance
   */
  getSocket(socketId) {
    return this.io.sockets.sockets.get(socketId);
  }

  /**
   * Broadcasts an event to all sockets in this room
   */
  broadcast(event, payload) {
    this.io.to(this.id).emit(event, payload);
  }

  /**
   * Returns sanitized player array
   */
  getPlayerList() {
    return Array.from(this.players.values()).map(p => p.toJSON());
  }

  /**
   * Returns current scores
   */
  getScores() {
    return this.getPlayerList().map(p => ({
      id: p.id,
      name: p.name,
      avatar: p.avatar,
      score: p.score,
      roundScore: p.roundScore,
      hasGuessed: p.hasGuessed
    }));
  }

  /**
   * Broadcasts the authoritative public game state
   */
  broadcastState() {
    this.broadcast(EVENTS.GAME_STATE, this.getPublicState());
  }

  /**
   * Returns public serialized room state
   */
  getPublicState() {
    return {
      roomId: this.id,
      hostId: this.hostId,
      phase: this.phase,
      settings: this.settings,
      players: this.getPlayerList(),
      currentRound: this.game ? this.game.currentRound : 1,
      totalRounds: this.game ? this.game.totalRounds : this.settings.rounds,
      drawerId: this.game ? this.game.currentDrawerId : null,
      drawerName: this.game?.currentDrawerId ? this.players.get(this.game.currentDrawerId)?.name : null,
      wordMask: this.game ? this.game.revealedHints.join(' ') : '',
      wordLength: this.game?.currentWord ? this.game.currentWord.length : 0,
      timeLeft: this.game ? this.game.timeLeft : this.settings.drawTime
    };
  }
}
