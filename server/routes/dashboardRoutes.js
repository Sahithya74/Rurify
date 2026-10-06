const express = require('express');
const router = express.Router();
const { retailerDashboard, vendorDashboard } = require('../controllers/dashboardController');
const { authenticate, authorize } = require('../middleware/auth');

router.get('/retailer', authenticate, authorize('retailer'), retailerDashboard);
router.get('/vendor', authenticate, authorize('vendor'), vendorDashboard);

module.exports = router;
