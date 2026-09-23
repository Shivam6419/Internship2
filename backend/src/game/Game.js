import { EVENTS } from '../constants/events.js';
import { getRandomWords } from '../utils/words.js';
import { calculateGuesserPoints, calculateDrawerPoints } from '../utils/scoring.js';
import { GameResult } from '../models/GameResult.js';
import { isConnected } from '../config/db.js';

/**
 * Game Class
 * Handles authoritative game rules, turn rotation, timer, scoring, and hints.
 */
export class Game {
  /**
   * @param {import('./Room.js').Room} room - Reference to the parent room
   */
  constructor(room) {
    this.room = room;
    this.settings = room.settings;
    
    // Rounds and timers
    this.currentRound = 1;
    this.totalRounds = Number(room.settings.rounds) || 3;
    this.drawTime = Number(room.settings.drawTime) || 60;
    this.wordChoicesCount = Number(room.settings.wordCount) || 3;
    this.hintsAllowed = Number(room.settings.hints) !== undefined ? Number(room.settings.hints) : 2;

    // Turn tracking
    this.turnOrder = [];
    this.turnIndex = 0;
    this.currentDrawerId = null;
    this.currentWord = '';
    this.wordOptions = [];
    
    // Masked word & hint progression
    this.revealedHints = [];
    this.revealedIndices = new Set();
    this.hintsGiven = 0;

    // Stroke history for the current turn (supports late joiners and undo)
    this.strokeHistory = [];

    // Timers
    this.timerInterval = null;
    this.selectionTimeout = null;
    this.timeLeft = this.drawTime;

    // Phase
    this.phase = 'LOBBY';
  }

  /**
   * Starts the game from round 1
   */
  start() {
    this.currentRound = 1;
    this.turnOrder = Array.from(this.room.players.keys());
    this.turnIndex = 0;
    
    // Reset all player cumulative scores
    for (const player of this.room.players.values()) {
      player.score = 0;
      player.resetForNewRound();
    }

    console.log(`🎮 [GAME ${this.room.id}] Started! Total rounds: ${this.totalRounds}, Players: ${this.turnOrder.length}`);
    this.startNextTurn();
  }

  /**
   * Starts the next player's drawing turn
   */
  startNextTurn() {
    // Clear any existing timers
    this.clearAllTimers();

    // Check if current round turns are finished
    if (this.turnIndex >= this.turnOrder.length) {
      if (this.currentRound >= this.totalRounds) {
        // All rounds complete -> GAME OVER!
        this.endGame();
        return;
      }
      // Advance to next round
      this.currentRound++;
      this.turnIndex = 0;
      // Refresh turn order in case players joined/left
      this.turnOrder = Array.from(this.room.players.keys());
      console.log(`🔄 [GAME ${this.room.id}] Advancing to Round ${this.currentRound} / ${this.totalRounds}`);
    }

    // Identify drawer
    this.currentDrawerId = this.turnOrder[this.turnIndex];
    const drawer = this.room.players.get(this.currentDrawerId);

    // If drawer disconnected, skip to next player
    if (!drawer) {
      this.turnIndex++;
      this.startNextTurn();
      return;
    }

    // Reset turn-specific state
    this.phase = 'WORD_SELECTION';
    this.room.phase = 'WORD_SELECTION';
    this.strokeHistory = [];
    this.revealedIndices.clear();
    this.hintsGiven = 0;

    for (const player of this.room.players.values()) {
      player.resetForNewRound();
    }

    // Pick word options
    this.wordOptions = getRandomWords(this.wordChoicesCount);

    // Notify room of round start
    // Send secret word choices ONLY to drawer
    const drawerSocket = this.room.getSocket(this.currentDrawerId);
    if (drawerSocket) {
      drawerSocket.emit(EVENTS.ROUND_START, {
        drawerId: this.currentDrawerId,
        drawerName: drawer.name,
        wordOptions: this.wordOptions,
        drawTime: this.drawTime,
        currentRound: this.currentRound,
        totalRounds: this.totalRounds,
        isDrawer: true
      });
    }

    // Broadcast to guessers (without secret word choices!)
    drawerSocket?.broadcast.to(this.room.id).emit(EVENTS.ROUND_START, {
      drawerId: this.currentDrawerId,
      drawerName: drawer.name,
      wordOptions: [],
      drawTime: this.drawTime,
      currentRound: this.currentRound,
      totalRounds: this.totalRounds,
      isDrawer: false
    });

    // 15-second selection timer: if drawer doesn't pick, auto-pick first word
    this.selectionTimeout = setTimeout(() => {
      if (this.phase === 'WORD_SELECTION') {
        console.log(`⏰ [GAME ${this.room.id}] Auto-selecting word for drawer`);
        this.selectWord(this.currentDrawerId, this.wordOptions[0]);
      }
    }, 15000);
  }

