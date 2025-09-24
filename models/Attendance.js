// Schema Model
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
    breakStart: {
      type: Date,
      default: null,
    },
    breakEnd: {
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
  const onBreak = this.breakStart && !this.breakEnd;
  if (!this.checkOut) return onBreak ? 'onbreak' : 'working';
  return 'present';
});

attendanceSchema.pre('save', function (next) {
  if (this.checkIn && this.checkOut) {
    const start = this.checkIn.getTime();
    const end = this.checkOut.getTime();
    let breakTime = 0;
    if (this.breakStart && this.breakEnd) {
      breakTime = this.breakEnd.getTime() - this.breakStart.getTime();
    }
    const totalTime = end - start - breakTime;
    this.workingMinutes = totalTime > 0 ? Math.floor(totalTime / (1000 * 60)) : 0;
  }
  next();
});

module.exports = mongoose.model('Attendance', attendanceSchema);