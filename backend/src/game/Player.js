/**
 * Player Class
 * Encapsulates player identity, scores, and turn state.
 */
export class Player {
  /**
   * @param {string} id - Unique Socket.IO client ID
   * @param {string} name - Player display name
   * @param {string} avatar - Player avatar emoji / icon
   * @param {boolean} isHost - Whether this player created the room
   */
  constructor(id, name, avatar = '🎨', isHost = false) {
    this.id = id;
    this.name = name.trim().slice(0, 16) || 'Player';
    this.avatar = avatar;
    this.score = 0;
    this.roundScore = 0;
    this.hasGuessed = false;
    this.isHost = isHost;
    this.joinedAt = Date.now();
  }

  /**
   * Resets turn-specific state for a new round/turn
   */
  resetForNewRound() {
    this.hasGuessed = false;
    this.roundScore = 0;
  }

  /**
   * Adds points to total score and current round score
   * @param {number} points 
   */
  addScore(points) {
    this.score += points;
    this.roundScore += points;
  }

  /**
   * Serializes player data for sending over WebSocket
   */
  toJSON() {
    return {
      id: this.id,
      name: this.name,
      avatar: this.avatar,
      score: this.score,
      roundScore: this.roundScore,
      hasGuessed: this.hasGuessed,
      isHost: this.isHost
    };
  }
}
