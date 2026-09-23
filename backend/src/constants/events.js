// Centralized Socket.IO event names
// Having a single source of truth avoids typos and makes refactoring effortless.

export const EVENTS = {
  // Room / Lobby Events
  CREATE_ROOM: 'create_room',
  ROOM_CREATED: 'room_created',
  JOIN_ROOM: 'join_room',
  ROOM_JOINED: 'room_joined',
  PLAYER_JOINED: 'player_joined',
  PLAYER_LEFT: 'player_left',
  UPDATE_SETTINGS: 'update_settings',
  SETTINGS_UPDATED: 'settings_updated',
  START_GAME: 'start_game',
  
  // Game Flow Events
  GAME_STATE: 'game_state',
  ROUND_START: 'round_start',
  WORD_OPTIONS: 'word_options',
  WORD_CHOSEN: 'word_chosen',
  TIMER_TICK: 'timer_tick',
  HINT_REVEALED: 'hint_revealed',
  ROUND_END: 'round_end',
  GAME_OVER: 'game_over',
  PLAY_AGAIN: 'play_again',

  // Real-Time Canvas Drawing Events
  DRAW_START: 'draw_start',
  DRAW_MOVE: 'draw_move',
  DRAW_END: 'draw_end',
  DRAW_DATA: 'draw_data',
  CANVAS_CLEAR: 'canvas_clear',
  CANVAS_CLEARED: 'canvas_cleared',
  DRAW_UNDO: 'draw_undo',
  DRAW_UNDONE: 'draw_undone',

  // Guessing & Chat Events
  GUESS: 'guess',
  GUESS_RESULT: 'guess_result',
  CHAT_MESSAGE: 'chat_message',

  // System & Error Events
  ERROR: 'error_notification'
};
