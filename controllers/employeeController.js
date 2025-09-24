const Employee = require('../models/Employee');
const Attendance = require('../models/Attendance');
const Leave = require('../models/Leave');
const Project = require('../models/Project');
const Payroll = require('../models/Payroll');
const Performance = require('../models/Performance');
const Admin = require('../models/Admin');
const Notification = require('../models/Notification');
const Task = require('../models/Task');
const bcrypt = require('bcryptjs');

// Get employee profile
exports.getProfile = async (req, res) => {
  try {
    const employee = await Employee.findById(req.user._id)
      .select('-password')
      .populate('department');
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }
    res.json(employee);
  } catch (err) {
    console.error('Error fetching profile:', err);
    res.status(500).json({ message: 'Error fetching profile', error: err.message });
  }
};

// Update employee profile
exports.updateProfile = async (req, res) => {
  try {
    const updated = await Employee.findByIdAndUpdate(req.user._id, req.body, {
      new: true,
      runValidators: true,
    })
      .select('-password')
      .populate('department');
    if (!updated) {
      return res.status(404).json({ message: 'Employee not found' });
    }
    res.json(updated);
  } catch (err) {
    console.error('Error updating profile:', err);
    res.status(500).json({ message: 'Error updating profile', error: err.message });
  }
};

// Get employee attendance
exports.getAttendance = async (req, res) => {
  try {
    const attendance = await Attendance.find({ employee: req.user._id })
      .sort({ attendanceDate: -1 })
      .limit(30);
    res.json(
      attendance.map((record) => ({
        id: record._id,
        date: record.attendanceDate.toISOString().slice(0, 10),
        checkIn: record.checkIn ? record.checkIn.toISOString() : null,
        checkOut: record.checkOut ? record.checkOut.toISOString() : null,
        breakStart: record.breakStart ? record.breakStart.toISOString() : null,
        breakEnd: record.breakEnd ? record.breakEnd.toISOString() : null,
        workingMinutes: record.workingMinutes,
        status: record.status,
      }))
    );
  } catch (err) {
    console.error('Error fetching attendance:', err);
    res.status(500).json({ message: 'Error fetching attendance', error: err.message });
  }
};

// Check-in
exports.checkIn = async (req, res) => {
  try {
    const today = new Date().setUTCHours(0, 0, 0, 0);
    let record = await Attendance.findOne({
      employee: req.user._id,
      attendanceDate: new Date(today),
    });
    if (record && record.checkIn) {
      return res.status(400).json({ message: 'Already checked in today' });
    }
    if (!record) {
      record = new Attendance({
        employee: req.user._id,
        attendanceDate: new Date(today),
      });
    }
    record.checkIn = new Date();
    await record.save();

    const admins = await Admin.find();
    const employeeName = req.user.name || req.user.email || 'An employee';
    const message = `${employeeName} has checked in.`;

    for (const admin of admins) {
      const notification = new Notification({
        recipient: admin._id,
        recipientModel: 'Admin',
        type: 'attendance',
        message,
        relatedId: record._id,
        relatedModel: 'Attendance',
      });
      await notification.save();
      req.io.to(`admin_${admin._id}`).emit('newNotification', notification);
    }

    res.json({
      id: record._id,
      date: record.attendanceDate.toISOString().slice(0, 10),
      checkIn: record.checkIn.toISOString(),
      checkOut: record.checkOut ? record.checkOut.toISOString() : null,
      breakStart: record.breakStart ? record.breakStart.toISOString() : null,
      breakEnd: record.breakEnd ? record.breakEnd.toISOString() : null,
      workingMinutes: record.workingMinutes,
      status: record.status,
    });
  } catch (err) {
    console.error('Error during check-in:', err);
    res.status(500).json({ message: 'Error during check-in', error: err.message });
  }
};

// Check-out
exports.checkOut = async (req, res) => {
  try {
    const today = new Date().setUTCHours(0, 0, 0, 0);
    let record = await Attendance.findOne({
      employee: req.user._id,
      attendanceDate: new Date(today),
    });
    if (!record || !record.checkIn) {
      return res.status(400).json({ message: 'Check-in required first' });
    }
    if (record.checkOut) {
      return res.status(400).json({ message: 'Already checked out today' });
    }
    if (record.breakStart && !record.breakEnd) {
      return res.status(400).json({ message: 'Cannot check out while on break. End break first.' });
    }
    record.checkOut = new Date();
    await record.save();

    const admins = await Admin.find();
    const employeeName = req.user.name || req.user.email || 'An employee';
    const message = `${employeeName} has checked out.`;

    for (const admin of admins) {
      const notification = new Notification({
        recipient: admin._id,
        recipientModel: 'Admin',
        type: 'attendance',
        message,
        relatedId: record._id,
        relatedModel: 'Attendance',
      });
      await notification.save();
      req.io.to(`admin_${admin._id}`).emit('newNotification', notification);
    }

    res.json({
      id: record._id,
      date: record.attendanceDate.toISOString().slice(0, 10),
      checkIn: record.checkIn.toISOString(),
      checkOut: record.checkOut.toISOString(),
      breakStart: record.breakStart ? record.breakStart.toISOString() : null,
      breakEnd: record.breakEnd ? record.breakEnd.toISOString() : null,
      workingMinutes: record.workingMinutes,
      status: record.status,
    });
  } catch (err) {
    console.error('Error during check-out:', err);
    res.status(500).json({ message: 'Error during check-out', error: err.message });
  }
};

