const express = require('express');
const { listNotifications, markRead, markAllRead, deleteNotification, createNotification } = require('../controllers/notificationController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.get('/', listNotifications);
router.put('/read-all', markAllRead);
router.put('/:id/read', markRead);
router.delete('/:id', deleteNotification);
router.post('/', createNotification);

module.exports = router;
