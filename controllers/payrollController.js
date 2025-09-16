// const Payroll = require('../models/Payroll');
// const Employee = require('../models/Employee');
// const catchAsync = require('../utils/catchAsync');

// // Get all payrolls with pagination and filtering
// exports.getPayrolls = catchAsync(async (req, res) => {
//   const { page = 1, limit = 10, month, year, status, employee, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;

//   // Build filter object
//   const filter = {};
//   if (month) filter.month = parseInt(month);
//   if (year) filter.year = parseInt(year);
//   if (status) filter.paymentStatus = status;
//   if (employee) filter.employee = employee;

//   // Build sort object
//   const sort = {};
//   sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

//   const skip = (parseInt(page) - 1) * parseInt(limit);
//   const limitNum = parseInt(limit);

//   const [payrolls, total] = await Promise.all([
//     Payroll.find(filter)
//       .sort(sort)
//       .skip(skip)
//       .limit(limitNum)
//       .populate({
//         path: 'employee',
//         select: 'name email role department',
//         populate: {
//           path: 'department',
//           select: 'name'
//         }
//       }),
//     Payroll.countDocuments(filter)
//   ]);

//   const totalPages = Math.ceil(total / limitNum);

//   res.status(200).json({
//     status: 'success',
//     data: {
//       docs: payrolls,
//       totalDocs: total,
//       limit: limitNum,
//       page: parseInt(page),
//       totalPages,
//       hasNextPage: parseInt(page) < totalPages,
//       hasPrevPage: parseInt(page) > 1
//     }
//   });
// });

// // Get payroll by ID
// exports.getPayrollById = catchAsync(async (req, res) => {
//   const payroll = await Payroll.findById(req.params.id)
//     .populate({
//       path: 'employee',
//       select: 'name email role department mobile joiningDate',
//       populate: {
//         path: 'department',
//         select: 'name'
//       }
//     })
//     .populate('createdBy', 'name email');

//   if (!payroll) {
//     return res.status(404).json({
//       status: 'error',
//       message: 'Payroll not found'
//     });
//   }

//   res.status(200).json({
//     status: 'success',
//     data: payroll
//   });
// });

// // Create new payroll
// exports.createPayroll = catchAsync(async (req, res) => {
//   const {
//     employee,
//     month,
//     year,
//     basicSalary,
//     allowances,
//     deductions,
//     overtime,
//     bonus,
//     notes
//   } = req.body;

//   // Check if payroll already exists for this employee in this month/year
//   const existingPayroll = await Payroll.findOne({ employee, month, year });
//   if (existingPayroll) {
//     return res.status(400).json({
//       status: 'error',
//       message: 'Payroll already exists for this employee in the specified month and year'
//     });
//   }

//   // Verify employee exists
//   const employeeExists = await Employee.findById(employee);
//   if (!employeeExists) {
//     return res.status(400).json({
//       status: 'error',
//       message: 'Employee not found'
//     });
//   }

//   // Get employee's basic salary if not provided
//   let finalBasicSalary = parseFloat(basicSalary);
//   if (!finalBasicSalary || finalBasicSalary <= 0) {
//     const employeeData = await Employee.findById(employee).select('basicSalary');
//     if (employeeData && employeeData.basicSalary > 0) {
//       finalBasicSalary = employeeData.basicSalary;
//     } else {
//       return res.status(400).json({
//         status: 'error',
//         message: 'Basic salary is required and must be greater than 0'
//       });
//     }
//   }

//   const payrollData = {
//     employee,
//     month: parseInt(month),
//     year: parseInt(year),
//     basicSalary: finalBasicSalary,
//     allowances: {
//       houseRent: parseFloat(allowances?.houseRent || 0),
//       medical: parseFloat(allowances?.medical || 0),
//       transport: parseFloat(allowances?.transport || 0),
//       food: parseFloat(allowances?.food || 0),
//       other: parseFloat(allowances?.other || 0)
//     },
//     deductions: {
//       tax: parseFloat(deductions?.tax || 0),
//       insurance: parseFloat(deductions?.insurance || 0),
//       loan: parseFloat(deductions?.loan || 0),
//       other: parseFloat(deductions?.other || 0)
//     },
//     overtime: {
//       hours: parseFloat(overtime?.hours || 0),
//       rate: parseFloat(overtime?.rate || 0)
//       // amount will be calculated by pre-save hook
//     },
//     bonus: parseFloat(bonus || 0),
//     notes,
//     createdBy: req.admin.id
//   };

