// backend/models/Department.js
const mongoose = require('mongoose');

const departmentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Department name is required'],
    unique: true,
    trim: true,
  },
  head: {
    type: String,
    required: [true, 'Department head is required'],
    trim: true,
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('Department', departmentSchema);