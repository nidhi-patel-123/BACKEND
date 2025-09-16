const mongoose = require('mongoose');
const Employee = require('./Employee'); // Assuming Employee model is defined elsewhere

const payrollSchema = new mongoose.Schema({
  employee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: [true, 'Employee is required'],
  },
  month: {
    type: Number,
    required: [true, 'Month is required'],
    min: 1,
    max: 12,
  },
  year: {
    type: Number,
    required: [true, 'Year is required'],
    min: 2020,
    max: 2030,
  },
  basicSalary: {
    type: Number,
    required: [true, 'Basic salary is required'],
    min: 0,
  },
  allowances: {
    houseRent: { type: Number, default: 0, min: 0 },
    medical: { type: Number, default: 0, min: 0 },
    transport: { type: Number, default: 0, min: 0 },
    food: { type: Number, default: 0, min: 0 },
    other: { type: Number, default: 0, min: 0 },
  },
  deductions: {
    tax: { type: Number, default: 0, min: 0 },
    insurance: { type: Number, default: 0, min: 0 },
    loan: { type: Number, default: 0, min: 0 },
    other: { type: Number, default: 0, min: 0 },
  },
  overtime: {
    hours: { type: Number, default: 0, min: 0 },
    rate: { type: Number, default: 0, min: 0 },
    amount: { type: Number, default: 0, min: 0 },
  },
  bonus: {
    type: Number,
    default: 0,
    min: 0,
  },
  totalAllowances: {
    type: Number,
    default: 0,
    min: 0,
  },
  totalDeductions: {
    type: Number,
    default: 0,
    min: 0,
  },
  grossSalary: {
    type: Number,
    required: false,
    min: 0,
  },
  netSalary: {
    type: Number,
    required: false,
    min: 0,
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'cancelled'],
    default: 'pending',
  },
  paymentDate: {
    type: Date,
  },
  paymentMethod: {
    type: String,
    enum: ['bank_transfer', 'check', 'cash'],
    default: 'bank_transfer',
  },
  notes: {
    type: String,
    trim: true,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    required: true,
  },
}, {
  timestamps: true,
});

// Calculate totals before saving
payrollSchema.pre('save', function(next) {
  console.log('Pre-save hook triggered for payroll');
  console.log('Initial data:', {
    basicSalary: this.basicSalary,
    allowances: this.allowances,
    deductions: this.deductions,
    overtime: this.overtime,
    bonus: this.bonus
  });

  // Ensure allowances object exists
  if (!this.allowances) {
    this.allowances = { houseRent: 0, medical: 0, transport: 0, food: 0, other: 0 };
  }

  // Ensure deductions object exists
  if (!this.deductions) {
    this.deductions = { tax: 0, insurance: 0, loan: 0, other: 0 };
  }

  // Ensure overtime object exists
  if (!this.overtime) {
    this.overtime = { hours: 0, rate: 0, amount: 0 };
  }

  // Calculate total allowances
  this.totalAllowances =
    (this.allowances.houseRent || 0) +
    (this.allowances.medical || 0) +
    (this.allowances.transport || 0) +
    (this.allowances.food || 0) +
    (this.allowances.other || 0);

  // Calculate total deductions
  this.totalDeductions =
    (this.deductions.tax || 0) +
    (this.deductions.insurance || 0) +
    (this.deductions.loan || 0) +
    (this.deductions.other || 0);

  // Calculate overtime amount
  this.overtime.amount = (this.overtime.hours || 0) * (this.overtime.rate || 0);

  // Calculate gross salary
  this.grossSalary = (this.basicSalary || 0) + this.totalAllowances + this.overtime.amount + (this.bonus || 0);

  // Calculate net salary
  this.netSalary = this.grossSalary - this.totalDeductions;

  console.log('Calculated values:', {
    totalAllowances: this.totalAllowances,
    totalDeductions: this.totalDeductions,
    overtimeAmount: this.overtime.amount,
    grossSalary: this.grossSalary,
    netSalary: this.netSalary
  });

  next();
});

// Ensure unique payroll per employee per month
payrollSchema.index({ employee: 1, month: 1, year: 1 }, { unique: true });

// Virtual for total allowances (getter)
payrollSchema.virtual('totalAllowancesComputed').get(function() {
  if (!this.allowances) return 0;
  return (this.allowances.houseRent || 0) +
         (this.allowances.medical || 0) +
         (this.allowances.transport || 0) +
         (this.allowances.food || 0) +
         (this.allowances.other || 0);
});

// Virtual for total deductions (getter)
payrollSchema.virtual('totalDeductionsComputed').get(function() {
  if (!this.deductions) return 0;
  return (this.deductions.tax || 0) +
         (this.deductions.insurance || 0) +
         (this.deductions.loan || 0) +
         (this.deductions.other || 0);
});

// Ensure virtuals are included when converting to JSON
payrollSchema.set('toJSON', { virtuals: true });
payrollSchema.set('toObject', { virtuals: true });
module.exports = mongoose.model('Payroll', payrollSchema);
