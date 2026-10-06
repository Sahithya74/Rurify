const express = require('express');
const router = express.Router();
const { createOrder, listOrders, getOrder, updateOrderStatus } = require('../controllers/orderController');
const { createOrderValidator, updateStatusValidator } = require('../validators/orderValidators');
const validate = require('../middleware/validate');
const { authenticate, authorize } = require('../middleware/auth');

router.post('/', authenticate, authorize('retailer'), createOrderValidator, validate, createOrder);
router.get('/', authenticate, authorize('retailer', 'vendor'), listOrders);
router.get('/:id', authenticate, getOrder);
router.put(
  '/:id/status',
  authenticate,
  authorize('retailer', 'vendor'),
  updateStatusValidator,
  validate,
  updateOrderStatus
);

module.exports = router;
