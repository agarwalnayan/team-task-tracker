const Comment = require('../models/Comment');
const Task = require('../models/Task');
const Notification = require('../models/Notification');
const { AppError, asyncHandler } = require('../middleware/errorHandler');
const ApiResponse = require('../utils/response');

// Helper to create notification and emit socket event
const createNotification = async (io, notificationData) => {
  try {
    const notification = await Notification.create(notificationData);
    const populated = await Notification.findById(notification._id)
      .populate('triggeredBy', 'name email');
    // Convert userId to string for socket event name matching
    const userIdStr = notificationData.user.toString();
    io.emit(`notification:${userIdStr}`, populated);
    io.emit('notification:new', populated);
    return notification;
  } catch (error) {
    console.error('Error creating notification:', error.message);
    // Don't throw - notifications shouldn't break main functionality
  }
};

// Get comments for a task
exports.getComments = asyncHandler(async (req, res) => {
  const comments = await Comment.find({ task: req.params.taskId })
    .populate('author', 'name email')
    .populate('mentions', 'name email')
    .sort('-createdAt');

  return ApiResponse.success(res, comments);
});

// Create comment
exports.createComment = asyncHandler(async (req, res, next) => {
  const task = await Task.findById(req.params.taskId);
  
  if (!task) {
    return next(new AppError('Task not found', 404));
  }

  const comment = await Comment.create({
    task: req.params.taskId,
    author: req.user._id,
    content: req.body.content,
    mentions: req.body.mentions || []
  });

  await comment.populate('author', 'name email');

  const io = req.app.get('io');

  // Create notifications for mentions
  if (comment.mentions.length > 0) {
    for (const userId of comment.mentions) {
      await createNotification(io, {
        user: userId,
        type: 'mention',
        title: 'You were mentioned',
        message: `${req.user.name} mentioned you in a comment on "${task.title}"`,
        link: `/tasks/${task._id}`,
        relatedTask: task._id,
        triggeredBy: req.user._id
      });
    }
  }

  // Notify task creator and assignee of new comment (if not the commenter and not already mentioned)
  const notifyUsers = [task.createdBy, task.assignedTo].filter(Boolean).map(id => id.toString());
  const mentionIds = comment.mentions.map(m => m.toString());
  const uniqueUsers = [...new Set(notifyUsers)].filter(id => 
    id !== req.user._id.toString() && !mentionIds.includes(id)
  );

  for (const userId of uniqueUsers) {
    await createNotification(io, {
      user: userId,
      type: 'task_commented',
      title: 'New Comment on Task',
      message: `${req.user.name} commented on "${task.title}"`,
      link: `/tasks/${task._id}`,
      relatedTask: task._id,
      triggeredBy: req.user._id
    });
  }

  // Emit socket event
  io.emit('comment:created', comment);

  return ApiResponse.success(res, comment, 'Comment created successfully', 201);
});

// Update comment
exports.updateComment = asyncHandler(async (req, res, next) => {
  let comment = await Comment.findById(req.params.id);

  if (!comment) {
    return next(new AppError('Comment not found', 404));
  }

  if (comment.author.toString() !== req.user._id.toString()) {
    return next(new AppError('Not authorized', 403));
  }

  comment.content = req.body.content;
  comment.edited = true;
  comment.editedAt = new Date();
  await comment.save();

  await comment.populate('author', 'name email');

  return ApiResponse.success(res, comment, 'Comment updated successfully');
});

// Delete comment
exports.deleteComment = asyncHandler(async (req, res, next) => {
  const comment = await Comment.findById(req.params.id);

  if (!comment) {
    return next(new AppError('Comment not found', 404));
  }

  if (comment.author.toString() !== req.user._id.toString()) {
    return next(new AppError('Not authorized', 403));
  }

  await comment.deleteOne();

  return ApiResponse.success(res, null, 'Comment deleted successfully');
});