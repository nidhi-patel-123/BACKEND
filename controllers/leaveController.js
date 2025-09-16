// const mongoose = require('mongoose');
// const Leave = require('../models/Leave');
// const Employee = require('../models/Employee'); // Import Employee model

// // Get all leave requests
// exports.getAllLeaves = async (req, res) => {
//   try {
//     const leaves = await Leave.find()
//       .populate('employee', 'name email') // Populate employee details
//       .sort({ createdAt: -1 }); // Latest first

//     res.status(200).json(leaves);
//   } catch (error) {
//     res.status(500).json({ message: 'Error fetching leaves', error });
//   }
// };


// // Create a new leave request
// exports.createLeave = async (req, res) => {
//   try {
//     const { employee, type, from, to, days } = req.body;

//     // Validate employee ID
//     if (!mongoose.Types.ObjectId.isValid(employee)) {
//       return res.status(400).json({ message: 'Invalid employee ID' });
//     }

//     // Check if employee exists
//     const employeeExists = await Employee.findById(employee);
//     if (!employeeExists) {
//       return res.status(404).json({ message: 'Employee not found' });
//     }

//     // Calculate days if not provided
//     const startDate = new Date(from);
//     const endDate = new Date(to);
//     const calculatedDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;

//     const leave = new Leave({
//       employee, // Now an ObjectId
//       type,
//       from,
//       to,
//       days: days || calculatedDays,
//       status: 'Pending',
//     });

//     await leave.save();
//     const populatedLeave = await Leave.findById(leave._id).populate('employee', 'name email');
//     res.status(201).json(populatedLeave);
//   } catch (error) {
//     res.status(400).json({ message: 'Error creating leave', error });
//   }
// };

// // Update leave status
// exports.updateLeaveStatus = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const { status } = req.body;

//     const leave = await Leave.findByIdAndUpdate(
//       id,
//       { status },
//       { new: true }
//     ).populate('employee', 'name email');

//     if (!leave) {
//       return res.status(404).json({ message: 'Leave not found' });
//     }

//     res.status(200).json(leave);
//   } catch (error) {
//     res.status(400).json({ message: 'Error updating leave', error });
//   }
// };

// // Delete leave request
// exports.deleteLeave = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const leave = await Leave.findByIdAndDelete(id);

//     if (!leave) {
//       return res.status(404).json({ message: 'Leave not found' });
//     }

//     res.status(200).json({ message: 'Leave deleted successfully' });
//   } catch (error) {
//     res.status(400).json({ message: 'Error deleting leave', error });
//   }
// };

// ----------------------------------------------------------------------------------------------------------------------------
// controllers/leaveController.js
const mongoose = require("mongoose");
const Leave = require("../models/Leave");
const Employee = require("../models/Employee");
const Admin = require("../models/Admin");
const { createNotification } = require("./notificationController");

/**
 * Get all leave requests
 */
const getAllLeaves = async (req, res) => {
  try {
    const leaves = await Leave.find()
      .populate("employee", "name email")
      .sort({ createdAt: -1 });

    return res.status(200).json(leaves);
  } catch (error) {
    console.error("Error fetching leaves:", error);
    return res.status(500).json({ message: "Error fetching leaves", error });
  }
};

/**
 * Create a new leave request
 */
const createLeave = async (req, res) => {
  try {
    const { employee, type, from, to, days, description } = req.body;

    // Validate employee ID
    if (!mongoose.Types.ObjectId.isValid(employee)) {
      return res.status(400).json({ message: "Invalid employee ID" });
    }

    // Check if employee exists
    const employeeExists = await Employee.findById(employee);
    if (!employeeExists) {
      return res.status(404).json({ message: "Employee not found" });
    }

    // Calculate leave days
    const startDate = new Date(from);
    const endDate = new Date(to);

    if (isNaN(startDate) || isNaN(endDate)) {
      return res.status(400).json({ message: "Invalid date format" });
    }

    const calculatedDays =
      Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;

    // Create leave
    const leave = new Leave({
      employee,
      type,
      from: startDate,
      to: endDate,
      days: days || calculatedDays,
      description,
      status: "Pending",
    });

    await leave.save();

    const populatedLeave = await Leave.findById(leave._id).populate(
      "employee",
      "name email"
    );

    // Notify admins
    const admins = await Admin.find();
    let lastPayload = null;

    for (const admin of admins) {
      const message = `${employeeExists.name} submitted a ${type} leave request from ${startDate.toLocaleDateString()} to ${endDate.toLocaleDateString()}`;

      await createNotification(
        admin._id,
        "Admin",
        "leave",
        message,
        leave._id,
        "Leave"
      );

      lastPayload = {
        type: "leave",
        message,
        relatedId: leave._id,
        createdAt: new Date(),
      };

      if (req.io) {
        req.io.to(`admin_${admin._id}`).emit("newNotification", lastPayload);
      }
    }

    if (req.io && admins.length > 0) {
      req.io.to("admins").emit("newNotification", lastPayload);
    }

    return res.status(201).json(populatedLeave);
  } catch (error) {
    console.error("Error creating leave:", error);
    return res.status(400).json({ message: "Error creating leave", error });
  }
};

/**
 * Update leave status (Approve / Reject)
 */
const updateLeaveStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const leave = await Leave.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    ).populate("employee", "name email");

    if (!leave) {
      return res.status(404).json({ message: "Leave not found" });
    }

    const message = `Your leave request from ${new Date(
      leave.from
    ).toLocaleDateString()} to ${new Date(
      leave.to
    ).toLocaleDateString()} has been ${status.toLowerCase()}`;

    // Notify employee
    await createNotification(
      leave.employee._id,
      "Employee",
      "leave",
      message,
      leave._id,
      "Leave"
    );

    if (req.io) {
      req.io.to(`employee_${leave.employee._id}`).emit("newNotification", {
        type: "leave",
        message,
        relatedId: leave._id,
        createdAt: new Date(),
      });
    }

    return res.status(200).json(leave);
  } catch (error) {
    console.error("Error updating leave status:", error);
    return res.status(400).json({ message: "Error updating leave", error });
  }
};

/**
 * Delete a leave request
 */
const deleteLeave = async (req, res) => {
  try {
    const { id } = req.params;
    const leave = await Leave.findByIdAndDelete(id);

    if (!leave) {
      return res.status(404).json({ message: "Leave not found" });
    }

    return res.status(200).json({ message: "Leave deleted successfully" });
  } catch (error) {
    console.error("Error deleting leave:", error);
    return res.status(400).json({ message: "Error deleting leave", error });
  }
};

module.exports = {
  getAllLeaves,
  createLeave,
  updateLeaveStatus,
  deleteLeave,
};
