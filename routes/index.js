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
  updateProjectProgress,
  getTasks,
  createTask,
  getEmployeeTasks,
  updateTaskStatus,
} = require('../controllers/projectController');
const {
  getNotifications,
  markAsRead,
  deleteNotification,
} = require('../controllers/notificationController');
const settingsController = require('../controllers/settingsController');
const employeeController = require('../controllers/employeeController');
const performanceController = require('../controllers/performanceController');
const { protectAdmin, protectEmployee, protectAny } = require('../middleware/authMiddleware');

router.get('/', (req, res) => {
  res.render('index', { title: 'Employee Management System - Admin' });
});

router.post('/admin/register', authController.adminRegister);
router.post('/admin/login', authController.adminLogin);

router.get('/admin/departments', protectAdmin, departmentController.getDepartments);
router.post('/admin/departments', protectAdmin, departmentController.createDepartment);
router.put('/admin/departments/:id', protectAdmin, departmentController.updateDepartment);
router.delete('/admin/departments/:id', protectAdmin, departmentController.deleteDepartment);

router.get('/admin/employees', protectAdmin, adminController.getEmployees);
router.post('/admin/employees', protectAdmin, adminController.createEmployee);
router.put('/admin/employees/:id', protectAdmin, adminController.updateEmployee);
router.delete('/admin/employees/:id', protectAdmin, adminController.deleteEmployee);
router.get('/admin/employees/:id/details', protectAdmin, employeeController.getEmployeeDetails);

router.get('/admin/performances', protectAdmin, performanceController.getAllPerformances);
router.post('/admin/performances', protectAdmin, performanceController.createPerformance);
router.put('/admin/performances/:id', protectAdmin, performanceController.updatePerformance);
router.delete('/admin/performances/:id', protectAdmin, performanceController.deletePerformance);

router.get('/employee/performance', protectEmployee, employeeController.getEmployeePerformance);
router.get('/employee/attendance', protectEmployee, employeeController.getAttendance);
router.get('/employee/leaves', protectEmployee, employeeController.getLeaves);
router.post('/employee/leaves', protectEmployee, employeeController.applyLeave);
router.get('/employee/projects', protectEmployee, employeeController.getProjects);
router.get('/employee/payrolls', protectEmployee, employeeController.getPayrolls);
router.put('/employee/change-password', protectEmployee, employeeController.changePassword);

router.get('/admin/attendance', protectAdmin, list);
router.post('/admin/attendance/checkin', protectAdmin, checkIn);
router.post('/admin/attendance/checkout', protectAdmin, checkOut);
router.post('/admin/attendance/upsert', protectAdmin, upsert);

router.get('/admin/projects', protectAdmin, getProjects);
router.post('/admin/projects', protectAdmin, createProject);
router.get('/admin/projects/:id', protectAdmin, getProjectById);
router.put('/admin/projects/:id', protectAdmin, updateProject);
router.delete('/admin/projects/:id', protectAdmin, deleteProject);
router.patch('/admin/projects/:id/status', protectAdmin, updateProjectStatus);
router.patch('/admin/projects/:id/progress', protectAdmin, updateProjectProgress);
router.get('/admin/projects/:projectId/tasks', protectAdmin, getTasks);
router.post('/admin/projects/:projectId/tasks', protectAdmin, createTask);

router.get('/employee/projects/:projectId/tasks', protectEmployee, getEmployeeTasks);
router.patch('/employee/tasks/:taskId/status', protectEmployee, updateTaskStatus);

router.use('/admin/payrolls', protectAdmin, require('./payroll'));
router.use('/admin/leaves', protectAdmin, require('./leaves'));

router.get('/admin/notifications', protectAdmin, getNotifications);
router.get('/employee/notifications', protectEmployee, getNotifications);
router.patch('/notifications/:id/read', protectAny, markAsRead);
router.delete('/notifications/:id', protectAny, deleteNotification);

router.get('/admin/settings', protectAdmin, settingsController.getSettings);
router.put('/admin/settings', protectAdmin, settingsController.updateSettings);

router.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ status: 'error', message: 'Something went wrong on the server!' });
});

module.exports = router;