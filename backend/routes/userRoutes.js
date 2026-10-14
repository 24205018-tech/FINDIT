const express = require('express');
const { listUsers, getUser, deleteUser, updateUserRole } = require('../controllers/userController');
const { protect, adminOnly } = require('../middleware/auth');

const router = express.Router();

router.use(protect);
router.use(adminOnly);

router.get('/', listUsers);
router.get('/:id', getUser);
router.delete('/:id', deleteUser);
router.put('/:id/role', updateUserRole);

module.exports = router;
