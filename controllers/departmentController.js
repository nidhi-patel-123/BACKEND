const Department = require('../models/Department');
const Employee = require('../models/Employee');

exports.createDepartment = async (req, res) => {
  const { name, head } = req.body;

  if (!name || !head) {
    return res.status(400).json({ message: 'Name and head are required' });
  }

  try {
    const existingDept = await Department.findOne({ name });
    if (existingDept) {
      return res.status(400).json({ message: 'Department with this name already exists' });
    }

    const department = new Department({ name, head });
    await department.save();

    res.status(201).json({
      message: 'Department created successfully',
      department,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error while creating department' });
  }
};

exports.getDepartments = async (req, res) => {
  try {
    const departments = await Department.find({});
    const deptsWithCount = await Promise.all(
      departments.map(async (dept) => {
        const employeeCount = await Employee.countDocuments({ department: dept._id });
        return { ...dept.toObject(), employeeCount };
      })
    );
    res.status(200).json(deptsWithCount);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error while fetching departments' });
  }
};

exports.updateDepartment = async (req, res) => {
  const { id } = req.params;
  const { name, head } = req.body;

  if (!name || !head) {
    return res.status(400).json({ message: 'Name and head are required' });
  }

  try {
    const existingDept = await Department.findOne({ name, _id: { $ne: id } });
    if (existingDept) {
      return res.status(400).json({ message: 'Department with this name already exists' });
    }

    const department = await Department.findByIdAndUpdate(id, { name, head }, { new: true });
    if (!department) {
      return res.status(404).json({ message: 'Department not found' });
    }
    res.status(200).json({
      message: 'Department updated successfully',
      department,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error while updating department' });
  }
};

exports.deleteDepartment = async (req, res) => {
  const { id } = req.params;

  try {
    const employeeCount = await Employee.countDocuments({ department: id });
    if (employeeCount > 0) {
      return res.status(400).json({ message: 'Cannot delete department with assigned employees' });
    }

    const department = await Department.findByIdAndDelete(id);
    if (!department) {
      return res.status(404).json({ message: 'Department not found' });
    }

    res.status(200).json({ message: 'Department deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error while deleting department' });
  }
};