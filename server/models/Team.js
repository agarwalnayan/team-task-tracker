const mongoose = require('mongoose')

const teamSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Team name is required'],
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  company: {
    type: String,
    trim: true
  },
  roomCode: {
    type: String,
    unique: true,
    required: true,
    default: function() {
      // Generate 6-character room code
      return Math.random().toString(36).substring(2, 8).toUpperCase()
    }
  },
  allowJoinByCode: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  members: [
    {
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      role: {
        type: String,
        enum: ['admin', 'member'],
        default: 'member'
      },
      canManageRoles: {
        type: Boolean,
        default: false
      }
    }
  ]
}, { timestamps: true })

// Pre-save hook to ensure room code is generated
teamSchema.pre('save', function(next) {
  if (this.isNew && !this.roomCode) {
    // Generate unique 6-character room code
    let roomCode
    do {
      roomCode = Math.random().toString(36).substring(2, 8).toUpperCase()
    } while (roomCode.includes('O') || roomCode.includes('0')) // Avoid confusing characters
    
    this.roomCode = roomCode
  }
  next()
})

module.exports = mongoose.model('Team', teamSchema)