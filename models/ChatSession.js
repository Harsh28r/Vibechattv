import mongoose from 'mongoose';

const chatSessionSchema = new mongoose.Schema({
  user1: {
    type: String,
    required: true
  },
  user2: {
    type: String,
    required: true
  },
  startTime: {
    type: Date,
    default: Date.now
  },
  endTime: {
    type: Date
  },
  duration: {
    type: Number // in seconds
  },
  messagesCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Index for faster queries
chatSessionSchema.index({ startTime: -1 });
chatSessionSchema.index({ user1: 1, user2: 1 });

const ChatSession = mongoose.model('ChatSession', chatSessionSchema);

export default ChatSession;

