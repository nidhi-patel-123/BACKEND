// models/Chat.js
const mongoose = require('mongoose');

const chatSchema = new mongoose.Schema({
  employeeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: true,
  },
  employeeName: {
    type: String,
    required: true,
  },
  latestMessage: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message',
  },
}, { timestamps: true });

module.exports = mongoose.model('Chat', chatSchema);