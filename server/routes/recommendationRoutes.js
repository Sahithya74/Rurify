const express = require('express');
const router = express.Router();
const { listRecommendations } = require('../controllers/recommendationController');
const { authenticate, authorize } = require('../middleware/auth');

router.get('/', authenticate, authorize('vendor'), listRecommendations);

module.exports = router;
