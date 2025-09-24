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
    console.error('Error creating department:', error);
    res.status(500).json({ message: 'Server error while creating department', error: error.message });
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
    console.error('Error fetching departments:', error);
    res.status(500).json({ message: 'Server error while fetching departments', error: error.message });
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
    console.error('Error updating department:', error);
    res.status(500).json({ message: 'Server error while updating department', error: error.message });
  }
};

exports.deleteDepartment = async (req, res) => {
  const { id } = req.params;
  console.log('Attempting to delete department with ID:', id);

  try {
    // Validate ID format
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ message: 'Invalid department ID format' });
    }

    const department = await Department.findById(id);
    if (!department) {
      return res.status(404).json({ message: 'Department not found' });
    }

    const employeeCount = await Employee.countDocuments({ department: id });
    console.log(`Employees assigned to department ${id}:`, employeeCount);
    if (employeeCount > 0) {
      return res.status(400).json({
        message: `Cannot delete department: ${employeeCount} employee(s) are still assigned. Please reassign or remove them first.`,
      });
    }

    await Department.findByIdAndDelete(id);
    res.status(200).json({ message: 'Department deleted successfully' });
  } catch (error) {
    console.error('Error deleting department:', {
      error: error.message,
      stack: error.stack,
    });
    res.status(500).json({ message: 'Server error while deleting department', error: error.message });
  }
};