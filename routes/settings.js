const express = require('express');
const router = express.Router();
const Admin = require('../models/Admin');
const bcrypt = require('bcryptjs');
const { protectAdmin } = require('../middleware/authMiddleware');

// Get admin settings
router.get('/', protectAdmin, async (req, res) => {
  try {
    const admin = await Admin.findById(req.admin._id).select('-password');
    if (!admin) return res.status(404).json({ message: 'Admin not found' });
    res.status(200).json(admin);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error while fetching settings' });
  }
});

// Update admin email
router.put('/profile', protectAdmin, async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: 'Email is required' });

  try {
    const existingAdmin = await Admin.findOne({ email, _id: { $ne: req.admin._id } });
    if (existingAdmin) return res.status(400).json({ message: 'Email already in use' });

    const admin = await Admin.findByIdAndUpdate(
      req.admin._id,
      { email },
      { new: true }
    ).select('-password');
    if (!admin) return res.status(404).json({ message: 'Admin not found' });

    res.status(200).json({ message: 'Profile updated successfully', admin });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error while updating profile' });
  }
});

// Update admin password
router.put('/password', protectAdmin, async (req, res) => {
  const { currentPassword, newPassword, confirmPassword } = req.body;
  if (!currentPassword || !newPassword || !confirmPassword) {
    return res.status(400).json({ message: 'All password fields are required' });
  }
  if (newPassword !== confirmPassword) {
    return res.status(400).json({ message: 'New passwords do not match' });
  }
  // if (newPassword.length < 8) {
  //   return res.status(400).json({ message: 'New password must be at least 8 characters' });
  // }

  try {
    const admin = await Admin.findById(req.admin._id);
    if (!admin) return res.status(404).json({ message: 'Admin not found' });

    const isMatch = await admin.comparePassword(currentPassword);
    if (!isMatch) return res.status(401).json({ message: 'Current password is incorrect' });

    admin.password = newPassword;
    await admin.save();
    res.status(200).json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error while updating password' });
  }
});

// Update theme
router.put('/theme', protectAdmin, async (req, res) => {
  const { theme } = req.body;
  if (!['light', 'dark'].includes(theme)) {
    return res.status(400).json({ message: 'Invalid theme' });
  }

  try {
    const admin = await Admin.findByIdAndUpdate(
      req.admin._id,
      { theme },
      { new: true }
    ).select('-password');
    if (!admin) return res.status(404).json({ message: 'Admin not found' });

    res.status(200).json({ message: 'Theme updated successfully', theme: admin.theme });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error while updating theme' });
  }
});

// Update notifications
router.put('/notifications', protectAdmin, async (req, res) => {
  const { notifications } = req.body;
  if (!notifications || typeof notifications.email !== 'boolean') {
    return res.status(400).json({ message: 'Invalid notification settings' });
  }

  try {
    const admin = await Admin.findByIdAndUpdate(
      req.admin._id,
      { notifications },
      { new: true }
    ).select('-password');
    if (!admin) return res.status(404).json({ message: 'Admin not found' });

    res.status(200).json({ message: 'Notifications updated successfully', notifications: admin.notifications });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error while updating notifications' });
  }
});

module.exports = router;