const ApiError = require('../utils/ApiError');

const ALLOWED_TRANSITIONS = {
  PENDING: ['ACCEPTED', 'REJECTED', 'CANCELLED'],
  ACCEPTED: ['PROCESSING', 'CANCELLED'],
  PROCESSING: ['READY', 'CANCELLED'],
  READY: ['OUT_FOR_DELIVERY', 'COMPLETED', 'CANCELLED'],
  OUT_FOR_DELIVERY: ['COMPLETED'],
  COMPLETED: [],
  REJECTED: [],
  CANCELLED: [],
};

function assertValidTransition(from, to) {
  if (!ALLOWED_TRANSITIONS[from]?.includes(to)) {
    throw new ApiError(400, `Cannot move an order from ${from} to ${to}`);
  }
}

module.exports = { ALLOWED_TRANSITIONS, assertValidTransition };
