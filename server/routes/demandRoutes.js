const express = require('express');
const router = express.Router();
const { topProducts, demandForProduct, regionalDemand } = require('../controllers/demandController');
const { authenticate } = require('../middleware/auth');

router.get('/top-products', authenticate, topProducts);
router.get('/regional', authenticate, regionalDemand);
router.get('/product/:id', authenticate, demandForProduct);

module.exports = router;
