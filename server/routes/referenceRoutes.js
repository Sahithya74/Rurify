const express = require('express');
const router = express.Router();
const { listRegions, listCategories } = require('../controllers/referenceController');
const { authenticate } = require('../middleware/auth');

router.get('/regions', authenticate, listRegions);
router.get('/categories', authenticate, listCategories);

module.exports = router;
