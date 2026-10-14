import { Router } from 'express';
import mongoose from 'mongoose';
import { Notification, formatNotification } from '../models/Notification.js';
import { requireAuth } from '../middleware/auth.js';
import { syncClaimNotificationsForUser } from '../utils/claimNotifications.js';

const router = Router();
router.use(requireAuth);

router.get('/', async (req, res) => {
  try {
    await syncClaimNotificationsForUser(req.user._id);
    const list = await Notification.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json({ success: true, data: list.map(formatNotification) });
  } catch (err) {
    console.error('List notifications error:', err);
    res.status(500).json({ success: false, message: 'Failed to load notifications.' });
  }
});

router.get('/unread-count', async (req, res) => {
  try {
    await syncClaimNotificationsForUser(req.user._id);
    const count = await Notification.countDocuments({ user: req.user._id, is_read: false });
    res.json({ success: true, count });
  } catch (err) {
    console.error('Count unread notifications error:', err);
    res.status(500).json({ success: false, message: 'Failed to count notifications.' });
  }
});

router.put('/:id/read', async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(404).json({ success: false, message: 'Notification not found.' });
    }
    await Notification.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      { is_read: true }
    );
    res.json({ success: true });
  } catch (err) {
    console.error('Mark read error:', err);
    res.status(500).json({ success: false, message: 'Failed to update notification.' });
  }
});

router.put('/read-all', async (req, res) => {
  try {
    await Notification.updateMany({ user: req.user._id }, { is_read: true });
    res.json({ success: true });
  } catch (err) {
    console.error('Mark all read error:', err);
    res.status(500).json({ success: false, message: 'Failed to update notifications.' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(404).json({ success: false, message: 'Notification not found.' });
    }
    await Notification.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    res.json({ success: true });
  } catch (err) {
    console.error('Delete notification error:', err);
    res.status(500).json({ success: false, message: 'Failed to delete notification.' });
  }
});

router.post('/', async (req, res) => {
  try {
    const targetUserId = req.body?.userId || req.user._id;
    if (
      String(targetUserId) !== String(req.user._id) &&
      req.user.role !== 'admin' &&
      req.user.role !== 'teacher'
    ) {
      return res.status(403).json({ success: false, message: 'Forbidden.' });
    }

    if (!mongoose.isValidObjectId(targetUserId)) {
      return res.status(400).json({ success: false, message: 'Invalid user ID.' });
    }

    const notif = await Notification.create({
      user: targetUserId,
      type: req.body?.type || 'info',
      message: String(req.body?.message || '').trim(),
    });

    res.status(201).json({ success: true, data: formatNotification(notif) });
  } catch (err) {
    console.error('Create notification error:', err);
    res.status(500).json({ success: false, message: 'Failed to create notification.' });
  }
});

export default router;
