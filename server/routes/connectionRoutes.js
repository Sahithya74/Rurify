const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { listMyConnections, connectToVendor } = require('../controllers/connectionController');
const validate = require('../middleware/validate');
const { authenticate, authorize } = require('../middleware/auth');

router.get('/', authenticate, listMyConnections);
router.post(
  '/',
  authenticate,
  authorize('retailer'),
  body('vendorId').isInt().withMessage('vendorId is required'),
  validate,
  connectToVendor
);

module.exports = router;
