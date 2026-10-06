const { body, param } = require('express-validator');

const createRequirementValidator = [
  body('productId').isInt().withMessage('productId is required'),
  body('requiredQty').isFloat({ gt: 0 }).withMessage('requiredQty must be greater than 0'),
  body('requiredDate').optional({ values: 'falsy' }).isDate(),
  body('preferredPrice').optional({ values: 'falsy' }).isFloat({ gt: 0 }),
  body('notes').optional().trim(),
];

const respondValidator = [
  param('id').isInt(),
  body('response').isIn(['AVAILABLE', 'CAN_STOCK', 'NOT_AVAILABLE']).withMessage('Invalid response'),
  body('notes').optional().trim(),
];

module.exports = { createRequirementValidator, respondValidator };
