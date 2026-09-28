const notificationModel = require('../models/notificationModel');

async function listNotifications(req, res) {
  try {
    const { limit = 100, offset = 0, unreadOnly } = req.query;
    const notifs = await notificationModel.listNotifications(req.user.id, { limit, offset, unreadOnly: unreadOnly === 'true' });
    const unread = await notificationModel.countUnread(req.user.id);
    res.json({ success: true, data: notifs, unreadCount: unread });
  } catch (err) {
    console.error('List notifications error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch notifications' });
  }
}

async function markRead(req, res) {
  try {
    const notif = await notificationModel.getById(req.params.id);
    if (!notif) return res.status(404).json({ success: false, message: 'Notification not found' });
    if (String(notif.userId) !== String(req.user.id) && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    const updated = await notificationModel.markRead(req.params.id, notif.userId);
    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Mark read failed' });
  }
}

async function markAllRead(req, res) {
  try {
    await notificationModel.markAllRead(req.user.id);
    res.json({ success: true, message: 'All notifications marked as read' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Mark all read failed' });
  }
}

async function deleteNotification(req, res) {
  try {
    const ok = await notificationModel.deleteNotification(req.params.id, req.user.id);
    if (!ok) return res.status(404).json({ success: false, message: 'Notification not found' });
    res.json({ success: true, message: 'Notification deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Delete failed' });
  }
}

async function createNotification(req, res) {
  try {
    const { userId, type, message } = req.body;
    if (!userId || !message) return res.status(400).json({ success: false, message: 'userId and message required' });
    if (req.user.role !== 'admin' && String(userId) !== String(req.user.id)) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    const notif = await notificationModel.createNotification({ user_id: userId, type: type || 'info', message });
    res.status(201).json({ success: true, data: notif });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Create failed' });
  }
}

module.exports = { listNotifications, markRead, markAllRead, deleteNotification, createNotification };
