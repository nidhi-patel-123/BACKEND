// routes/performanceRoutes.js
const express = require('express');
const router = express.Router();
const performanceController = require('../controllers/performanceController');
const { protectAdmin } = require('../middleware/authMiddleware'); // Use same auth as other admin routes

router.use(protectAdmin); // Protect all routes with admin auth
router.get('/', performanceController.getAllPerformances);
router.post('/', performanceController.createPerformance);
router.put('/:id', performanceController.updatePerformance);
router.delete('/:id', performanceController.deletePerformance);

module.exports = router;