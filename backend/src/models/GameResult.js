import mongoose from 'mongoose';

const GameResultSchema = new mongoose.Schema({
  roomId: {
    type: String,
    required: true,
    index: true
  },
  winner: {
    name: { type: String, required: true },
    score: { type: Number, required: true },
    avatar: { type: String, default: '👑' }
  },
  leaderboard: [
    {
      id: String,
      name: String,
      avatar: String,
      score: Number
    }
  ],
  totalRounds: {
    type: Number,
    default: 3
  },
  playerCount: {
    type: Number,
    default: 2
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

export const GameResult = mongoose.models.GameResult || mongoose.model('GameResult', GameResultSchema);
