const Notification = require('../models/Notification');
const { asyncHandler } = require('../middleware/errorHandler');
const ApiResponse = require('../utils/response');

// Get user notifications
exports.getNotifications = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, unreadOnly = false } = req.query;

  const query = { user: req.user._id };
  if (unreadOnly === 'true') {
    query.read = false;
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);
  
  const notifications = await Notification.find(query)
    .populate('triggeredBy', 'name email')
    .sort('-createdAt')
    .skip(skip)
    .limit(parseInt(limit))
    .lean();

  const total = await Notification.countDocuments(query);
  const unreadCount = await Notification.countDocuments({ user: req.user._id, read: false });

  const pagination = {
    page: parseInt(page),
    limit: parseInt(limit),
    total,
    pages: Math.ceil(total / parseInt(limit)),
    unreadCount
  };

  return ApiResponse.paginated(res, notifications, pagination);
});

// Mark notification as read
exports.markAsRead = asyncHandler(async (req, res) => {
  await Notification.findByIdAndUpdate(req.params.id, { read: true });
  return ApiResponse.success(res, null, 'Notification marked as read');
});

// Mark all as read
exports.markAllAsRead = asyncHandler(async (req, res) => {
  await Notification.updateMany(
    { user: req.user._id, read: false },
    { read: true }
  );
  return ApiResponse.success(res, null, 'All notifications marked as read');
});

// Delete notification
exports.deleteNotification = asyncHandler(async (req, res) => {
  await Notification.findByIdAndDelete(req.params.id);
  return ApiResponse.success(res, null, 'Notification deleted');
});