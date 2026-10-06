const express = require('express');
const router = express.Router();
const {
  createRequirement,
  listRequirements,
  getRequirement,
  respondToRequirement,
  getAggregateForProduct,
} = require('../controllers/requirementController');
const { createRequirementValidator, respondValidator } = require('../validators/requirementValidators');
const validate = require('../middleware/validate');
const { authenticate, authorize } = require('../middleware/auth');

router.get('/aggregate/:productId', authenticate, getAggregateForProduct);
router.post('/', authenticate, authorize('retailer'), createRequirementValidator, validate, createRequirement);
router.get('/', authenticate, authorize('retailer', 'vendor'), listRequirements);
router.get('/:id', authenticate, getRequirement);
router.put(
  '/:id/respond',
  authenticate,
  authorize('vendor'),
  respondValidator,
  validate,
  respondToRequirement
);

module.exports = router;
