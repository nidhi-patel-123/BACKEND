// controllers/notificationController.js
const Notification = require('../models/Notification');

const getNotifications = async (req, res) => {
  try {
    let recipientId =
      (req.user && req.user._id) ||
      (req.employee && req.employee._id) ||
      (req.admin && req.admin._id) ||
      req.headers['x-user-id'] ||
      req.query.userId;

    if (!recipientId) {
      return res.status(400).json({ message: 'User not authenticated' });
    }

    const notifications = await Notification.find({ recipient: recipientId })
      .sort({ createdAt: -1 })
      .limit(50);

    res.status(200).json({
      status: 'success',
      data: notifications,
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({ message: 'Server error while fetching notifications' });
  }
};

const markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const notification = await Notification.findByIdAndUpdate(
      id,
      { read: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    res.status(200).json({
      status: 'success',
      data: notification,
    });
  } catch (error) {
    console.error('Mark notification read error:', error);
    res.status(500).json({ message: 'Server error while updating notification' });
  }
};

const deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;
    let recipientId =
      (req.user && req.user._id) ||
      (req.employee && req.employee._id) ||
      (req.admin && req.admin._id) ||
      req.headers['x-user-id'];

    if (!recipientId) {
      return res.status(400).json({ message: 'User not authenticated' });
    }

    const notification = await Notification.findOneAndDelete({
      _id: id,
      recipient: recipientId,
    });

    if (!notification) {
      return res.status(404).json({
        status: 'error',
        message: 'Notification not found or you are not authorized to delete it',
      });
    }

    const io = req.app.get('io');
    if (io) {
      io.to(`${notification.recipientModel}_${recipientId}`).emit('notificationDeleted', { id });
    }

    res.status(200).json({
      status: 'success',
      message: 'Notification deleted successfully',
    });
  } catch (error) {
    console.error('Delete notification error:', error);
    res.status(500).json({ message: 'Server error while deleting notification' });
  }
};

const createNotification = async (recipientId, recipientModel, type, message, relatedId, relatedModel) => {
  try {
    const notification = new Notification({
      recipient: recipientId,
      recipientModel,
      type,
      message,
      relatedId,
      relatedModel,
    });
    await notification.save();

    const io = require('http').createServer()._io || require('../app').app.get('io');
    if (io) {
      const room = recipientModel === 'Admin' ? 'admins' : `${recipientModel}_${recipientId}`;
      io.to(room).emit('newNotification', notification);
      console.log(`Emitted notification to ${room}:`, notification);
    }

    return notification;
  } catch (error) {
    console.error('Create notification error:', error);
    return null;
  }
};

module.exports = {
  getNotifications,
  markAsRead,
  deleteNotification,
  createNotification,
};