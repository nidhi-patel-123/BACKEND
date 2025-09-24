const Attendance = require('../models/Attendance');
const Employee = require('../models/Employee');
const Admin = require('../models/Admin');
const { createNotification } = require('./notificationController');

function normalizeToUTCDate(date) {
  const d = new Date(date);
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

const list = async (req, res) => {
  try {
    const { from, to, employeeId, page = 1, limit = 20 } = req.query;
    const query = {};
    if (employeeId) query.employee = employeeId;
    if (from || to) {
      query.attendanceDate = {};
      if (from) query.attendanceDate.$gte = normalizeToUTCDate(from);
      if (to) query.attendanceDate.$lte = normalizeToUTCDate(to);
    }

    const skip = (Number(page) - 1) * Number(limit);
    const [items, total] = await Promise.all([
      Attendance.find(query)
        .populate('employee', 'name email department')
        .sort({ attendanceDate: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Attendance.countDocuments(query),
    ]);

    res.json({ items, total, page: Number(page), limit: Number(limit) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to list attendance' });
  }
};

const checkIn = async (req, res) => {
  try {
    const { employeeId, checkIn } = req.body;
    if (!employeeId) return res.status(400).json({ message: 'employeeId is required' });

    const employee = await Employee.findById(employeeId);
    if (!employee) return res.status(404).json({ message: 'Employee not found' });

    const checkInDate = checkIn ? new Date(checkIn) : new Date();
    const attendanceDate = normalizeToUTCDate(checkInDate);

    const attendance = await Attendance.findOneAndUpdate(
      { employee: employeeId, attendanceDate },
      { $setOnInsert: { employee: employeeId, attendanceDate }, $set: { checkIn: checkInDate, checkOut: null, workingMinutes: 0 } },
      { new: true, upsert: true }
    );

    await attendance.save();

    // Create notification for admin
    const admins = await Admin.find();
    let lastPayload;
    for (const admin of admins) {
      await createNotification(
        admin._id,
        'Admin',
        'attendance',
        `${employee.name} checked in at ${checkInDate.toLocaleTimeString()}`,
        attendance._id,
        'Attendance'
      );
      lastPayload = {
        type: 'attendance',
        message: `${employee.name} checked in at ${checkInDate.toLocaleTimeString()}`,
        relatedId: attendance._id,
        createdAt: new Date(),
      };
      req.io.to(`admin_${admin._id}`).emit('newNotification', lastPayload);
    }
    // Broadcast to all admins as a fallback (clients in 'admins' room)
    if (admins && admins.length > 0) {
      req.io.to('admins').emit('newNotification', lastPayload);
    }

    res.status(200).json(attendance);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to check in' });
  }
};

const checkOut = async (req, res) => {
  try {
    const { employeeId, checkOut } = req.body;
    if (!employeeId) return res.status(400).json({ message: 'employeeId is required' });

    const employee = await Employee.findById(employeeId);
    if (!employee) return res.status(404).json({ message: 'Employee not found' });

    const now = checkOut ? new Date(checkOut) : new Date();
    const attendanceDate = normalizeToUTCDate(now);

    const attendance = await Attendance.findOne({ employee: employeeId, attendanceDate });
    if (!attendance || !attendance.checkIn) {
      return res.status(400).json({ message: 'No check-in found for today' });
    }

    attendance.checkOut = now;
    await attendance.save();

    // Create notification for admin
    const admins = await Admin.find();
    let lastPayloadOut;
    for (const admin of admins) {
      await createNotification(
        admin._id,
        'Admin',
        'attendance',
        `${employee.name} checked out at ${now.toLocaleTimeString()}`,
        attendance._id,
        'Attendance'
      );
      lastPayloadOut = {
        type: 'attendance',
        message: `${employee.name} checked out at ${now.toLocaleTimeString()}`,
        relatedId: attendance._id,
        createdAt: new Date(),
      };
      req.io.to(`admin_${admin._id}`).emit('newNotification', lastPayloadOut);
    }
    if (admins && admins.length > 0) {
      req.io.to('admins').emit('newNotification', lastPayloadOut);
    }

    res.status(200).json(attendance);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to check out' });
  }
};

const upsert = async (req, res) => {
  try {
    const { employeeId, date, checkIn, checkOut } = req.body;
    if (!employeeId || !date) return res.status(400).json({ message: 'employeeId and date are required' });
    const attendanceDate = normalizeToUTCDate(date);

    const data = { employee: employeeId, attendanceDate };
    if (checkIn !== undefined) data.checkIn = checkIn ? new Date(checkIn) : null;
    if (checkOut !== undefined) data.checkOut = checkOut ? new Date(checkOut) : null;

    const record = await Attendance.findOneAndUpdate(
      { employee: employeeId, attendanceDate },
      { $set: data, $setOnInsert: { employee: employeeId, attendanceDate } },
      { new: true, upsert: true }
    );
    await record.save();
    res.json(record);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to upsert attendance' });
  }
};

module.exports = {
  list,
  checkIn,
  checkOut,
  upsert,
};