//   console.log('Creating payroll with data:', JSON.stringify(payrollData, null, 2));

//   const payroll = await Payroll.create(payrollData);

//   res.status(201).json({
//     status: 'success',
//     message: 'Payroll created successfully',
//     data: payroll
//   });
// });

// // Update payroll
// exports.updatePayroll = catchAsync(async (req, res) => {
//   const {
//     basicSalary,
//     allowances,
//     deductions,
//     overtime,
//     bonus,
//     paymentStatus,
//     paymentDate,
//     paymentMethod,
//     notes
//   } = req.body;

//   const payroll = await Payroll.findById(req.params.id);
//   if (!payroll) {
//     return res.status(404).json({
//       status: 'error',
//       message: 'Payroll not found'
//     });
//   }

//   // Update fields
//   if (basicSalary !== undefined) payroll.basicSalary = parseFloat(basicSalary);
//   if (allowances) {
//     Object.keys(allowances).forEach(key => {
//       if (allowances[key] !== undefined) {
//         payroll.allowances[key] = parseFloat(allowances[key] || 0);
//       }
//     });
//   }
//   if (deductions) {
//     Object.keys(deductions).forEach(key => {
//       if (deductions[key] !== undefined) {
//         payroll.deductions[key] = parseFloat(deductions[key] || 0);
//       }
//     });
//   }
//   if (overtime) {
//     if (overtime.hours !== undefined) payroll.overtime.hours = parseFloat(overtime.hours);
//     if (overtime.rate !== undefined) payroll.overtime.rate = parseFloat(overtime.rate);
//   }
//   if (bonus !== undefined) payroll.bonus = parseFloat(bonus);
//   if (paymentStatus) payroll.paymentStatus = paymentStatus;
//   if (paymentDate) payroll.paymentDate = paymentDate;
//   if (paymentMethod) payroll.paymentMethod = paymentMethod;
//   if (notes !== undefined) payroll.notes = notes;

//   await payroll.save();

//   res.status(200).json({
//     status: 'success',
//     message: 'Payroll updated successfully',
//     data: payroll
//   });
// });

// // Delete payroll
// exports.deletePayroll = catchAsync(async (req, res) => {
//   const payroll = await Payroll.findById(req.params.id);
//   if (!payroll) {
//     return res.status(404).json({
//       status: 'error',
//       message: 'Payroll not found'
//     });
//   }

//   await Payroll.findByIdAndDelete(req.params.id);

//   res.status(200).json({
//     status: 'success',
//     message: 'Payroll deleted successfully'
//   });
// });

// // Bulk create payrolls for all employees
// exports.bulkCreatePayrolls = catchAsync(async (req, res) => {
//   const { month, year, basicSalaryIncrement = 0, allowanceIncrement = 0 } = req.body;

//   if (!month || !year) {
//     return res.status(400).json({
//       status: 'error',
//       message: 'Month and year are required'
//     });
//   }

//   // Get all active employees
//   const employees = await Employee.find({ status: 'active' });

//   if (employees.length === 0) {
//     return res.status(400).json({
//       status: 'error',
//       message: 'No active employees found'
//     });
//   }

//   const payrolls = [];
//   const errors = [];

//   for (const employee of employees) {
//     try {
//       // Check if payroll already exists
//       const existingPayroll = await Payroll.findOne({ employee: employee._id, month, year });
//       if (existingPayroll) {
//         errors.push(`Payroll already exists for ${employee.name} in ${month}/${year}`);
//         continue;
//       }

//       // Create payroll data
//       const payrollData = {
//         employee: employee._id,
//         month: parseInt(month),
//         year: parseInt(year),
//         basicSalary: (employee.basicSalary || 30000) + basicSalaryIncrement,
//         allowances: {
//           houseRent: 0 + allowanceIncrement,
//           medical: 0 + allowanceIncrement,
//           transport: 0 + allowanceIncrement,
//           food: 0 + allowanceIncrement,
//           other: 0
//         },
//         deductions: {
//           tax: 0,
//           insurance: 0,
//           loan: 0,
//           other: 0
//         },
//         overtime: { hours: 0, rate: 0, amount: 0 },
//         bonus: 0,
//         createdBy: req.admin.id
//       };

