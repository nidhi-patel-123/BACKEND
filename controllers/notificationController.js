
const Notification = require('../models/Notification');

// 🔹 Get Notifications
const getNotifications = async (req, res) => {
  try {
    // Support both employee and admin auth middlewares
    let recipientId =
      (req.user && req.user._id) ||
      (req.employee && req.employee._id) ||
      (req.admin && req.admin._id);

    // Fallback: allow explicit user id header or query
    if (!recipientId) {
      recipientId = req.headers['x-user-id'] || req.query.userId;
    }

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

// 🔹 Mark Notification as Read
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

// 🔹 Delete Notification
const deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;

    // Support both employee and admin auth middlewares
    let recipientId =
      (req.user && req.user._id) ||
      (req.employee && req.employee._id) ||
      (req.admin && req.admin._id);

    // Fallback: allow explicit user id header
    if (!recipientId) {
      recipientId = req.headers['x-user-id'];
    }

    if (!recipientId) {
      return res.status(400).json({ message: 'User not authenticated' });
    }

    // Find and delete the notification, ensuring it belongs to the authenticated user
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

    // Emit Socket.IO event for deletion
    const io = req.app.get('io');
    if (io) {
      io.to(recipientId.toString()).emit('notificationDeleted', { id });
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

// 🔹 Create Notification (utility function)
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