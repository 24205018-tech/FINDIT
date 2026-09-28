const express = require('express');
const { body } = require('express-validator');
const { listItems, getItem, createItem, updateItem, deleteItem, myItems } = require('../controllers/itemController');
const { protect, optionalAuth } = require('../middleware/auth');
const { handleValidation } = require('../middleware/validate');

const router = express.Router();

// Public list (search) - optional auth to enrich
router.get('/', optionalAuth, listItems);

// My items - protected
router.get('/my/:userId', protect, myItems);
router.get('/my', protect, (req,res) => { req.params.userId = req.user.id; return myItems(req,res); });

// Single item - public
router.get('/:id', optionalAuth, getItem);

// Protected routes
router.post('/',
  protect,
  [
    body('kind').isIn(['lost','found']).withMessage('kind must be lost or found'),
    body('title').trim().notEmpty().withMessage('Title required').isLength({ max: 200 }),
    body('category').trim().notEmpty().withMessage('Category required'),
    body('description').trim().notEmpty().withMessage('Description required'),
    body('location').trim().notEmpty().withMessage('Location required'),
    body('date').notEmpty().withMessage('Date required').isISO8601().withMessage('Date must be valid'),
  ],
  handleValidation,
  createItem
);

router.put('/:id', protect, updateItem);
router.delete('/:id', protect, deleteItem);

module.exports = router;