  /**
   * Called when the drawer selects a word
   * @param {string} drawerId 
   * @param {string} word 
   */
  selectWord(drawerId, word) {
    if (drawerId !== this.currentDrawerId || this.phase !== 'WORD_SELECTION') {
      return;
    }

    clearTimeout(this.selectionTimeout);

    this.currentWord = word.trim().toLowerCase();
    this.phase = 'DRAWING';
    this.room.phase = 'DRAWING';
    this.timeLeft = this.drawTime;

    // Initialize blanks (preserve spaces if multi-word)
    this.revealedHints = this.currentWord.split('').map(char => (char === ' ' ? ' ' : '_'));

    const drawer = this.room.players.get(this.currentDrawerId);

    // Send word to drawer
    const drawerSocket = this.room.getSocket(this.currentDrawerId);
    if (drawerSocket) {
      drawerSocket.emit(EVENTS.WORD_CHOSEN, {
        word: this.currentWord,
        wordMask: this.currentWord,
        timeLeft: this.timeLeft,
        isDrawer: true
      });
    }

    // Send blanks to guessers
    drawerSocket?.broadcast.to(this.room.id).emit(EVENTS.WORD_CHOSEN, {
      word: null,
      wordMask: this.revealedHints.join(' '),
      wordLength: this.currentWord.length,
      timeLeft: this.timeLeft,
      isDrawer: false
    });

    // Broadcast authoritative game_state
    this.room.broadcastState();

    // Start 1-second authoritative countdown timer
    this.startAuthoritativeTimer();
  }

  /**
   * Starts authoritative countdown timer
   */
  startAuthoritativeTimer() {
    this.clearIntervalTimer();

    this.timerInterval = setInterval(() => {
      this.timeLeft--;

      // Broadcast timer tick to all players in room
      this.room.broadcast(EVENTS.TIMER_TICK, { timeLeft: this.timeLeft });

      // Check hint milestones (e.g. at 60% and 30% time remaining)
      this.checkHintProgress();

      // Check if time expired
      if (this.timeLeft <= 0) {
        console.log(`⌛ [GAME ${this.room.id}] Turn time expired`);
        this.endTurn('time_up');
      }
    }, 1000);
  }

  /**
   * Progressively reveals letters as timer elapses
   */
  checkHintProgress() {
    if (this.hintsAllowed <= 0 || this.hintsGiven >= this.hintsAllowed) return;

    // Milestone calculation based on allowed hints
    // If 2 hints: trigger at 60% and 30% time remaining
    const totalTime = this.drawTime;
    const hintThresholds = [];
    for (let i = 1; i <= this.hintsAllowed; i++) {
      hintThresholds.push(Math.floor((totalTime / (this.hintsAllowed + 1)) * (this.hintsAllowed + 1 - i)));
    }

    const currentThreshold = hintThresholds[this.hintsGiven];
    if (this.timeLeft <= currentThreshold) {
      this.revealNextHint();
    }
  }

  /**
   * Reveals a random unrevealed character
   */
  revealNextHint() {
    const unrevealed = [];
    for (let i = 0; i < this.currentWord.length; i++) {
      if (this.currentWord[i] !== ' ' && !this.revealedIndices.has(i)) {
        unrevealed.push(i);
      }
    }

    if (unrevealed.length <= 1) return; // Leave at least 1 character hidden

    const randomIdx = unrevealed[Math.floor(Math.random() * unrevealed.length)];
    this.revealedIndices.add(randomIdx);
    this.revealedHints[randomIdx] = this.currentWord[randomIdx];
    this.hintsGiven++;

    console.log(`💡 [GAME ${this.room.id}] Hint revealed: ${this.revealedHints.join(' ')}`);

    // Broadcast updated mask to guessers
    this.room.broadcast(EVENTS.HINT_REVEALED, {
      wordMask: this.revealedHints.join(' '),
      hintsGiven: this.hintsGiven
    });
  }

