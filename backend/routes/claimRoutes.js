const express = require('express');
const { body } = require('express-validator');
const { listClaims, getClaim, createClaim, updateStatus, deleteClaim } = require('../controllers/claimController');
const { protect, adminOnly } = require('../middleware/auth');
const { handleValidation } = require('../middleware/validate');

const router = express.Router();

router.use(protect);

router.get('/', listClaims);
router.get('/:id', getClaim);

router.post('/',
  [
    body('itemId').notEmpty().withMessage('itemId required'),
    body('reason').trim().notEmpty().withMessage('Reason required'),
    body('hiddenDetail').trim().notEmpty().withMessage('Hidden detail required'),
  ],
  handleValidation,
  createClaim
);

router.delete('/:id', deleteClaim);

// Admin only status updates
router.put('/:id/status', adminOnly, updateStatus);
router.put('/:id', adminOnly, updateStatus);

module.exports = router;
