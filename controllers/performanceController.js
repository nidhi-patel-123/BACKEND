const Performance = require('../models/Performance');
const Attendance = require('../models/Attendance');
const Leave = require('../models/Leave');
const Task = require('../models/Task');

exports.getAllPerformances = async (req, res) => {
  try {
    const performances = await Performance.find()
      .populate('employee', 'name role basicSalary')
      .sort({ createdAt: -1 });
    res.status(200).json(performances);
  } catch (error) {
    console.error('Error fetching performances:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.createPerformance = async (req, res) => {
  try {
    const { employeeId, achievements, month, year } = req.body;
    if (!employeeId || !month || !year) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const monthIndex = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December',
    ].indexOf(month) + 1;
    const startDate = new Date(`${year}-${monthIndex}-01`);
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + 1);

    // Attendance Score (30%)
    const attendance = await Attendance.find({
      employee: employeeId,
      attendanceDate: { $gte: startDate, $lt: endDate },
    });
    const totalDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
    const presentDays = attendance.filter((a) => a.status === 'present').length;
    const attendanceScore = totalDays > 0 ? (presentDays / totalDays) * 100 : 0;

    // Leave Score (20%)
    const leaves = await Leave.find({
      employee: employeeId,
      from: { $gte: startDate },
      to: { $lt: endDate },
      status: 'Approved',
    });
    const leaveDays = leaves.reduce((sum, leave) => {
      const days = Math.ceil((new Date(leave.to) - new Date(leave.from)) / (1000 * 60 * 60 * 24)) + 1;
      return sum + (leave.type === 'Unpaid Leave' ? days * 1.5 : days);
    }, 0);
    const leaveScore = leaveDays > 10 ? 10 : 100 - (leaveDays * 10);

    // Task Score (50%)
    const tasks = await Task.find({
      employeeId: employeeId,
      createdAt: { $gte: startDate, $lt: endDate },
    });
    const completedTasks = tasks.filter((t) => t.status === 'Completed').length;
    const taskScore = tasks.length > 0 ? (completedTasks / tasks.length) * 100 : 0;

    // Calculate performance
    const performance = (attendanceScore * 0.3) + (leaveScore * 0.2) + (taskScore * 0.5);

    const newPerformance = new Performance({
      employee: employeeId,
      performance,
      attendanceScore,
      leaveScore,
      taskScore,
      tasksCompleted: completedTasks,
      totalTasks: tasks.length,
      presentDays,
      leaveDays,
      achievements,
      month,
      year,
    });
    await newPerformance.save();
    await newPerformance.populate('employee', 'name role basicSalary');
    res.status(201).json(newPerformance);
  } catch (error) {
    console.error('Error creating performance:', error);
    res.status(400).json({ message: 'Invalid data', error: error.message });
  }
};

exports.updatePerformance = async (req, res) => {
  try {
    const { id } = req.params;
    const { achievements, month, year } = req.body;

    const performanceRecord = await Performance.findById(id);
    if (!performanceRecord) {
      return res.status(404).json({ message: 'Performance record not found' });
    }

    let attendanceScore = performanceRecord.attendanceScore;
    let leaveScore = performanceRecord.leaveScore;
    let taskScore = performanceRecord.taskScore;
    let tasksCompleted = performanceRecord.tasksCompleted;
    let totalTasks = performanceRecord.totalTasks;
    let presentDays = performanceRecord.presentDays;
    let leaveDays = performanceRecord.leaveDays;

    if (month && year) {
      const monthIndex = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December',
      ].indexOf(month) + 1;
      const startDate = new Date(`${year}-${monthIndex}-01`);
      const endDate = new Date(startDate);
      endDate.setMonth(endDate.getMonth() + 1);

      // Attendance Score
      const attendance = await Attendance.find({
        employee: performanceRecord.employee,
        attendanceDate: { $gte: startDate, $lt: endDate },
      });
      const totalDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
      presentDays = attendance.filter((a) => a.status === 'present').length;
      attendanceScore = totalDays > 0 ? (presentDays / totalDays) * 100 : 0;

      // Leave Score
      const leaves = await Leave.find({
        employee: performanceRecord.employee,
        from: { $gte: startDate },
        to: { $lt: endDate },
        status: 'Approved',
      });
      leaveDays = leaves.reduce((sum, leave) => {
        const days = Math.ceil((new Date(leave.to) - new Date(leave.from)) / (1000 * 60 * 60 * 24)) + 1;
        return sum + (leave.type === 'Unpaid Leave' ? days * 1.5 : days);
      }, 0);
      leaveScore = leaveDays > 10 ? 10 : 100 - (leaveDays * 10);

      // Task Score
      const tasks = await Task.find({
        employeeId: performanceRecord.employee,
        createdAt: { $gte: startDate, $lt: endDate },
      });
      tasksCompleted = tasks.filter((t) => t.status === 'Completed').length;
      totalTasks = tasks.length;
      taskScore = tasks.length > 0 ? (tasksCompleted / tasks.length) * 100 : 0;
    }

    const performance = (attendanceScore * 0.3) + (leaveScore * 0.2) + (taskScore * 0.5);

    const updated = await Performance.findByIdAndUpdate(
      id,
      {
        performance,
        attendanceScore,
        leaveScore,
        taskScore,
        tasksCompleted,
        totalTasks,
        presentDays,
        leaveDays,
        achievements: achievements || performanceRecord.achievements,
        month: month || performanceRecord.month,
        year: year || performanceRecord.year,
      },
      { new: true }
    ).populate('employee', 'name role basicSalary');

    if (!updated) {
      return res.status(404).json({ message: 'Performance record not found' });
    }

    res.status(200).json(updated);
  } catch (error) {
    console.error('Error updating performance:', error);
    res.status(400).json({ message: 'Invalid data', error: error.message });
  }
};

exports.deletePerformance = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Performance.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ message: 'Performance record not found' });
    res.status(200).json({ message: 'Deleted successfully' });
  } catch (error) {
    console.error('Error deleting performance:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};