//       // Manually calculate totals (replicating pre-save logic)
//       payrollData.totalAllowances =
//         (payrollData.allowances.houseRent || 0) +
//         (payrollData.allowances.medical || 0) +
//         (payrollData.allowances.transport || 0) +
//         (payrollData.allowances.food || 0) +
//         (payrollData.allowances.other || 0);

//       payrollData.totalDeductions =
//         (payrollData.deductions.tax || 0) +
//         (payrollData.deductions.insurance || 0) +
//         (payrollData.deductions.loan || 0) +
//         (payrollData.deductions.other || 0);

//       payrollData.overtime.amount = (payrollData.overtime.hours || 0) * (payrollData.overtime.rate || 0);

//       payrollData.grossSalary = (payrollData.basicSalary || 0) +
//         payrollData.totalAllowances +
//         payrollData.overtime.amount +
//         (payrollData.bonus || 0);

//       payrollData.netSalary = payrollData.grossSalary - payrollData.totalDeductions;
//       payrollData.paymentStatus = "paid";

//       payrolls.push(payrollData);
//     } catch (error) {
//       errors.push(`Error processing ${employee.name}: ${error.message}`);
//     }
//   }

//   if (payrolls.length === 0) {
//     return res.status(400).json({
//       status: 'error',
//       message: 'No payrolls could be created',
//       errors
//     });
//   }

//   const createdPayrolls = await Payroll.insertMany(payrolls);

//   res.status(201).json({
//     status: 'success',
//     message: `${createdPayrolls.length} payrolls created successfully`,
//     data: createdPayrolls,
//     errors: errors.length > 0 ? errors : undefined
//   });
// });

// // Process payment
// exports.processPayment = catchAsync(async (req, res) => {
//   const { paymentStatus, paymentDate, paymentMethod, notes } = req.body;

//   const payroll = await Payroll.findById(req.params.id);
//   if (!payroll) {
//     return res.status(404).json({
//       status: 'error',
//       message: 'Payroll not found'
//     });
//   }

//   if (paymentStatus === 'paid') {
//     payroll.paymentDate = paymentDate || new Date();
//     payroll.paymentMethod = paymentMethod || payroll.paymentMethod;
//   }

//   payroll.paymentStatus = paymentStatus;
//   if (notes) payroll.notes = notes;

//   await payroll.save();

//   res.status(200).json({
//     status: 'success',
//     message: 'Payment processed successfully',
//     data: payroll
//   });
// });

// // Get payroll statistics
// exports.getPayrollStats = catchAsync(async (req, res) => {
//   const { month, year } = req.query;

//   const filter = {};
//   if (month) filter.month = parseInt(month);
//   if (year) filter.year = parseInt(year);

//   const stats = await Payroll.aggregate([
//     { $match: filter },
//     {
//       $group: {
//         _id: null,
//         totalPayrolls: { $sum: 1 },
//         totalGrossSalary: { $sum: '$grossSalary' },
//         totalNetSalary: { $sum: '$netSalary' },
//         totalAllowances: { $sum: '$totalAllowances' },
//         totalDeductions: { $sum: '$totalDeductions' },
//         totalOvertime: { $sum: '$overtime.amount' },
//         totalBonus: { $sum: '$bonus' },
//         pendingPayments: {
//           $sum: { $cond: [{ $eq: ['$paymentStatus', 'pending'] }, 1, 0] }
//         },
//         paidPayments: {
//           $sum: { $cond: [{ $eq: ['$paymentStatus', 'paid'] }, 1, 0] }
//         }
//       }
//     }
//   ]);

//   const monthlyStats = await Payroll.aggregate([
//     { $match: filter },
//     {
//       $group: {
//         _id: { month: '$month', year: '$year' },
//         totalNetSalary: { $sum: '$netSalary' },
//         count: { $sum: 1 }
//       }
//     },
//     { $sort: { '_id.year': 1, '_id.month': 1 } }
//   ]);

//   res.status(200).json({
//     status: 'success',
//     data: {
//       summary: stats[0] || {
//         totalPayrolls: 0,
//         totalGrossSalary: 0,
//         totalNetSalary: 0,
//         totalAllowances: 0,
//         totalDeductions: 0,
//         totalOvertime: 0,
//         totalBonus: 0,
//         pendingPayments: 0,
//         paidPayments: 0
//       },
//       monthlyStats
//     }
//   });
// });

