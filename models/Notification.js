// models/Notification.js
const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  recipient: {
    type: mongoose.Schema.Types.Mixed, // Supports both ObjectId and string
    required: true,
  },
  recipientModel: {
    type: String,
    required: true,
    enum: ['Employee', 'Admin'],
  },
  type: {
    type: String,
    enum: ['attendance', 'leave', 'payroll', 'project', 'message'],
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
  read: {
    type: Boolean,
    default: false,
  },
  relatedId: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'relatedModel',
  },
  relatedModel: {
    type: String,
    enum: ['Attendance', 'Leave', 'Payroll', 'Project', 'Message'],
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Notification', notificationSchema);