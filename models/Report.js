import mongoose from 'mongoose';

const reportSchema = new mongoose.Schema({
  reporter: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  reportedUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  reason: {
    type: String,
    required: true,
    trim: true,
    maxlength: 120
  },
  details: {
    type: String,
    trim: true,
    maxlength: 1000
  },
  evidenceUrl: {
    type: String,
    default: null
  },
  status: {
    type: String,
    enum: ['pending', 'reviewed', 'dismissed'],
    default: 'pending'
  },
  autoResolved: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  autoIndex: false
});

const Report = mongoose.model('Report', reportSchema);

export default Report;

