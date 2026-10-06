const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const admin = require('../controllers/adminController');
const validate = require('../middleware/validate');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate, authorize('admin'));

router.get('/users', admin.listUsers);
router.put('/users/:id/status', body('isActive').isBoolean(), validate, admin.setUserActive);

router.get('/vendors', admin.listVendors);
router.put('/vendors/:id/verify', admin.verifyVendor);
router.get('/vendors/:id/performance', admin.vendorPerformance);
router.get('/vendors/:id/products', admin.vendorProducts);

router.get('/retailers', admin.listRetailers);
router.put('/retailers/:id/verify', admin.verifyRetailer);
router.get('/retailers/:id/activity', admin.retailerActivity);

router.get('/categories', admin.listCategories);
router.post('/categories', body('name').trim().notEmpty(), validate, admin.createCategory);
router.get('/products', admin.listAllProducts);

router.get('/orders', admin.listAllOrders);
router.get('/requirements', admin.listAllRequirements);
router.get('/analytics/demand', admin.demandAnalytics);
router.get('/audit-logs', admin.listAuditLogs);

module.exports = router;
