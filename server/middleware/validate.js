const { validationResult } = require('express-validator');
const ApiError = require('../utils/ApiError');

module.exports = function validate(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(
      new ApiError(
        400,
        'Invalid input',
        errors.array().map((e) => ({ field: e.path, message: e.msg }))
      )
    );
  }
  next();
};
