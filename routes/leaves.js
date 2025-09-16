const express = require('express');
const router = express.Router();
const leaveController = require('../controllers/leaveController.js');

router.get('/', leaveController.getAllLeaves);
router.post('/', leaveController.createLeave);
router.put('/:id/status', leaveController.updateLeaveStatus);
router.delete('/:id', leaveController.deleteLeave);

module.exports = router;