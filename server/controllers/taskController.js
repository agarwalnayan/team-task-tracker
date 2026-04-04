const Task = require('../models/Task');
const Notification = require('../models/Notification');
const ActivityLog = require('../models/Activity');
const { AppError, asyncHandler } = require('../middleware/errorHandler');
const ApiResponse = require('../utils/response');

// Get all tasks with pagination, filtering, and search
exports.getTasks = asyncHandler(async (req, res, next) => {
  const {
    page = 1,
    limit = 10,
    status,
    priority,
    assignedTo,
    team,
    search,
    sortBy = '-createdAt'
  } = req.query;

  // Build query
  const query = {
    $or: [
      { createdBy: req.user._id },
      { assignedTo: req.user._id }
    ]
  };

  if (status) query.status = status;
  if (priority) query.priority = priority;
  if (assignedTo) query.assignedTo = assignedTo;
  if (team) query.team = team;
  if (search) {
    query.$text = { $search: search };
  }

  // Execute query with pagination
  const skip = (parseInt(page) - 1) * parseInt(limit);
  const tasks = await Task.find(query)
    .populate('assignedTo', 'name email')
    .populate('createdBy', 'name email')
    .populate('team', 'name')
    .sort(sortBy)
    .skip(skip)
    .limit(parseInt(limit))
    .lean();

  const total = await Task.countDocuments(query);

  const pagination = {
    page: parseInt(page),
    limit: parseInt(limit),
    total,
    pages: Math.ceil(total / parseInt(limit))
  };

  return ApiResponse.paginated(res, tasks, pagination, 'Tasks retrieved successfully');
});

// Get single task
exports.getTask = asyncHandler(async (req, res, next) => {
  const task = await Task.findById(req.params.id)
    .populate('assignedTo', 'name email company')
    .populate('createdBy', 'name email')
    .populate('team', 'name company');

  if (!task) {
    return next(new AppError('Task not found', 404));
  }

  return ApiResponse.success(res, task, 'Task retrieved successfully');
});

// Create task
exports.createTask = asyncHandler(async (req, res, next) => {
  const taskData = {
    ...req.body,
    createdBy: req.user._id
  };

  const task = await Task.create(taskData);

  // Create notification if task is assigned
  if (task.assignedTo && task.assignedTo.toString() !== req.user._id.toString()) {
    await Notification.create({
      user: task.assignedTo,
      type: 'task_assigned',
      title: 'New Task Assigned',
      message: `You have been assigned a new task: ${task.title}`,
      link: `/tasks/${task._id}`,
      relatedTask: task._id,
      triggeredBy: req.user._id
    });
  }

  // Log activity
  await ActivityLog.create({
    user: req.user._id,
    action: 'task_created',
    targetType: 'Task',
    targetId: task._id,
    details: { title: task.title },
    ipAddress: req.ip
  });

  const populatedTask = await Task.findById(task._id)
    .populate('assignedTo', 'name email')
    .populate('createdBy', 'name email');

  // Emit socket event for real-time update
  req.app.get('io').emit('task:created', populatedTask);

  return ApiResponse.success(res, populatedTask, 'Task created successfully', 201);
});

// Update task
exports.updateTask = asyncHandler(async (req, res, next) => {
  let task = await Task.findById(req.params.id);

  if (!task) {
    return next(new AppError('Task not found', 404));
  }

  // Check permissions
  if (task.createdBy.toString() !== req.user._id.toString() &&
      task.assignedTo?.toString() !== req.user._id.toString()) {
    return next(new AppError('Not authorized to update this task', 403));
  }

  const oldAssignee = task.assignedTo;
  task = await Task.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  }).populate('assignedTo createdBy team');

  // Create notification if assignee changed
  if (req.body.assignedTo && oldAssignee?.toString() !== req.body.assignedTo) {
    await Notification.create({
      user: req.body.assignedTo,
      type: 'task_assigned',
      title: 'Task Assigned',
      message: `You have been assigned to: ${task.title}`,
      link: `/tasks/${task._id}`,
      relatedTask: task._id,
      triggeredBy: req.user._id
    });
  }

  // Log activity
  await ActivityLog.create({
    user: req.user._id,
    action: 'task_updated',
    targetType: 'Task',
    targetId: task._id,
    details: req.body,
    ipAddress: req.ip
  });

  // Emit socket event
  req.app.get('io').emit('task:updated', task);

  return ApiResponse.success(res, task, 'Task updated successfully');
});

// Delete task
exports.deleteTask = asyncHandler(async (req, res, next) => {
  const task = await Task.findById(req.params.id);

  if (!task) {
    return next(new AppError('Task not found', 404));
  }

  if (task.createdBy.toString() !== req.user._id.toString()) {
    return next(new AppError('Not authorized to delete this task', 403));
  }

  await task.deleteOne();

  // Log activity
  await ActivityLog.create({
    user: req.user._id,
    action: 'task_deleted',
    targetType: 'Task',
    targetId: task._id,
    details: { title: task.title },
    ipAddress: req.ip
  });

  // Emit socket event
  req.app.get('io').emit('task:deleted', { id: req.params.id });

  return ApiResponse.success(res, null, 'Task deleted successfully');
});

// Get task statistics
exports.getTaskStats = asyncHandler(async (req, res, next) => {
  const stats = await Task.aggregate([
    {
      $match: {
        $or: [
          { createdBy: req.user._id },
          { assignedTo: req.user._id }
        ]
      }
    },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    }
  ]);

  const formattedStats = {
    total: stats.reduce((sum, stat) => sum + stat.count, 0),
    byStatus: stats.reduce((obj, stat) => {
      obj[stat._id] = stat.count;
      return obj;
    }, {})
  };

  return ApiResponse.success(res, formattedStats, 'Statistics retrieved successfully');
});