  /**
   * Evaluates a player's guess
   * @param {string} playerId 
   * @param {string} text 
   * @returns {{ isCorrect: boolean, masked: boolean, reason?: string }}
   */
  processGuess(playerId, text) {
    if (this.phase !== 'DRAWING') {
      return { isCorrect: false, masked: false };
    }

    // Drawer cannot guess their own drawing
    if (playerId === this.currentDrawerId) {
      return { isCorrect: false, masked: false, reason: 'Drawer cannot guess' };
    }

    const player = this.room.players.get(playerId);
    if (!player || player.hasGuessed) {
      // If player already guessed correctly, mask their message so they don't spoil for others
      return { isCorrect: false, masked: true, alreadyGuessed: true };
    }

    const cleanGuess = text.trim().toLowerCase();

    if (cleanGuess === this.currentWord) {
      // CORRECT GUESS!
      const points = calculateGuesserPoints(this.timeLeft, this.drawTime);
      player.hasGuessed = true;
      player.addScore(points);

      console.log(`🎯 [GAME ${this.room.id}] ${player.name} guessed the word correctly! Points: +${points}`);

      // Broadcast guess success notification
      this.room.broadcast(EVENTS.GUESS_RESULT, {
        correct: true,
        playerId: player.id,
        playerName: player.name,
        points,
        scores: this.room.getScores()
      });

      // Check if all eligible guessers have guessed
      this.checkIfAllGuessed();

      return { isCorrect: true, masked: true };
    }

    // Incorrect guess
    return { isCorrect: false, masked: false };
  }

  /**
   * Checks if all eligible guessers have guessed correctly
   */
  checkIfAllGuessed() {
    let eligibleGuessers = 0;
    let correctGuessers = 0;

    for (const [id, player] of this.room.players.entries()) {
      if (id !== this.currentDrawerId) {
        eligibleGuessers++;
        if (player.hasGuessed) {
          correctGuessers++;
        }
      }
    }

    // If everyone guessed, end turn immediately!
    if (eligibleGuessers > 0 && correctGuessers >= eligibleGuessers) {
      console.log(`🎉 [GAME ${this.room.id}] All players guessed the word!`);
      this.endTurn('all_guessed');
    }
  }

  /**
   * Concludes the current drawing turn
   * @param {'time_up' | 'all_guessed' | 'drawer_left'} reason 
   */
  endTurn(reason = 'time_up') {
    this.clearAllTimers();
    this.phase = 'ROUND_END';
    this.room.phase = 'ROUND_END';

    // Calculate drawer points based on how many players guessed
    const drawer = this.room.players.get(this.currentDrawerId);
    let correctCount = 0;
    let totalEligible = 0;

    for (const [id, player] of this.room.players.entries()) {
      if (id !== this.currentDrawerId) {
        totalEligible++;
        if (player.hasGuessed) correctCount++;
      }
    }

    if (drawer && totalEligible > 0) {
      const drawerPoints = calculateDrawerPoints(correctCount, totalEligible);
      drawer.addScore(drawerPoints);
    }

    // Broadcast round conclusion with the revealed word and scores
    this.room.broadcast(EVENTS.ROUND_END, {
      word: this.currentWord,
      reason,
      scores: this.room.getScores(),
      correctCount,
      totalEligible
    });

    // Wait 4 seconds for players to see the word and scores, then start next turn
    setTimeout(() => {
      this.turnIndex++;
      this.startNextTurn();
    }, 4500);
  }

  /**
   * Ends the entire game, declares the winner, and builds final leaderboard
   */
  endGame() {
    this.clearAllTimers();
    this.phase = 'GAME_OVER';
    this.room.phase = 'GAME_OVER';

    const leaderboard = Array.from(this.room.players.values())
      .map(p => p.toJSON())
      .sort((a, b) => b.score - a.score);

    const winner = leaderboard[0] || null;

    console.log(`🏆 [GAME ${this.room.id}] Finished! Winner: ${winner?.name} with ${winner?.score} pts`);

    this.room.broadcast(EVENTS.GAME_OVER, {
      leaderboard,
      winner
    });

    // Asynchronously persist match history to MongoDB Atlas if connected
    if (isConnected() && winner) {
      GameResult.create({
        roomId: this.room.id,
        winner: {
          name: winner.name,
          score: winner.score,
          avatar: winner.avatar
        },
        leaderboard,
        totalRounds: this.totalRounds,
        playerCount: this.room.players.size
      }).then(() => {
        console.log(`💾 [DATABASE] Game summary for room ${this.room.id} saved to MongoDB Atlas`);
      }).catch(err => {
        console.warn(`⚠️ [DATABASE] Failed to save match history: ${err.message}`);
      });
    }
  }

  /**
   * Stroke handling (in-memory history for late joiners and undo)
   */
  addStroke(stroke) {
    this.strokeHistory.push(stroke);
  }

  undoLastStroke() {
    if (this.strokeHistory.length > 0) {
      this.strokeHistory.pop();
    }
  }

  clearStrokes() {
    this.strokeHistory = [];
  }

  clearAllTimers() {
    this.clearIntervalTimer();
    if (this.selectionTimeout) {
      clearTimeout(this.selectionTimeout);
      this.selectionTimeout = null;
    }
  }

  clearIntervalTimer() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }
}
