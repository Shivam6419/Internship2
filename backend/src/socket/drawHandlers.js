import { EVENTS } from '../constants/events.js';
import { roomManager } from '../game/RoomManager.js';

/**
 * Registers real-time drawing event handlers
 * 
 * @param {import('socket.io').Server} io 
 * @param {import('socket.io').Socket} socket 
 */
export function registerDrawHandlers(io, socket) {
  // Helper to verify if sender is authorized drawer
  const isAuthorizedDrawer = () => {
    const room = roomManager.getRoomBySocket(socket.id);
    if (!room || !room.game) return { authorized: false };
    if (room.phase !== 'DRAWING' || room.game.currentDrawerId !== socket.id) {
      return { authorized: false, room };
    }
    return { authorized: true, room, game: room.game };
  };

  // DRAW START
  socket.on(EVENTS.DRAW_START, (payload) => {
    const { authorized, room, game } = isAuthorizedDrawer();
    if (!authorized) return;

    const stroke = {
      type: 'stroke',
      points: [{ x: payload.x, y: payload.y }],
      color: payload.color || '#000000',
      size: payload.size || 4
    };

    game.addStroke(stroke);

    // Broadcast stroke start to all other players in the room
    socket.to(room.id).emit(EVENTS.DRAW_DATA, {
      type: 'start',
      x: payload.x,
      y: payload.y,
      color: payload.color,
      size: payload.size
    });
  });

  // DRAW MOVE
  socket.on(EVENTS.DRAW_MOVE, (payload) => {
    const { authorized, room, game } = isAuthorizedDrawer();
    if (!authorized) return;

    // Append to active stroke in memory
    const activeStroke = game.strokeHistory[game.strokeHistory.length - 1];
    if (activeStroke && activeStroke.type === 'stroke') {
      activeStroke.points.push({ x: payload.x, y: payload.y });
    }

    // Broadcast stroke point to guessers
    socket.to(room.id).emit(EVENTS.DRAW_DATA, {
      type: 'move',
      x: payload.x,
      y: payload.y
    });
  });

  // DRAW END
  socket.on(EVENTS.DRAW_END, () => {
    const { authorized, room } = isAuthorizedDrawer();
    if (!authorized) return;

    socket.to(room.id).emit(EVENTS.DRAW_DATA, { type: 'end' });
  });

  // CLEAR CANVAS
  socket.on(EVENTS.CANVAS_CLEAR, () => {
    const { authorized, room, game } = isAuthorizedDrawer();
    if (!authorized) return;

    game.clearStrokes();
    room.broadcast(EVENTS.CANVAS_CLEARED);
  });

  // UNDO LAST STROKE
  socket.on(EVENTS.DRAW_UNDO, () => {
    const { authorized, room, game } = isAuthorizedDrawer();
    if (!authorized) return;

    game.undoLastStroke();
    // Broadcast full remaining stroke history so all clients repaint consistently
    room.broadcast(EVENTS.DRAW_UNDONE, {
      strokeHistory: game.strokeHistory
    });
  });
}