// Break-in
exports.breakIn = async (req, res) => {
  try {
    const today = new Date().setUTCHours(0, 0, 0, 0);
    let record = await Attendance.findOne({
      employee: req.user._id,
      attendanceDate: new Date(today),
    });
    if (!record || !record.checkIn || record.checkOut) {
      return res.status(400).json({ message: 'Must be checked in and not checked out to start a break' });
    }
    if (record.breakStart && !record.breakEnd) {
      return res.status(400).json({ message: 'Already on break' });
    }
    if (record.breakStart && record.breakEnd) {
      return res.status(400).json({ message: 'Break already taken and ended today' });
    }
    record.breakStart = new Date();
    await record.save();

    const admins = await Admin.find();
    const employeeName = req.user.name || req.user.email || 'An employee';
    const message = `${employeeName} has started a break.`;

    for (const admin of admins) {
      const notification = new Notification({
        recipient: admin._id,
        recipientModel: 'Admin',
        type: 'attendance',
        message,
        relatedId: record._id,
        relatedModel: 'Attendance',
      });
      await notification.save();
      req.io.to(`admin_${admin._id}`).emit('newNotification', notification);
    }

    res.json({
      id: record._id,
      date: record.attendanceDate.toISOString().slice(0, 10),
      checkIn: record.checkIn ? record.checkIn.toISOString() : null,
      checkOut: record.checkOut ? record.checkOut.toISOString() : null,
      breakStart: record.breakStart ? record.breakStart.toISOString() : null,
      breakEnd: record.breakEnd ? record.breakEnd.toISOString() : null,
      workingMinutes: record.workingMinutes,
      status: record.status,
    });
  } catch (err) {
    console.error('Error during break-in:', err);
    res.status(500).json({ message: 'Error during break-in', error: err.message });
  }
};

// Break-out
exports.breakOut = async (req, res) => {
  try {
    const today = new Date().setUTCHours(0, 0, 0, 0);
    let record = await Attendance.findOne({
      employee: req.user._id,
      attendanceDate: new Date(today),
    });
    if (!record || !record.checkIn || record.checkOut) {
      return res.status(400).json({ message: 'Must be checked in and not checked out to end a break' });
    }
    if (!record.breakStart || record.breakEnd) {
      return res.status(400).json({ message: 'Not on break' });
    }
    record.breakEnd = new Date();
    await record.save();

    const admins = await Admin.find();
    const employeeName = req.user.name || req.user.email || 'An employee';
    const message = `${employeeName} has ended a break.`;

    for (const admin of admins) {
      const notification = new Notification({
        recipient: admin._id,
        recipientModel: 'Admin',
        type: 'attendance',
        message,
        relatedId: record._id,
        relatedModel: 'Attendance',
      });
      await notification.save();
      req.io.to(`admin_${admin._id}`).emit('newNotification', notification);
    }

    res.json({
      id: record._id,
      date: record.attendanceDate.toISOString().slice(0, 10),
      checkIn: record.checkIn ? record.checkIn.toISOString() : null,
      checkOut: record.checkOut ? record.checkOut.toISOString() : null,
      breakStart: record.breakStart ? record.breakStart.toISOString() : null,
      breakEnd: record.breakEnd ? record.breakEnd.toISOString() : null,
      workingMinutes: record.workingMinutes,
      status: record.status,
    });
  } catch (err) {
    console.error('Error during break-out:', err);
    res.status(500).json({ message: 'Error during break-out', error: err.message });
  }
};

// Get employee leaves
exports.getLeaves = async (req, res) => {
  try {
    const leaves = await Leave.find({ employee: req.user._id }).sort({ from: -1 });
    res.json(leaves);
  } catch (err) {
    console.error('Error fetching leaves:', err);
    res.status(500).json({ message: 'Error fetching leaves', error: err.message });
  }
};