// // Get employee payroll history
// exports.getEmployeePayrollHistory = catchAsync(async (req, res) => {
//   const { employeeId } = req.params;
//   const { limit = 12 } = req.query;

//   const payrolls = await Payroll.find({ employee: employeeId })
//     .sort({ year: -1, month: -1 })
//     .limit(parseInt(limit))
//     .populate('employee', 'name email role');

//   res.status(200).json({
//     status: 'success',
//     data: payrolls
//   });
// });


//---------------------------------------------------------------------------------------------------------------------------
const Payroll = require('../models/Payroll');
const Employee = require('../models/Employee');
const { createNotification } = require('./notificationController');
const catchAsync = require('../utils/catchAsync');

const createPayroll = catchAsync(async (req, res) => {
  const {
    employee,
    month,
    year,
    basicSalary,
    allowances,
    deductions,
    overtime,
    bonus,
    notes
  } = req.body;

  const existingPayroll = await Payroll.findOne({ employee, month, year });
  if (existingPayroll) {
    return res.status(400).json({
      status: 'error',
      message: 'Payroll already exists for this employee in the specified month and year'
    });
  }

  const employeeExists = await Employee.findById(employee);
  if (!employeeExists) {
    return res.status(400).json({
      status: 'error',
      message: 'Employee not found'
    });
  }

  let finalBasicSalary = parseFloat(basicSalary);
  if (!finalBasicSalary || finalBasicSalary <= 0) {
    const employeeData = await Employee.findById(employee).select('basicSalary');
    if (employeeData && employeeData.basicSalary > 0) {
      finalBasicSalary = employeeData.basicSalary;
    } else {
      return res.status(400).json({
        status: 'error',
        message: 'Basic salary is required and must be greater than 0'
      });
    }
  }

  const payrollData = {
    employee,
    month: parseInt(month),
    year: parseInt(year),
    basicSalary: finalBasicSalary,
    allowances: {
      houseRent: parseFloat(allowances?.houseRent || 0),
      medical: parseFloat(allowances?.medical || 0),
      transport: parseFloat(allowances?.transport || 0),
      food: parseFloat(allowances?.food || 0),
      other: parseFloat(allowances?.other || 0)
    },
    deductions: {
      tax: parseFloat(deductions?.tax || 0),
      insurance: parseFloat(deductions?.insurance || 0),
      loan: parseFloat(deductions?.loan || 0),
      other: parseFloat(deductions?.other || 0)
    },
    overtime: {
      hours: parseFloat(overtime?.hours || 0),
      rate: parseFloat(overtime?.rate || 0)
    },
    bonus: parseFloat(bonus || 0),
    notes,
    createdBy: req.admin.id
  };

  const payroll = await Payroll.create(payrollData);

  // Create notification for employee
  await createNotification(
    employee,
    'payroll',
    `Your payroll for ${month}/${year} has been created with net salary $${payroll.netSalary}`,
    payroll._id,
    'Payroll'
  );
  // Emit real-time notification
  req.io.to(`employee_${employee}`).emit('newNotification', {
    type: 'payroll',
    message: `Your payroll for ${month}/${year} has been created with net salary $${payroll.netSalary}`,
    relatedId: payroll._id,
    createdAt: new Date(),
  });

  res.status(201).json({
    status: 'success',
    message: 'Payroll created successfully',
    data: payroll
  });
});

