const Performance = require('../models/Performance');

exports.getAllPerformances = async (req, res) => {
  try {
    const performances = await Performance.find()
      .populate('employee', 'name role basicSalary')
      .sort({ createdAt: -1 });
    res.status(200).json(performances);
  } catch (error) {
    console.error('Error fetching performances:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.createPerformance = async (req, res) => {
  try {
    const { employeeId, performance, tasksCompleted, achievements, month, year } = req.body;
    if (!employeeId || !performance || !tasksCompleted || !month || !year) {
      return res.status(400).json({ message: 'Missing required fields' });
    }
    const newPerformance = new Performance({
      employee: employeeId,
      performance,
      tasksCompleted,
      achievements,
      month,
      year,
    });
    await newPerformance.save();
    await newPerformance.populate('employee', 'name role basicSalary');
    res.status(201).json(newPerformance);
  } catch (error) {
    console.error('Error creating performance:', error);
    res.status(400).json({ message: 'Invalid data', errors: error.message });
  }
};

exports.updatePerformance = async (req, res) => {
  try {
    const { id } = req.params;
    const { performance, tasksCompleted, achievements, month, year } = req.body;
    const updated = await Performance.findByIdAndUpdate(
      id,
      { performance, tasksCompleted, achievements, month, year },
      { new: true }
    ).populate('employee', 'name role basicSalary');
    if (!updated) return res.status(404).json({ message: 'Performance record not found' });
    res.status(200).json(updated);
  } catch (error) {
    console.error('Error updating performance:', error);
    res.status(400).json({ message: 'Invalid data', errors: error.message });
  }
};

exports.deletePerformance = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Performance.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ message: 'Performance record not found' });
    res.status(200).json({ message: 'Deleted successfully' });
  } catch (error) {
    console.error('Error deleting performance:', error);
    res.status(500).json({ message: 'Server error' });
  }
};