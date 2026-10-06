const { body, param } = require('express-validator');

const createInventoryValidator = [
  body('productName').trim().notEmpty().withMessage('Product name is required'),
  body('categoryId').isInt().withMessage('Category is required'),
  body('variety').optional().trim(),
  body('description').optional().trim(),
  body('imageUrl').optional({ values: 'falsy' }).trim().isURL().withMessage('Image must be a valid URL'),
  body('unit').trim().notEmpty().withMessage('Unit is required'),
  body('quantity').isFloat({ min: 0 }).withMessage('Quantity must be a non-negative number'),
  body('price').isFloat({ gt: 0 }).withMessage('Price must be greater than 0'),
  body('moq').isFloat({ gt: 0 }).withMessage('MOQ must be greater than 0'),
  body('freshness').isIn(['FRESH', 'GOOD', 'AVERAGE']).withMessage('Invalid freshness value'),
  body('expiryDate').optional({ values: 'falsy' }).isDate().withMessage('Invalid expiry date'),
  body('deliveryAvailable').optional().isBoolean(),
];

const updateInventoryValidator = [
  param('id').isInt().withMessage('Invalid id'),
  body('quantity').optional().isFloat({ min: 0 }),
  body('price').optional().isFloat({ gt: 0 }),
  body('moq').optional().isFloat({ gt: 0 }),
  body('freshness').optional().isIn(['FRESH', 'GOOD', 'AVERAGE']),
  body('expiryDate').optional({ values: 'falsy' }).isDate(),
  body('deliveryAvailable').optional().isBoolean(),
  body('isActive').optional().isBoolean(),
];

module.exports = { createInventoryValidator, updateInventoryValidator };
