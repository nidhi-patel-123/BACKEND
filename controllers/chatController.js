// controllers/chatController.js
const express = require('express');
const Chat = require('../models/Chat');

const router = express.Router();

router.post('/create', async (req, res) => {
  try {
    const { employeeId, employeeName } = req.body;
    console.log('Creating chat for employee:', employeeName);

    if (!employeeId || !employeeName) {
      return res.status(400).json({ error: 'employeeId and employeeName are required' });
    }

    let chat = await Chat.findOne({ employeeId });
    if (!chat) {
      chat = await Chat.create({ employeeId, employeeName });
    }

    res.status(201).json(chat);
  } catch (err) {
    console.error('Chat create error:', err.message);
    res.status(500).json({ error: 'Server error while creating chat' });
  }
});

router.get('/', async (req, res) => {
  try {
    const chats = await Chat.find({})
      .populate('latestMessage')
      .sort({ updatedAt: -1 });
    res.status(200).json(chats);
  } catch (err) {
    console.error('Chat fetch error:', err.message);
    res.status(500).json({ error: 'Server error while fetching chats' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const chat = await Chat.findByIdAndDelete(req.params.id);
    if (!chat) {
      return res.status(404).json({
        message: 'Chat not found',
        status: false,
      });
    }
    res.status(200).json({
      message: 'Chat deleted successfully',
      status: true,
    });
  } catch (err) {
    console.error('Chat delete error:', err.message);
    res.status(500).json({ error: 'Server error while deleting chat' });
  }
});

router.delete('/delete/:name', async (req, res) => {
  try {
    const empName = req.params.name;
    const deletedData = await Chat.deleteMany({ employeeName: empName });

    if (deletedData.deletedCount === 0) {
      return res.status(404).json({
        message: 'No chat data found for this employee',
        status: false,
      });
    }

    res.status(200).json({
      message: 'Chat data deleted successfully',
      status: true,
    });
  } catch (err) {
    console.error('Chat delete by name error:', err.message);
    res.status(500).json({
      message: 'Server error while deleting chat',
      error: err.message,
      status: false,
    });
  }
});

module.exports = router;