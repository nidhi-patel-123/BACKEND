const Project = require('../models/Project');
const Employee = require('../models/Employee');
const Task = require('../models/Task');
const { createNotification } = require('./notificationController');

const createProject = async (req, res) => {
  try {
    const {
      name,
      startDate,
      deadline,
      team,
      progress,
      status,
      description,
      priority,
    } = req.body;

    if (!name || !startDate || !deadline || !team || team.length === 0) {
      return res.status(400).json({ message: 'Name, start date, deadline, and team are required' });
    }

    if (new Date(startDate) >= new Date(deadline)) {
      return res.status(400).json({ message: 'Deadline must be after start date' });
    }

    const teamMembers = await Employee.find({ _id: { $in: team } });
    if (teamMembers.length !== team.length) {
      return res.status(400).json({ message: 'Some team members not found' });
    }

    const project = new Project({
      name,
      startDate,
      deadline,
      team,
      progress: progress || 0,
      status: status || 'Not Started',
      description,
      priority: priority || 'Medium',
    });

    await project.save();

    for (const memberId of team) {
      await createNotification(
        memberId,
        'Employee',
        'project',
        `You have been assigned to the project: ${name}`,
        project._id,
        'Project'
      );
      req.io.to(`employee_${memberId}`).emit('newNotification', {
        type: 'project',
        message: `You have been assigned to the project: ${name}`,
        relatedId: project._id,
        createdAt: new Date(),
      });
    }

    await project.populate('team', 'name email department');

    res.status(201).json({
      message: 'Project created successfully',
      project,
    });
  } catch (error) {
    console.error('Create project error:', error);
    res.status(500).json({ message: 'Server error while creating project' });
  }
};

const updateProject = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    if (updateData.startDate && updateData.deadline) {
      if (new Date(updateData.startDate) >= new Date(updateData.deadline)) {
        return res.status(400).json({ message: 'Deadline must be after start date' });
      }
    }

    if (updateData.team && updateData.team.length > 0) {
      const teamMembers = await Employee.find({ _id: { $in: updateData.team } });
      if (teamMembers.length !== updateData.team.length) {
        return res.status(400).json({ message: 'Some team members not found' });
      }
    }

    const project = await Project.findById(id);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    if (updateData.team) {
      const newMembers = updateData.team.filter(memberId => !project.team.includes(memberId));
      for (const memberId of newMembers) {
        await createNotification(
          memberId,
          'Employee',
          'project',
          `You have been added to the project: ${project.name}`,
          project._id,
          'Project'
        );
        req.io.to(`employee_${memberId}`).emit('newNotification', {
          type: 'project',
          message: `You have been added to the project: ${project.name}`,
          relatedId: project._id,
          createdAt: new Date(),
        });
      }
    }

    const updatedProject = await Project.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).populate('team', 'name email department');

    res.json({
      message: 'Project updated successfully',
      project: updatedProject,
    });
  } catch (error) {
    console.error('Update project error:', error);
    res.status(500).json({ message: 'Server error while updating project' });
  }
};

const getProjects = async (req, res) => {
  try {
    const { status, page = 1, limit = 20, search } = req.query;

    const query = {};
    if (status && status !== 'All Projects') {
      query.status = status;
    }
    if (search) {
      query.name = { $regex: search, $options: 'i' };
    }

    const skip = (Number(page) - 1) * Number(limit);
    const [projects, total] = await Promise.all([
      Project.find(query)
        .populate('team', 'name email department')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Project.countDocuments(query),
    ]);

    res.json({
      projects,
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / Number(limit)),
    });
  } catch (error) {
    console.error('Get projects error:', error);
    res.status(500).json({ message: 'Server error while fetching projects' });
  }
};

const getProjectById = async (req, res) => {
  try {
    const { id } = req.params;
    const project = await Project.findById(id).populate('team', 'name email department role');

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    res.json(project);
  } catch (error) {
    console.error('Get project error:', error);
    res.status(500).json({ message: 'Server error while fetching project' });
  }
};

const deleteProject = async (req, res) => {
  try {
    const { id } = req.params;
    const project = await Project.findByIdAndDelete(id);

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    await Task.deleteMany({ projectId: id });

    res.json({ message: 'Project deleted successfully' });
  } catch (error) {
    console.error('Delete project error:', error);
    res.status(500).json({ message: 'Server error while deleting project' });
  }
};

const updateProjectStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ message: 'Status is required' });
    }

    const project = await Project.findByIdAndUpdate(
      id,
      { status },
      { new: true, runValidators: true }
    ).populate('team', 'name email department');

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    res.json({
      message: 'Project status updated successfully',
      project,
    });
  } catch (error) {
    console.error('Update project status error:', error);
    res.status(500).json({ message: 'Server error while updating project status' });
  }
};

const updateProjectProgress = async (req, res) => {
  try {
    const { id } = req.params;
    const { progress } = req.body;

    if (progress === undefined || progress < 0 || progress > 100) {
      return res.status(400).json({ message: 'Progress must be between 0 and 100' });
    }

    const project = await Project.findByIdAndUpdate(
      id,
      { progress },
      { new: true, runValidators: true }
    ).populate('team', 'name email department');

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    res.json({
      message: 'Project progress updated successfully',
      project,
    });
  } catch (error) {
    console.error('Update project progress error:', error);
    res.status(500).json({ message: 'Server error while updating project progress' });
  }
};

const getTasks = async (req, res) => {
  try {
    const { projectId } = req.params;
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }
    const tasks = await Task.find({ projectId }).populate('employeeId', 'name email');
    res.json({ tasks });
  } catch (error) {
    console.error('Get tasks error:', error);
    res.status(500).json({ message: 'Server error while fetching tasks' });
  }
};

const createTask = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { employeeId, description } = req.body;

    if (!employeeId || !description) {
      return res.status(400).json({ message: 'Employee ID and description are required' });
    }

    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    if (!project.team.includes(employeeId)) {
      return res.status(400).json({ message: 'Employee not part of project team' });
    }

    const task = new Task({
      projectId,
      employeeId,
      description,
      status: 'Not Started',
    });

    await task.save();

    await createNotification(
      employeeId,
      'Employee',
      'task',
      `New task assigned in project: ${project.name}`,
      task._id,
      'Task'
    );
    req.io.to(`employee_${employeeId}`).emit('newNotification', {
      type: 'task',
      message: `New task assigned in project: ${project.name}`,
      relatedId: task._id,
      createdAt: new Date(),
    });

    await task.populate('employeeId', 'name email');

    res.status(201).json({
      message: 'Task created successfully',
      task,
    });
  } catch (error) {
    console.error('Create task error:', error);
    res.status(500).json({ message: 'Server error while creating task' });
  }
};

const getEmployeeTasks = async (req, res) => {
  try {
    const { projectId } = req.params;
    const employeeId = req.user._id; // Assuming protectEmployee middleware sets req.user
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }
    if (!project.team.includes(employeeId)) {
      return res.status(403).json({ message: 'You are not assigned to this project' });
    }
    const tasks = await Task.find({ projectId, employeeId }).populate('employeeId', 'name email');
    res.json({ tasks });
  } catch (error) {
    console.error('Get employee tasks error:', error);
    res.status(500).json({ message: 'Server error while fetching tasks' });
  }
};

const updateTaskStatus = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { status } = req.body;
    const employeeId = req.user._id;

    if (!status) {
      return res.status(400).json({ message: 'Status is required' });
    }

    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    if (task.employeeId.toString() !== employeeId.toString()) {
      return res.status(403).json({ message: 'You are not authorized to update this task' });
    }

    const updatedTask = await Task.findByIdAndUpdate(
      taskId,
      { status },
      { new: true, runValidators: true }
    ).populate('employeeId', 'name email');

    await createNotification(
      employeeId,
      'Employee',
      'task',
      `Task status updated to ${status} in project`,
      task.projectId,
      'Project'
    );
    req.io.to(`employee_${employeeId}`).emit('newNotification', {
      type: 'task',
      message: `Task status updated to ${status} in project`,
      relatedId: task.projectId,
      createdAt: new Date(),
    });

    res.json({
      message: 'Task status updated successfully',
      task: updatedTask,
    });
  } catch (error) {
    console.error('Update task status error:', error);
    res.status(500).json({ message: 'Server error while updating task status' });
  }
};

module.exports = {
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
};