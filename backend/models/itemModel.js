const { pool, isMockMode } = require('../config/db');
const mockStore = require('../config/mockStore');

function mapRow(row) {
  if (!row) return null;
  return {
    id: row.id, kind: row.kind, userId: row.user_id || row.userId, user_id: row.user_id || row.userId,
    title: row.title, category: row.category, description: row.description,
    colour: row.colour, brand: row.brand, location: row.location,
    date: row.date ? (row.date.toISOString ? row.date.toISOString().slice(0,10) : row.date) : row.date,
    time: row.time || '', image: row.image || '', imagePreview: row.image_preview || row.imagePreview || '', image_preview: row.image_preview || row.imagePreview || '',
    details: row.details || '', status: row.status,
    secretQuestion: row.secret_question || '', secretAnswer: row.secret_answer || '',
    createdAt: row.created_at || row.createdAt, created_at: row.created_at || row.createdAt,
    updatedAt: row.updated_at || row.updatedAt, updated_at: row.updated_at || row.updatedAt,
    userName: row.user_name || row.userName || null, user_name: row.user_name || row.userName || null,
    userEmail: row.user_email || null,
  };
}

function mockMap(row) { return mapRow(row); }

async function listItems({ kind, category, location, status, search, userId, limit = 100, offset = 0 }) {
  if (isMockMode()) {
    await mockStore.initMock();
    let filtered = [...mockStore.items];
    if (kind) filtered = filtered.filter(i => i.kind === kind);
    if (category) filtered = filtered.filter(i => i.category === category);
    if (location) filtered = filtered.filter(i => i.location.toLowerCase().includes(location.toLowerCase()));
    if (status) filtered = filtered.filter(i => i.status === status);
    if (userId) filtered = filtered.filter(i => String(i.user_id) === String(userId));
    if (search) { const q = search.toLowerCase(); filtered = filtered.filter(i => `${i.title} ${i.description} ${i.brand} ${i.colour} ${i.location}`.toLowerCase().includes(q)); }
    filtered.sort((a,b) => new Date(b.created_at) - new Date(a.created_at));
    return filtered.slice(offset, offset + limit).map(mockMap);
  }
  let query = `SELECT i.*, u.name as user_name, u.email as user_email FROM items i LEFT JOIN users u ON i.user_id = u.id WHERE 1=1`;
  const params = [];
  if (kind) { query += ' AND i.kind = ?'; params.push(kind); }
  if (category) { query += ' AND i.category = ?'; params.push(category); }
  if (location) { query += ' AND i.location LIKE ?'; params.push(`%${location}%`); }
  if (status) { query += ' AND i.status = ?'; params.push(status); }
  if (userId) { query += ' AND i.user_id = ?'; params.push(userId); }
  if (search) { query += ' AND (i.title LIKE ? OR i.description LIKE ? OR i.brand LIKE ? OR i.colour LIKE ? OR i.location LIKE ?)'; const like = `%${search}%`; params.push(like, like, like, like, like); }
  query += ' ORDER BY i.created_at DESC LIMIT ? OFFSET ?';
  params.push(parseInt(limit), parseInt(offset));
  const [rows] = await pool.query(query, params);
  return rows.map(mapRow);
}

async function countItems({ kind, status, userId } = {}) {
  if (isMockMode()) {
    let filtered = [...mockStore.items];
    if (kind) filtered = filtered.filter(i => i.kind === kind);
    if (status) filtered = filtered.filter(i => i.status === status);
    if (userId) filtered = filtered.filter(i => String(i.user_id) === String(userId));
    return filtered.length;
  }
  let q = 'SELECT COUNT(*) as total FROM items WHERE 1=1'; const p = [];
  if (kind) { q += ' AND kind = ?'; p.push(kind); }
  if (status) { q += ' AND status = ?'; p.push(status); }
  if (userId) { q += ' AND user_id = ?'; p.push(userId); }
  const [rows] = await pool.query(q, p);
  return rows[0].total;
}

async function getItemById(id) {
  if (isMockMode()) {
    await mockStore.initMock();
    const item = mockStore.items.find(i => String(i.id) === String(id));
    return mockMap(item);
  }
  const [rows] = await pool.query(`SELECT i.*, u.name as user_name, u.email as user_email FROM items i LEFT JOIN users u ON i.user_id = u.id WHERE i.id = ? LIMIT 1`, [id]);
  return mapRow(rows[0]);
}

