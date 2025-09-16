// var express = require('express');
// var router = express.Router();

// const authController = require('../controllers/authController');
// const adminController = require('../controllers/adminController');
// const departmentController = require('../controllers/departmentController');
// const { list, checkIn, checkOut, upsert } = require('../controllers/attendanceController');
// const { createProject, getProjects, getProjectById, updateProject, deleteProject, updateProjectStatus, updateProjectProgress } = require('../controllers/projectController');
// const { getPayrolls, getPayrollById, createPayroll, updatePayroll, deletePayroll, bulkCreatePayrolls, processPayment, getPayrollStats, getEmployeePayrollHistory } = require('../controllers/payrollController');
// const { getNotifications, markAsRead } = require('../controllers/notificationController');
// const settingsController = require('../controllers/settingsController');

// const { protectAdmin, protectEmployee, protectAny } = require('../middleware/authMiddleware');

// // Debug import
// console.log('notificationController:', { getNotifications, markAsRead });
// console.log('authMiddleware:', { protectAdmin, protectEmployee });

// /* GET home page. */
// router.get('/', function(req, res, next) {
//   res.render('index', { title: 'Employee Management System - Admin' });
// });

// // Admin register and login
// router.post('/admin/register', authController.adminRegister);
// router.post('/admin/login', authController.adminLogin);

// // Departments routes
// router.get('/admin/departments', protectAdmin, departmentController.getDepartments);
// router.post('/admin/departments', protectAdmin, departmentController.createDepartment);
// router.put('/admin/departments/:id', protectAdmin, departmentController.updateDepartment);
// router.delete('/admin/departments/:id', protectAdmin, departmentController.deleteDepartment);

// // Employees routes
// router.get('/admin/employees', protectAdmin, adminController.getEmployees);
// router.post('/admin/employees', protectAdmin, adminController.createEmployee);
// router.put('/admin/employees/:id', protectAdmin, adminController.updateEmployee);
// router.delete('/admin/employees/:id', protectAdmin, adminController.deleteEmployee);

// // Attendance routes (Admin)
// router.get('/admin/attendance', protectAdmin, list);
// router.post('/admin/attendance/checkin', protectAdmin, checkIn);
// router.post('/admin/attendance/checkout', protectAdmin, checkOut);
// router.post('/admin/attendance/upsert', protectAdmin, upsert);

// // Projects routes (Admin)
// router.get('/admin/projects', protectAdmin, getProjects);
// router.post('/admin/projects', protectAdmin, createProject);
// router.get('/admin/projects/:id', protectAdmin, getProjectById);
// router.put('/admin/projects/:id', protectAdmin, updateProject);
// router.delete('/admin/projects/:id', protectAdmin, deleteProject);
// router.patch('/admin/projects/:id/status', protectAdmin, updateProjectStatus);
// router.patch('/admin/projects/:id/progress', protectAdmin, updateProjectProgress);

// // Payroll routes
// router.get('/admin/payrolls', protectAdmin, getPayrolls);
// router.get('/admin/payrolls/:id', protectAdmin, getPayrollById);
// router.post('/admin/payrolls', protectAdmin, createPayroll);
// router.put('/admin/payrolls/:id', protectAdmin, updatePayroll);
// router.delete('/admin/payrolls/:id', protectAdmin, deletePayroll);
// router.post('/admin/payrolls/bulk', protectAdmin, bulkCreatePayrolls);
// router.patch('/admin/payrolls/:id/payment', protectAdmin, processPayment);
// router.get('/admin/payroll-stats', protectAdmin, getPayrollStats);
// router.get('/admin/payrolls/employee/:employeeId', protectAdmin, getEmployeePayrollHistory);

// // Leave routes
// router.use('/admin/leaves', require('./leaves'));

// // Notification routes
// router.get('/admin/notifications', protectAdmin, getNotifications);
// router.get('/employee/notifications', protectEmployee, getNotifications);
// router.patch('/notifications/:id/read', protectAny, markAsRead);

// // Get settings
// router.get('/admin/settings', protectAdmin, settingsController.getSettings);
// // Update settings
// router.put('/admin/settings', protectAdmin, settingsController.updateSettings);

// module.exports = router;


// ----------------------------------------------------------------------------------------------------------------------

const express = require('express');
const router = express.Router();

const authController = require('../controllers/authController');
const adminController = require('../controllers/adminController');
const departmentController = require('../controllers/departmentController');
const { list, checkIn, checkOut, upsert } = require('../controllers/attendanceController');
const { 
  createProject, 
  getProjects, 
  getProjectById, 
  updateProject, 
  deleteProject, 
  updateProjectStatus, 
  updateProjectProgress 
} = require('../controllers/projectController');
const { 
  getNotifications, 
  markAsRead, 
  deleteNotification 
} = require('../controllers/notificationController');
const settingsController = require('../controllers/settingsController');

const { protectAdmin, protectEmployee, protectAny } = require('../middleware/authMiddleware');

/* GET home page - Render admin dashboard */
router.get('/', (req, res) => {
  res.render('index', { title: 'Employee Management System - Admin' });
});

/* Admin Authentication Routes */
router.post('/admin/register', authController.adminRegister);
router.post('/admin/login', authController.adminLogin);

/* Departments Management Routes */
router.get('/admin/departments', protectAdmin, departmentController.getDepartments);
router.post('/admin/departments', protectAdmin, departmentController.createDepartment);
router.put('/admin/departments/:id', protectAdmin, departmentController.updateDepartment);
router.delete('/admin/departments/:id', protectAdmin, departmentController.deleteDepartment);

/* Employees Management Routes */
router.get('/admin/employees', protectAdmin, adminController.getEmployees);
router.post('/admin/employees', protectAdmin, adminController.createEmployee);
router.put('/admin/employees/:id', protectAdmin, adminController.updateEmployee);
router.delete('/admin/employees/:id', protectAdmin, adminController.deleteEmployee);

/* Attendance Management Routes */
router.get('/admin/attendance', protectAdmin, list);
router.post('/admin/attendance/checkin', protectAdmin, checkIn);
router.post('/admin/attendance/checkout', protectAdmin, checkOut);
router.post('/admin/attendance/upsert', protectAdmin, upsert);

/* Projects Management Routes */
router.get('/admin/projects', protectAdmin, getProjects);
router.post('/admin/projects', protectAdmin, createProject);
router.get('/admin/projects/:id', protectAdmin, getProjectById);
router.put('/admin/projects/:id', protectAdmin, updateProject);
router.delete('/admin/projects/:id', protectAdmin, deleteProject);
router.patch('/admin/projects/:id/status', protectAdmin, updateProjectStatus);
router.patch('/admin/projects/:id/progress', protectAdmin, updateProjectProgress);

/* Payroll Management Routes */
router.use('/admin/payrolls', require('./payroll'));

/* Leave Management Routes */
router.use('/admin/leaves', require('./leaves'));

/* Notification Routes */
router.get('/admin/notifications', protectAdmin, getNotifications);
router.get('/employee/notifications', protectEmployee, getNotifications);
router.patch('/notifications/:id/read', protectAny, markAsRead);
router.delete('/notifications/:id', protectAny, deleteNotification);

/* Settings Management Routes */
router.get('/admin/settings', protectAdmin, settingsController.getSettings);
router.put('/admin/settings', protectAdmin, settingsController.updateSettings);

/* Global Error Handling Middleware */
router.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ status: 'error', message: 'Something went wrong on the server!' });
});

module.exports = router;