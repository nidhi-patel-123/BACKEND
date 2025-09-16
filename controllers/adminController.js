const Department = require('../models/Department');
const Employee = require('../models/Employee');
const bcrypt = require('bcryptjs');

exports.createEmployee = async (req, res) => {
  const {
    name,
    role,
    department,
    mobile,
    joiningDate,
    email,
    gender,
    status,
    password,
    address,
    basicSalary,
  } = req.body;

  if (!name || !role || !department || !mobile || !joiningDate || !email || !gender || !status || !password || !address || !basicSalary) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  try {
    const existingEmployee = await Employee.findOne({ email });
    if (existingEmployee) {
      return res.status(400).json({ message: 'Employee with this email already exists' });
    }

    // Verify department exists
    const dept = await Department.findById(department);
    if (!dept) {
      return res.status(400).json({ message: 'Invalid department' });
    }

    const employee = new Employee({
      name,
      role,
      department,
      mobile,
      joiningDate,
      email,
      gender,
      status,
      password, // Will be hashed in pre-save hook
      address,
      basicSalary: parseFloat(basicSalary),
    });

    await employee.save();
    res.status(201).json({
      message: 'Employee created successfully',
      employee: {
        id: employee._id,
        name: employee.name,
        email: employee.email,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error while creating employee' });
  }
};

exports.getEmployees = async (req, res) => {
  try {
    const employees = await Employee.find({})
      .populate('department', 'name')
      .select('-password');
    res.status(200).json(employees);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error while fetching employees' });
  }
};

exports.updateEmployee = async (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  if (updates.password) {
    updates.password = await bcrypt.hash(updates.password, 12);
  }

  try {
    if (updates.department) {
      const dept = await Department.findById(updates.department);
      if (!dept) {
        return res.status(400).json({ message: 'Invalid department' });
      }
    }

    const existingEmployee = await Employee.findOne({ email: updates.email, _id: { $ne: id } });
    if (existingEmployee) {
      return res.status(400).json({ message: 'Employee with this email already exists' });
    }

    const employee = await Employee.findByIdAndUpdate(id, updates, { new: true })
      .populate('department', 'name')
      .select('-password');
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    res.status(200).json({
      message: 'Employee updated successfully',
      employee,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error while updating employee' });
  }
};

exports.deleteEmployee = async (req, res) => {
  const { id } = req.params;

  try {
    const employee = await Employee.findByIdAndDelete(id);
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    res.status(200).json({ message: 'Employee deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error while deleting employee' });
  }
};