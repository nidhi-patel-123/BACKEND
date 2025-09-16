const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema(
  {
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      required: true,
    },
    attendanceDate: {
      type: Date,
      required: true,
      default: () => new Date().setUTCHours(0, 0, 0, 0),
    },
    checkIn: {
      type: Date,
      default: null,
    },
    checkOut: {
      type: Date,
      default: null,
    },
    workingMinutes: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Ensure one record per employee per day
attendanceSchema.index({ employee: 1, attendanceDate: 1 }, { unique: true });

attendanceSchema.virtual('status').get(function () {
  if (!this.checkIn) return 'absent';
  if (this.checkIn && !this.checkOut) return 'working';
  return 'present';
});

attendanceSchema.pre('save', function (next) {
  if (this.checkIn && this.checkOut) {
    const start = new Date(this.checkIn).getTime();
    const end = new Date(this.checkOut).getTime();
    if (end > start) {
      this.workingMinutes = Math.floor((end - start) / (1000 * 60));
    }
  }
  next();
});

module.exports = mongoose.model('Attendance', attendanceSchema);


