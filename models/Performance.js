const mongoose = require('mongoose');

const performanceSchema = new mongoose.Schema({
  employee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: true,
  },
  performance: {
    type: Number,
    required: true,
    min: 0,
    max: 100,
  },
  attendanceScore: {
    type: Number,
    min: 0,
    max: 100,
    default: 0,
  },
  leaveScore: {
    type: Number,
    min: 0,
    max: 100,
    default: 0,
  },
  taskScore: {
    type: Number,
    min: 0,
    max: 100,
    default: 0,
  },
  tasksCompleted: {
    type: Number,
    required: true,
    min: 0,
  },
  totalTasks: {
    type: Number,
    required: true,
    min: 0,
    default: 0,
  },
  presentDays: {
    type: Number,
    required: true,
    min: 0,
    default: 0,
  },
  leaveDays: {
    type: Number,
    required: true,
    min: 0,
    default: 0,
  },
  achievements: {
    type: String,
    trim: true,
  },
  month: {
    type: String,
    required: true,
    enum: [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December',
    ],
  },
  year: {
    type: String,
    required: true,
  },
}, { timestamps: true });

module.exports = mongoose.model('Performance', performanceSchema);