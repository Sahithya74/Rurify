const { body, param } = require('express-validator');

const createOrderValidator = [
  body('inventoryId').isInt().withMessage('inventoryId is required'),
  body('quantity').isFloat({ gt: 0 }).withMessage('quantity must be greater than 0'),
];

const updateStatusValidator = [
  param('id').isInt(),
  body('status')
    .isIn([
      'PENDING',
      'ACCEPTED',
      'REJECTED',
      'PROCESSING',
      'READY',
      'OUT_FOR_DELIVERY',
      'COMPLETED',
      'CANCELLED',
    ])
    .withMessage('Invalid status'),
];

module.exports = { createOrderValidator, updateStatusValidator };
