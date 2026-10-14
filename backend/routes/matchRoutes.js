const express = require('express');
const { getMatches, getMatchesForItem } = require('../controllers/matchController');
const { optionalAuth } = require('../middleware/auth');

const router = express.Router();

router.get('/', optionalAuth, getMatches);
router.get('/item/:id', optionalAuth, getMatchesForItem);

module.exports = router;