// Include other functions from your original payrollController.js
const getPayrolls = catchAsync(async (req, res) => {
  const { page = 1, limit = 10, month, year, status, employee, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
  const filter = {};
  if (month) filter.month = parseInt(month);
  if (year) filter.year = parseInt(year);
  if (status) filter.paymentStatus = status;
  if (employee) filter.employee = employee;

  const sort = {};
  sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const limitNum = parseInt(limit);

  const [payrolls, total] = await Promise.all([
    Payroll.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(limitNum)
      .populate({
        path: 'employee',
        select: 'name email role department',
        populate: {
          path: 'department',
          select: 'name'
        }
      }),
    Payroll.countDocuments(filter)
  ]);

  const totalPages = Math.ceil(total / limitNum);

  res.status(200).json({
    status: 'success',
    data: {
      docs: payrolls,
      totalDocs: total,
      limit: limitNum,
      page: parseInt(page),
      totalPages,
      hasNextPage: parseInt(page) < totalPages,
      hasPrevPage: parseInt(page) > 1
    }
  });
});

const getPayrollById = catchAsync(async (req, res) => {
  const payroll = await Payroll.findById(req.params.id)
    .populate({
      path: 'employee',
      select: 'name email role department mobile joiningDate',
      populate: {
        path: 'department',
        select: 'name'
      }
    })
    .populate('createdBy', 'name email');

  if (!payroll) {
    return res.status(404).json({
      status: 'error',
      message: 'Payroll not found'
    });
  }

  res.status(200).json({
    status: 'success',
    data: payroll
  });
});

const updatePayroll = catchAsync(async (req, res) => {
  const {
    basicSalary,
    allowances,
    deductions,
    overtime,
    bonus,
    paymentStatus,
    paymentDate,
    paymentMethod,
    notes
  } = req.body;

  const payroll = await Payroll.findById(req.params.id);
  if (!payroll) {
    return res.status(404).json({
      status: 'error',
      message: 'Payroll not found'
    });
  }

  if (basicSalary !== undefined) payroll.basicSalary = parseFloat(basicSalary);
  if (allowances) {
    Object.keys(allowances).forEach(key => {
      if (allowances[key] !== undefined) {
        payroll.allowances[key] = parseFloat(allowances[key] || 0);
      }
    });
  }
  if (deductions) {
    Object.keys(deductions).forEach(key => {
      if (deductions[key] !== undefined) {
        payroll.deductions[key] = parseFloat(deductions[key] || 0);
      }
    });
  }
  if (overtime) {
    if (overtime.hours !== undefined) payroll.overtime.hours = parseFloat(overtime.hours);
    if (overtime.rate !== undefined) payroll.overtime.rate = parseFloat(overtime.rate);
  }
  if (bonus !== undefined) payroll.bonus = parseFloat(bonus);
  if (paymentStatus) payroll.paymentStatus = paymentStatus;
  if (paymentDate) payroll.paymentDate = paymentDate;
  if (paymentMethod) payroll.paymentMethod = paymentMethod;
  if (notes !== undefined) payroll.notes = notes;

  await payroll.save();

  res.status(200).json({
    status: 'success',
    message: 'Payroll updated successfully',
    data: payroll
  });
});

const deletePayroll = catchAsync(async (req, res) => {
  const payroll = await Payroll.findById(req.params.id);
  if (!payroll) {
    return res.status(404).json({
      status: 'error',
      message: 'Payroll not found'
    });
  }

  await Payroll.findByIdAndDelete(req.params.id);

  res.status(200).json({
    status: 'success',
    message: 'Payroll deleted successfully'
  });
});

const bulkCreatePayrolls = catchAsync(async (req, res) => {
  const { month, year, basicSalaryIncrement = 0, allowanceIncrement = 0 } = req.body;

  if (!month || !year) {
    return res.status(400).json({
      status: 'error',
      message: 'Month and year are required'
    });
  }

  const employees = await Employee.find({ status: 'active' });

  if (employees.length === 0) {
    return res.status(400).json({
      status: 'error',
      message: 'No active employees found'
    });
  }

  const payrolls = [];
  const errors = [];

  for (const employee of employees) {
    try {
      const existingPayroll = await Payroll.findOne({ employee: employee._id, month, year });
      if (existingPayroll) {
        errors.push(`Payroll already exists for ${employee.name} in ${month}/${year}`);
        continue;
      }

      const payrollData = {
        employee: employee._id,
        month: parseInt(month),
        year: parseInt(year),
        basicSalary: (employee.basicSalary || 30000) + basicSalaryIncrement,
        allowances: {
          houseRent: 0 + allowanceIncrement,
          medical: 0 + allowanceIncrement,
          transport: 0 + allowanceIncrement,
          food: 0 + allowanceIncrement,
          other: 0
        },
        deductions: {
          tax: 0,
          insurance: 0,
          loan: 0,
          other: 0
        },
        overtime: { hours: 0, rate: 0, amount: 0 },
        bonus: 0,
        createdBy: req.admin.id
      };

      payrollData.totalAllowances =
        (payrollData.allowances.houseRent || 0) +
        (payrollData.allowances.medical || 0) +
        (payrollData.allowances.transport || 0) +
        (payrollData.allowances.food || 0) +
        (payrollData.allowances.other || 0);

      payrollData.totalDeductions =
        (payrollData.deductions.tax || 0) +
        (payrollData.deductions.insurance || 0) +
        (payrollData.deductions.loan || 0) +
        (payrollData.deductions.other || 0);

      payrollData.overtime.amount = (payrollData.overtime.hours || 0) * (payrollData.overtime.rate || 0);

      payrollData.grossSalary = (payrollData.basicSalary || 0) +
        payrollData.totalAllowances +
        payrollData.overtime.amount +
        (payrollData.bonus || 0);

      payrollData.netSalary = payrollData.grossSalary - payrollData.totalDeductions;
      payrollData.paymentStatus = "paid";

      payrolls.push(payrollData);
    } catch (error) {
      errors.push(`Error processing ${employee.name}: ${error.message}`);
    }
  }

  if (payrolls.length === 0) {
    return res.status(400).json({
      status: 'error',
      message: 'No payrolls could be created',
      errors
    });
  }

  const createdPayrolls = await Payroll.insertMany(payrolls);

  res.status(201).json({
    status: 'success',
    message: `${createdPayrolls.length} payrolls created successfully`,
    data: createdPayrolls,
    errors: errors.length > 0 ? errors : undefined
  });
});

const processPayment = catchAsync(async (req, res) => {
  const { paymentStatus, paymentDate, paymentMethod, notes } = req.body;

  const payroll = await Payroll.findById(req.params.id);
  if (!payroll) {
    return res.status(404).json({
      status: 'error',
      message: 'Payroll not found'
    });
  }

  if (paymentStatus === 'paid') {
    payroll.paymentDate = paymentDate || new Date();
    payroll.paymentMethod = paymentMethod || payroll.paymentMethod;
  }

  payroll.paymentStatus = paymentStatus;
  if (notes) payroll.notes = notes;

  await payroll.save();

  res.status(200).json({
    status: 'success',
    message: 'Payment processed successfully',
    data: payroll
  });
});

const getPayrollStats = catchAsync(async (req, res) => {
  const { month, year } = req.query;

  const filter = {};
  if (month) filter.month = parseInt(month);
  if (year) filter.year = parseInt(year);

  const stats = await Payroll.aggregate([
    { $match: filter },
    {
      $group: {
        _id: null,
        totalPayrolls: { $sum: 1 },
        totalGrossSalary: { $sum: '$grossSalary' },
        totalNetSalary: { $sum: '$netSalary' },
        totalAllowances: { $sum: '$totalAllowances' },
        totalDeductions: { $sum: '$totalDeductions' },
        totalOvertime: { $sum: '$overtime.amount' },
        totalBonus: { $sum: '$bonus' },
        pendingPayments: {
          $sum: { $cond: [{ $eq: ['$paymentStatus', 'pending'] }, 1, 0] }
        },
        paidPayments: {
          $sum: { $cond: [{ $eq: ['$paymentStatus', 'paid'] }, 1, 0] }
        }
      }
    }
  ]);

  const monthlyStats = await Payroll.aggregate([
    { $match: filter },
    {
      $group: {
        _id: { month: '$month', year: '$year' },
        totalNetSalary: { $sum: '$netSalary' },
        count: { $sum: 1 }
      }
    },
    { $sort: { '_id.year': 1, '_id.month': 1 } }
  ]);

  res.status(200).json({
    status: 'success',
    data: {
      summary: stats[0] || {
        totalPayrolls: 0,
        totalGrossSalary: 0,
        totalNetSalary: 0,
        totalAllowances: 0,
        totalDeductions: 0,
        totalOvertime: 0,
        totalBonus: 0,
        pendingPayments: 0,
        paidPayments: 0
      },
      monthlyStats
    }
  });
});

const getEmployeePayrollHistory = catchAsync(async (req, res) => {
  const { employeeId } = req.params;
  const { limit = 12 } = req.query;

  const payrolls = await Payroll.find({ employee: employeeId })
    .sort({ year: -1, month: -1 })
    .limit(parseInt(limit))
    .populate('employee', 'name email role');

  res.status(200).json({
    status: 'success',
    data: payrolls
  });
});

module.exports = {
  getPayrolls,
  getPayrollById,
  createPayroll,
  updatePayroll,
  deletePayroll,
  bulkCreatePayrolls,
  processPayment,
  getPayrollStats,
  getEmployeePayrollHistory,
};