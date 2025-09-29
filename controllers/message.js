// controllers/message.js
const express = require('express');
const Message = require('../models/Message');
const Chat = require('../models/Chat');
const { createNotification } = require('./notificationController');

const router = express.Router();

router.post('/', async (req, res) => {
  try {
    const { chatId, sender, message, receiver } = req.body;

    if (!chatId || !sender || !message || !receiver) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    const newMessage = await Message.create({ chatId, sender, message, receiver });
    await Chat.findByIdAndUpdate(chatId, { latestMessage: newMessage._id });

    const chat = await Chat.findById(chatId);
    let recipientId, recipientModel;

    if (sender === 'admin') {
      recipientId = chat.employeeId;
      recipientModel = 'Employee';
    } else {
      recipientId = 'admin';
      recipientModel = 'Admin';
    }

    const notification = await createNotification(
      recipientId,
      recipientModel,
      'message',
      `${sender} sent you a new message: ${message.substring(0, 50)}${message.length > 50 ? '...' : ''}`,
      newMessage._id,
      'Message'
    );

    res.status(201).json(newMessage);
  } catch (err) {
    console.error('Message create error:', err.message);
    res.status(500).json({ error: 'Server error while creating message' });
  }
});

router.get('/:chatId', async (req, res) => {
  try {
    const messages = await Message.find({ chatId: req.params.chatId })
      .sort({ createdAt: 1 });
    res.status(200).json(messages);
  } catch (err) {
    console.error('Message fetch error:', err.message);
    res.status(500).json({ error: 'Server error while fetching messages' });
  }
});

router.delete('/:chatId', async (req, res) => {
  try {
    const { chatId } = req.params;
    const result = await Message.deleteMany({ chatId });
    res.status(200).json({
      success: true,
      message: 'All messages deleted successfully',
    });
  } catch (err) {
    console.error('Message delete error:', err.message);
    res.status(500).json({ success: false, error: 'Server error while deleting messages' });
  }
});

module.exports = router;