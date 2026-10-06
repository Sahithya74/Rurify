const { Notification } = require('../models');

async function notify(userId, { type, title, message, relatedEntityType = null, relatedEntityId = null }) {
  return Notification.create({
    userId,
    type,
    title,
    message,
    relatedEntityType,
    relatedEntityId,
  });
}

async function notifyMany(userIds, payload) {
  return Promise.all(userIds.map((userId) => notify(userId, payload)));
}

module.exports = { notify, notifyMany };
