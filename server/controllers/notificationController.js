const { Notification } = require('../models');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');

const listNotifications = asyncHandler(async (req, res) => {
  const notifications = await Notification.findAll({
    where: { userId: req.user.id },
    order: [['createdAt', 'DESC']],
    limit: 50,
  });
  res.json({ success: true, data: notifications });
});

const unreadCount = asyncHandler(async (req, res) => {
  const count = await Notification.count({ where: { userId: req.user.id, isRead: false } });
  res.json({ success: true, data: { count } });
});

const markRead = asyncHandler(async (req, res) => {
  const notification = await Notification.findByPk(req.params.id);
  if (!notification || notification.userId !== req.user.id) {
    throw new ApiError(404, 'Notification not found');
  }
  await notification.update({ isRead: true });
  res.json({ success: true, data: notification });
});

const markAllRead = asyncHandler(async (req, res) => {
  await Notification.update({ isRead: true }, { where: { userId: req.user.id, isRead: false } });
  res.json({ success: true, data: { updated: true } });
});

module.exports = { listNotifications, unreadCount, markRead, markAllRead };
