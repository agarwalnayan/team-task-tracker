const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Task title is required'],
    trim: true,
    minlength: 3,
    maxlength: 200
  },
  description: {
    type: String,
    trim: true,
    maxlength: 2000
  },
  status: {
    type: String,
    enum: ['todo', 'inprogress', 'done'],
    default: 'todo'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  team: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team'
  },
  attachments: [{
    filename: String,
    path: String,
    size: Number,
    uploadedAt: Date
  }],
  dueDate: {
    type: Date
  },
  completedAt: {
    type: Date
  },
  tags: [{
    type: String,
    trim: true
  }],
  category: {
    type: String,
    enum: ['Development', 'Design', 'Marketing', 'Sales', 'Support', 'Management', 'Research', 'General'],
    default: 'General'
  },
  complexity: {
    type: Number,
    min: 1,
    max: 5,
    default: 3
  },
  aiInsights: {
    priorityScore: {
      type: Number,
      min: 1,
      max: 10
    },
    estimatedHours: {
      type: Number,
      min: 0
    },
    reasoning: String,
    recommendations: [{
      memberId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      reason: String,
      fitScore: {
        type: Number,
        min: 1,
        max: 10
      }
    }]
  },
  parentTask: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Task'
  },
  dependencies: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Task'
  }],
  progress: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  estimatedHours: {
    type: Number,
    min: 0
  },
  actualHours: {
    type: Number,
    min: 0
  },
  aiGenerated: {
    type: Boolean,
    default: false
  },
  aiFallback: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Indexes for performance
taskSchema.index({ assignedTo: 1, status: 1 });
taskSchema.index({ team: 1, createdAt: -1 });
taskSchema.index({ createdBy: 1, priority: 1 });
taskSchema.index({ status: 1, dueDate: 1 });
taskSchema.index({ title: 'text', description: 'text' });

module.exports = mongoose.model('Task', taskSchema);
