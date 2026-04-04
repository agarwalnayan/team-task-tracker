const Comment = require('../models/Comment');
const Task = require('../models/Task');
const Notification = require('../models/Notification');
const { AppError, asyncHandler } = require('../middleware/errorHandler');
const ApiResponse = require('../utils/response');

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

  // Create notifications for mentions
  if (comment.mentions.length > 0) {
    const notifications = comment.mentions.map(userId => ({
      user: userId,
      type: 'mention',
      title: 'You were mentioned',
      message: `${req.user.name} mentioned you in a comment`,
      link: `/tasks/${task._id}`,
      relatedTask: task._id,
      triggeredBy: req.user._id
    }));
    await Notification.insertMany(notifications);
  }

  // Emit socket event
  req.app.get('io').emit('comment:created', comment);

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