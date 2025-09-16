const express = require('express');
const router = express.Router();
const payrollController = require('../controllers/payrollController');
const { protectAdmin } = require('../middleware/authMiddleware');

// All routes are protected and require admin authentication
router.use(protectAdmin);

// Get all payrolls with pagination and filtering
router.get('/', payrollController.getPayrolls);

// Get payroll statistics
router.get('/stats', payrollController.getPayrollStats);

// Get payroll by ID
router.get('/:id', payrollController.getPayrollById);

// Create new payroll
router.post('/', payrollController.createPayroll);

// Update payroll
router.put('/:id', payrollController.updatePayroll);

// Delete payroll
router.delete('/:id', payrollController.deletePayroll);

// Bulk create payrolls for all employees
router.post('/bulk', payrollController.bulkCreatePayrolls);

// Process payment
router.patch('/:id/payment', payrollController.processPayment);

// Get employee payroll history
router.get('/employee/:employeeId/history', payrollController.getEmployeePayrollHistory);

module.exports = router;
