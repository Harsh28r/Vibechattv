import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

const userSchema = new mongoose.Schema({
  // Basic Info
  username: {
    type: String,
    unique: true,
    sparse: true,
    trim: true,
    minlength: 3,
    maxlength: 20
  },
  email: {
    type: String,
    unique: true,
    sparse: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    select: false // Don't return password by default
  },
  
  // Profile
  displayName: {
    type: String,
    default: 'Anonymous'
  },
  avatar: {
    type: String,
    default: null
  },
  
  // OAuth
  facebookId: {
    type: String,
    unique: true,
    sparse: true
  },
  googleId: {
    type: String,
    unique: true,
    sparse: true
  },
  firebaseUid: {
    type: String,
    unique: true,
    sparse: true
  },
  provider: {
    type: String,
    enum: ['local', 'google', 'facebook', 'firebase'],
    default: 'local'
  },
  
  // Socket & Chat Info
  socketId: {
    type: String,
    default: null
  },
  isOnline: {
    type: Boolean,
    default: false
  },
  inChat: {
    type: Boolean,
    default: false
  },
  partnerId: {
    type: String,
    default: null
  },
  
  // User Preferences
  gender: {
    type: String,
    enum: ['male', 'female', 'other'],
    default: 'other'
  },
  country: {
    type: String,
    default: 'ANY'
  },
  interests: [{
    type: String
  }],
  
  // Stats
  totalChats: {
    type: Number,
    default: 0
  },
  totalTime: {
    type: Number,
    default: 0
  },
  
  // Timestamps
  lastActive: {
    type: Date,
    default: Date.now
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  
  // Account Status
  isVerified: {
    type: Boolean,
    default: false
  },
  isGuest: {
    type: Boolean,
    default: false
  },

  // Moderation
  bannedUntil: {
    type: Date,
    default: null
  },
  banReason: {
    type: String,
    default: null,
    trim: true,
    maxlength: 280
  },
  banCount: {
    type: Number,
    default: 0
  },
  reportCount: {
    type: Number,
    default: 0
  },
  lastReportedAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: false, // We handle createdAt manually
  autoIndex: false   // Prevent auto-creation of indexes
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw error;
  }
};

// Hide sensitive data
userSchema.methods.toJSON = function() {
  const user = this.toObject();
  delete user.password;
  delete user.__v;
  return user;
};

const User = mongoose.model('User', userSchema);

export default User;