// Get employee performance
exports.getEmployeePerformance = async (req, res) => {
  try {
    if (!req.user || !req.user._id) {
      console.error('No user or user ID in request');
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const employeeId = req.user._id;
    const performances = await Performance.find({ employee: employeeId })
      .select('performance attendanceScore leaveScore taskScore tasksCompleted totalTasks presentDays leaveDays achievements month year createdAt')
      .sort({ createdAt: -1 })
      .lean();

    if (!performances || performances.length === 0) {
      return res.status(200).json([]);
    }

    res.status(200).json(performances);
  } catch (error) {
    console.error('Error fetching performance:', {
      message: error.message,
      stack: error.stack,
    });
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Apply leave
exports.applyLeave = async (req, res) => {
  try {
    const leave = new Leave({
      ...req.body,
      employee: req.user._id,
      status: 'Pending',
    });
    await leave.save();

    const admins = await Admin.find();
    const employeeName = req.user.name || req.user.email || 'An employee';
    const type = leave.type || 'leave';
    const startDate = new Date(leave.from);
    const endDate = new Date(leave.to);
    const message = `${employeeName} submitted a ${type} request from ${startDate.toLocaleDateString()} to ${endDate.toLocaleDateString()}`;

    for (const admin of admins) {
      const notification = new Notification({
        recipient: admin._id,
        recipientModel: 'Admin',
        type: 'leave',
        message,
        relatedId: leave._id,
        relatedModel: 'Leave',
      });
      await notification.save();
      req.io.to(`admin_${admin._id}`).emit('newNotification', notification.toObject());
    }

    res.status(201).json(leave);
  } catch (err) {
    console.error('Error applying for leave:', err);
    res.status(500).json({ message: 'Error applying for leave', error: err.message });
  }
};

// Get employee projects
exports.getProjects = async (req, res) => {
  try {
    const projects = await Project.find({ team: req.user._id }).populate('team');
    res.json(projects);
  } catch (err) {
    console.error('Error fetching projects:', err);
    res.status(500).json({ message: 'Error fetching projects', error: err.message });
  }
};

// Get employee payrolls
exports.getPayrolls = async (req, res) => {
  try {
    const payrolls = await Payroll.find({ employee: req.user._id }).sort({ month: -1 });
    res.json(payrolls);
  } catch (err) {
    console.error('Error fetching payrolls:', err);
    res.status(500).json({ message: 'Error fetching payrolls', error: err.message });
  }
};

// Change employee password
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Current and new password required' });
    }
    const employee = await Employee.findById(req.user._id);
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }
    const isMatch = await bcrypt.compare(currentPassword, employee.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }
    employee.password = newPassword;
    await employee.save();
    res.json({ message: 'Password changed successfully' });
  } catch (err) {
    console.error('Error changing password:', err);
    res.status(500).json({ message: 'Error changing password', error: err.message });
  }
};

// Get employee details for admin
exports.getEmployeeDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const { month, year } = req.query;

    if (!month || !year) {
      return res.status(400).json({ message: 'Month and year are required' });
    }

    const employee = await Employee.findById(id).select('name email role');
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    const monthIndex = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December',
    ].indexOf(month) + 1;
    const startDate = new Date(`${year}-${monthIndex}-01`);
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + 1);

    // Fetch attendance
    const attendance = await Attendance.find({
      employee: id,
      attendanceDate: { $gte: startDate, $lt: endDate },
    });
    const totalDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
    const presentDays = attendance.filter((a) => a.status === 'present').length;
    const attendanceScore = totalDays > 0 ? (presentDays / totalDays) * 100 : 0;

    // Fetch leaves
    const leaves = await Leave.find({
      employee: id,
      from: { $gte: startDate },
      to: { $lt: endDate },
      status: 'Approved',
    });
    const leaveDays = leaves.reduce((sum, leave) => {
      const days = Math.ceil((new Date(leave.to) - new Date(leave.from)) / (1000 * 60 * 60 * 24)) + 1;
      return sum + (leave.type === 'Unpaid Leave' ? days * 1.5 : days);
    }, 0);
    const leaveScore = leaveDays > 10 ? 10 : 100 - (leaveDays * 10);

    // Fetch tasks
    const tasks = await Task.find({
      employeeId: id,
      createdAt: { $gte: startDate, $lt: endDate },
    });
    const completedTasks = tasks.filter((t) => t.status === 'Completed').length;
    const taskScore = tasks.length > 0 ? (completedTasks / tasks.length) * 100 : 0;

    // Calculate performance
    const performance = (attendanceScore * 0.3) + (leaveScore * 0.2) + (taskScore * 0.5);

    res.status(200).json({
      employee,
      attendance: { presentDays, totalDays, attendanceScore },
      leave: { leaveDays, leaveScore },
      tasks: { completedTasks, totalTasks: tasks.length, taskScore },
      performance,
    });
  } catch (error) {
    console.error('Error fetching employee details:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};