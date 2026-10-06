const { AuditLog } = require('../models');

async function logAction(userId, action, entityType = null, entityId = null, details = null) {
  await AuditLog.create({
    userId,
    action,
    entityType,
    entityId,
    details: details ? JSON.stringify(details) : null,
  });
}

module.exports = { logAction };