async function createItem(data) {
  if (isMockMode()) {
    await mockStore.initMock();
    const newItem = { id: mockStore.getNextItemId(), ...data, image_preview: data.image_preview || '', created_at: new Date().toISOString(), updated_at: new Date().toISOString() };
    mockStore.items.unshift(newItem);
    return mockMap(newItem);
  }
  const { kind, user_id, title, category, description, colour, brand, location, date, time, image, image_preview, details, status, secret_question, secret_answer } = data;
  const [result] = await pool.query(`INSERT INTO items (kind,user_id,title,category,description,colour,brand,location,date,time,image,image_preview,details,status,secret_question,secret_answer) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`, [kind, user_id, title, category, description, colour || '—', brand || '—', location, date, time || null, image || '', image_preview || '', details || '', status || (kind === 'lost' ? 'Active' : 'Reported'), secret_question || null, secret_answer || null]);
  return getItemById(result.insertId);
}

async function updateItem(id, patch) {
  if (isMockMode()) {
    const idx = mockStore.items.findIndex(i => String(i.id) === String(id));
    if (idx === -1) return null;
    Object.assign(mockStore.items[idx], patch, { updated_at: new Date().toISOString() });
    return mockMap(mockStore.items[idx]);
  }
  const allowed = ['title','category','description','colour','brand','location','date','time','image','image_preview','details','status','secret_question','secret_answer'];
  const fields = []; const values = [];
  for (const k of allowed) { if (patch[k] !== undefined) { fields.push(`${k} = ?`); values.push(patch[k]); } }
  if (fields.length === 0) return getItemById(id);
  values.push(id);
  await pool.query(`UPDATE items SET ${fields.join(', ')}, updated_at = NOW() WHERE id = ?`, values);
  return getItemById(id);
}

async function deleteItem(id) {
  if (isMockMode()) {
    const idx = mockStore.items.findIndex(i => String(i.id) === String(id));
    if (idx === -1) return false;
    mockStore.items.splice(idx, 1);
    return true;
  }
  const [res] = await pool.query('DELETE FROM items WHERE id = ?', [id]);
  return res.affectedRows > 0;
}

async function getItemsByUser(userId) {
  if (isMockMode()) {
    await mockStore.initMock();
    return mockStore.items.filter(i => String(i.user_id) === String(userId)).map(mockMap);
  }
  const [rows] = await pool.query('SELECT * FROM items WHERE user_id = ? ORDER BY created_at DESC', [userId]);
  return rows.map(mapRow);
}

async function getStats() {
  if (isMockMode()) {
    await mockStore.initMock();
    const total = mockStore.items.length;
    const lost = mockStore.items.filter(i => i.kind === 'lost').length;
    const found = mockStore.items.filter(i => i.kind === 'found').length;
    const recovered = mockStore.items.filter(i => i.status === 'Recovered').length;
    const catMap = {}; mockStore.items.forEach(i => { catMap[i.category] = (catMap[i.category] || 0) + 1; });
    const categories = Object.entries(catMap).map(([label, value]) => ({ label, value }));
    const locMap = {}; mockStore.items.forEach(i => { locMap[i.location] = (locMap[i.location] || 0) + 1; });
    const locations = Object.entries(locMap).map(([label, value]) => ({ label, value }));
    return { total, lost, found, recovered, categories, locations, monthly: [] };
  }
  const [total] = await pool.query('SELECT COUNT(*) as total FROM items');
  const [lost] = await pool.query("SELECT COUNT(*) as c FROM items WHERE kind='lost'");
  const [found] = await pool.query("SELECT COUNT(*) as c FROM items WHERE kind='found'");
  const [recovered] = await pool.query("SELECT COUNT(*) as c FROM items WHERE status='Recovered'");
  const [categories] = await pool.query('SELECT category as label, COUNT(*) as value FROM items GROUP BY category ORDER BY value DESC');
  const [locations] = await pool.query('SELECT location as label, COUNT(*) as value FROM items GROUP BY location ORDER BY value DESC LIMIT 10');
  const [monthly] = await pool.query(`SELECT DATE_FORMAT(created_at, '%Y-%m') as month, SUM(CASE WHEN kind='lost' THEN 1 ELSE 0 END) as lost, SUM(CASE WHEN kind='found' THEN 1 ELSE 0 END) as found FROM items GROUP BY DATE_FORMAT(created_at, '%Y-%m') ORDER BY month DESC LIMIT 6`);
  return { total: total[0].total, lost: lost[0].c, found: found[0].c, recovered: recovered[0].c, categories, locations, monthly: monthly.reverse() };
}

module.exports = { listItems, countItems, getItemById, createItem, updateItem, deleteItem, getItemsByUser, getStats };
