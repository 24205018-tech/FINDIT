const { pool, isMockMode } = require('../config/db');
const mockStore = require('../config/mockStore');

function mapRow(row) {
  if (!row) return null;
  return { id: row.id, userId: row.user_id || row.userId, user_id: row.user_id || row.userId, type: row.type, message: row.message, read: !!(row.is_read ?? row.isRead ?? row.read), is_read: !!(row.is_read ?? row.isRead ?? row.read), isRead: !!(row.is_read ?? row.isRead ?? row.read), createdAt: row.created_at || row.createdAt, created_at: row.created_at || row.createdAt };
}

async function listNotifications(userId, { limit = 100, offset = 0, unreadOnly = false } = {}) {
  if (isMockMode()) {
    await mockStore.initMock();
    let filtered = mockStore.notifications.filter(n => String(n.user_id) === String(userId));
    if (unreadOnly) filtered = filtered.filter(n => !n.is_read);
    filtered.sort((a,b) => new Date(b.created_at) - new Date(a.created_at));
    return filtered.slice(offset, offset+limit).map(mapRow);
  }
  let query = 'SELECT * FROM notifications WHERE user_id = ?'; const params = [userId];
  if (unreadOnly) query += ' AND is_read = FALSE';
  query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
  params.push(parseInt(limit), parseInt(offset));
  const [rows] = await pool.query(query, params);
  return rows.map(mapRow);
}

async function countUnread(userId) {
  if (isMockMode()) { return mockStore.notifications.filter(n => String(n.user_id) === String(userId) && !n.is_read).length; }
  const [rows] = await pool.query('SELECT COUNT(*) as cnt FROM notifications WHERE user_id = ? AND is_read = FALSE', [userId]);
  return rows[0].cnt;
}

async function getById(id) {
  if (isMockMode()) { return mapRow(mockStore.notifications.find(n => String(n.id) === String(id))); }
  const [rows] = await pool.query('SELECT * FROM notifications WHERE id = ? LIMIT 1', [id]);
  return mapRow(rows[0]);
}

async function createNotification({ user_id, type = 'info', message }) {
  if (isMockMode()) {
    const n = { id: mockStore.getNextNotifId(), user_id, type, message, is_read: false, created_at: new Date().toISOString() };
    mockStore.notifications.unshift(n);
    return mapRow(n);
  }
  const [result] = await pool.query('INSERT INTO notifications (user_id,type,message) VALUES (?,?,?)', [user_id, type, message]);
  return getById(result.insertId);
}

async function markRead(id, userId) {
  if (isMockMode()) {
    const n = mockStore.notifications.find(x => String(x.id) === String(id));
    if (n) n.is_read = true;
    return mapRow(n);
  }
  await pool.query('UPDATE notifications SET is_read = TRUE WHERE id = ? AND user_id = ?', [id, userId]);
  return getById(id);
}

async function markAllRead(userId) {
  if (isMockMode()) { mockStore.notifications.forEach(n => { if (String(n.user_id) === String(userId)) n.is_read = true; }); return; }
  await pool.query('UPDATE notifications SET is_read = TRUE WHERE user_id = ?', [userId]);
}

async function deleteNotification(id, userId) {
  if (isMockMode()) {
    const idx = mockStore.notifications.findIndex(n => String(n.id) === String(id) && String(n.user_id) === String(userId));
    if (idx === -1) return false;
    mockStore.notifications.splice(idx,1);
    return true;
  }
  const [res] = await pool.query('DELETE FROM notifications WHERE id = ? AND user_id = ?', [id, userId]);
  return res.affectedRows > 0;
}

async function createMatchNotification(userId, lostTitle, foundTitle, score, location) {
  const msg = `🔥 ${score}% possible match — your lost ${lostTitle} may match ${foundTitle} found at ${location}.`;
  return createNotification({ user_id: userId, type: 'match', message: msg });
}

async function createClaimStatusNotification(userId, itemTitle, status) {
  let msg = '';
  if (status === 'Approved') msg = `✅ Your claim for ${itemTitle} has been approved. Collect it at the front desk.`;
  else if (status === 'Rejected') msg = `❌ Your claim for ${itemTitle} was rejected.`;
  else if (status === 'Under Review') msg = `Your claim for ${itemTitle} is now Under Review.`;
  else msg = `Your claim for ${itemTitle} status updated to ${status}.`;
  return createNotification({ user_id: userId, type: 'claim', message: msg });
}

module.exports = { listNotifications, countUnread, getById, createNotification, markRead, markAllRead, deleteNotification, createMatchNotification, createClaimStatusNotification };
