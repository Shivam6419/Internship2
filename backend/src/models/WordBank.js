import mongoose from 'mongoose';

const WordBankSchema = new mongoose.Schema({
  category: {
    type: String,
    required: true,
    index: true
  },
  words: [
    {
      type: String,
      required: true
    }
  ],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

export const WordBank = mongoose.models.WordBank || mongoose.model('WordBank', WordBankSchema);
