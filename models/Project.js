const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Project name is required'],
      trim: true,
    },
    client: {
      type: String,
      required: [true, 'Client name is required'],
      trim: true,
    },
    startDate: {
      type: Date,
      required: [true, 'Start date is required'],
    },
    deadline: {
      type: Date,
      required: [true, 'Deadline is required'],
    },
    team: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      required: true,
    }],
    progress: {
      type: Number,
      required: [true, 'Progress is required'],
      min: [0, 'Progress cannot be less than 0'],
      max: [100, 'Progress cannot be more than 100'],
      default: 0,
    },
    status: {
      type: String,
      required: [true, 'Status is required'],
      enum: ['Not Started', 'In Progress', 'On Hold', 'Completed', 'Cancelled'],
      default: 'Not Started',
    },
    description: {
      type: String,
      trim: true,
    },
    budget: {
      type: Number,
      min: [0, 'Budget cannot be negative'],
    },
    priority: {
      type: String,
      enum: ['Low', 'Medium', 'High', 'Critical'],
      default: 'Medium',
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual for days remaining
projectSchema.virtual('daysRemaining').get(function() {
  if (!this.deadline) return null;
  const today = new Date();
  const deadline = new Date(this.deadline);
  const diffTime = deadline - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
});

// Virtual for project duration
projectSchema.virtual('duration').get(function() {
  if (!this.startDate || !this.deadline) return null;
  const start = new Date(this.startDate);
  const end = new Date(this.deadline);
  const diffTime = end - start;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
});

module.exports = mongoose.model('Project', projectSchema);
