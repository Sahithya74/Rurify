const env = require('../config/env');
const ApiError = require('../utils/ApiError');

function notFound(req, res, next) {
  next(new ApiError(404, `Route not found: ${req.method} ${req.originalUrl}`));
}

function errorHandler(err, req, res, next) {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal server error';
  let details = err.details || null;

  if (err.name === 'SequelizeUniqueConstraintError') {
    statusCode = 409;
    message = 'A record with these values already exists';
  } else if (err.name === 'SequelizeValidationError') {
    statusCode = 400;
    message = 'Validation failed';
    details = err.errors?.map((e) => e.message);
  }

  if (statusCode >= 500) {
    // eslint-disable-next-line no-console
    console.error(err);
    if (env.nodeEnv === 'production') {
      message = 'Something went wrong. Please try again later.';
      details = null;
    }
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(details ? { details } : {}),
  });
}

module.exports = { notFound, errorHandler };
