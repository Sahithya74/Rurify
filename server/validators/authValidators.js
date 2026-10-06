const { body } = require('express-validator');

const registerValidator = [
  body('email').isEmail().withMessage('A valid email is required').normalizeEmail(),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('phone').optional().trim(),
  body('role').isIn(['retailer', 'vendor']).withMessage('Role must be retailer or vendor'),
  body('shopName').if(body('role').equals('retailer')).trim().notEmpty().withMessage('Shop name is required'),
  body('businessName').if(body('role').equals('vendor')).trim().notEmpty().withMessage('Business name is required'),
  body('address').trim().notEmpty().withMessage('Address is required'),
  body('lat').isFloat({ min: -90, max: 90 }).withMessage('A valid latitude is required'),
  body('lng').isFloat({ min: -180, max: 180 }).withMessage('A valid longitude is required'),
  body('regionId').isInt().withMessage('A region is required'),
];

const loginValidator = [
  body('email').isEmail().withMessage('A valid email is required').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required'),
];

module.exports = { registerValidator, loginValidator };
