import { EVENTS } from '../constants/events.js';
import { roomManager } from '../game/RoomManager.js';

/**
 * Registers guessing and chat message event handlers
 * 
 * @param {import('socket.io').Server} io 
 * @param {import('socket.io').Socket} socket 
 */
export function registerGuessHandlers(io, socket) {
  // GUESS / CHAT SUBMISSION
  socket.on(EVENTS.GUESS, ({ text } = {}) => {
    if (!text || typeof text !== 'string') return;
    const cleanText = text.trim();
    if (cleanText.length === 0 || cleanText.length > 100) return;

    const room = roomManager.getRoomBySocket(socket.id);
    if (!room) return;

    const player = room.players.get(socket.id);
    if (!player) return;

    // If game is in DRAWING phase, evaluate as guess
    if (room.phase === 'DRAWING' && room.game) {
      // Check if player is the drawer
      if (socket.id === room.game.currentDrawerId) {
        // Drawer cannot type the secret word in chat
        if (cleanText.toLowerCase().includes(room.game.currentWord)) {
          socket.emit(EVENTS.ERROR, { message: 'You cannot give away the secret word!' });
          return;
        }

        // Allow normal chat for drawer
        room.broadcast(EVENTS.CHAT_MESSAGE, {
          id: Date.now() + Math.random().toString(),
          playerId: player.id,
          playerName: player.name,
          text: cleanText,
          type: 'chat',
          isDrawer: true
        });
        return;
      }

      // If player already guessed correctly this turn, don't allow spoiling
      if (player.hasGuessed) {
        // Send only to others who also guessed
        for (const [id, p] of room.players.entries()) {
          if (p.hasGuessed || id === room.game.currentDrawerId) {
            room.getSocket(id)?.emit(EVENTS.CHAT_MESSAGE, {
              id: Date.now() + Math.random().toString(),
              playerId: player.id,
              playerName: player.name,
              text: cleanText,
              type: 'guessed_chat'
            });
          }
        }
        return;
      }

      // Process guess through authoritative Game engine
      const result = room.game.processGuess(socket.id, cleanText);

      if (result.isCorrect) {
        // Guess was correct! The Game class already emitted GUESS_RESULT.
        return;
      }

      // Check for "Close!" guess (Levenshtein distance <= 2)
      if (isCloseWord(cleanText.toLowerCase(), room.game.currentWord)) {
        socket.emit(EVENTS.CHAT_MESSAGE, {
          id: Date.now() + Math.random().toString(),
          text: `"${cleanText}" is close!`,
          type: 'close_hint'
        });
      }
    }

    // Regular chat message (in lobby, round end, or incorrect guess)
    room.broadcast(EVENTS.CHAT_MESSAGE, {
      id: Date.now() + Math.random().toString(),
      playerId: player.id,
      playerName: player.name,
      text: cleanText,
      type: 'chat'
    });
  });
}

/**
 * Computes if a guess is close to the target word (1 or 2 letter edit distance)
 */
function isCloseWord(guess, target) {
  if (Math.abs(guess.length - target.length) > 2) return false;
  let differences = 0;
  let i = 0, j = 0;
  while (i < guess.length && j < target.length) {
    if (guess[i] !== target[j]) {
      differences++;
      if (differences > 2) return false;
    }
    i++;
    j++;
  }
  return differences <= 2 && differences > 0;
}
