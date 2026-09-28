const express = require('express');
const { getAnalytics, getHeatmap, getOverview } = require('../controllers/analyticsController');
const { protect, adminOnly, optionalAuth } = require('../middleware/auth');

const router = express.Router();

router.get('/overview', protect, adminOnly, getOverview);
router.get('/heatmap', optionalAuth, getHeatmap);
router.get('/', optionalAuth, getAnalytics);

module.exports = router;
