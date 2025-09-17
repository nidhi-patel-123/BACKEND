const mongoose = require("mongoose");

const performanceSchema = new mongoose.Schema({
  employee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Employee",
    required: true,
  },
  performance: {
    type: Number,
    required: true,
    min: 0,
    max: 100,
  },
  tasksCompleted: {
    type: Number,
    required: true,
    min: 0,
  },
  achievements: {
    type: String,
    trim: true,
  },
  month: {
    type: String,
    required: true,
    enum: [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ],
  },
  year: {
    type: String,
    required: true,
  },
}, { timestamps: true });

module.exports = mongoose.model("Performance", performanceSchema);