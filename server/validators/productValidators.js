const { query, param } = require('express-validator');

const searchValidator = [
  query('q').optional().trim(),
  query('categoryId').optional().isInt(),
  query('maxDistance').optional().isFloat({ min: 0 }),
  query('maxPrice').optional().isFloat({ min: 0 }),
  query('deliveryOnly').optional().isBoolean(),
  query('requestedQty').optional().isFloat({ min: 0 }),
];

const idParamValidator = [param('id').isInt().withMessage('Invalid id')];

module.exports = { searchValidator, idParamValidator };
