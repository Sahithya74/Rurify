const express = require('express');
const router = express.Router();
const {
  listProducts,
  getProduct,
  searchProducts,
  getSuppliersForProduct,
} = require('../controllers/productController');
const { searchValidator, idParamValidator } = require('../validators/productValidators');
const validate = require('../middleware/validate');
const { authenticate } = require('../middleware/auth');

router.get('/search', authenticate, searchValidator, validate, searchProducts);
router.get('/:id/suppliers', authenticate, idParamValidator, validate, getSuppliersForProduct);
router.get('/:id', authenticate, idParamValidator, validate, getProduct);
router.get('/', authenticate, listProducts);

module.exports = router;
