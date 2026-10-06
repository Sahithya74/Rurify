const express = require('express');
const router = express.Router();
const {
  listNotifications,
  unreadCount,
  markRead,
  markAllRead,
} = require('../controllers/notificationController');
const { authenticate } = require('../middleware/auth');

router.get('/', authenticate, listNotifications);
router.get('/unread-count', authenticate, unreadCount);
router.put('/:id/read', authenticate, markRead);
router.put('/read-all', authenticate, markAllRead);

module.exports = router;
