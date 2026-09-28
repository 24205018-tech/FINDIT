const { pool, isMockMode } = require('../config/db');
const mockStore = require('../config/mockStore');

async function findByEmail(email) {
  if (isMockMode()) {
    await mockStore.initMock();
    return mockStore.users.find(u => u.email.toLowerCase() === email.toLowerCase()) || null;
  }
  const [rows] = await pool.query('SELECT * FROM users WHERE email = ? LIMIT 1', [email.toLowerCase()]);
  return rows[0] || null;
}

async function findById(id) {
  if (isMockMode()) {
    await mockStore.initMock();
    const u = mockStore.users.find(x => String(x.id) === String(id));
    if (!u) return null;
    const { password, ...rest } = u;
    return rest;
  }
  const [rows] = await pool.query('SELECT id,name,email,phone,role,photo,created_at,updated_at FROM users WHERE id = ? LIMIT 1', [id]);
  return rows[0] || null;
}

async function findByIdWithPassword(id) {
  if (isMockMode()) {
    await mockStore.initMock();
    return mockStore.users.find(x => String(x.id) === String(id)) || null;
  }
  const [rows] = await pool.query('SELECT * FROM users WHERE id = ? LIMIT 1', [id]);
  return rows[0] || null;
}

async function createUser({ name, email, phone, password, role = 'student' }) {
  if (isMockMode()) {
    await mockStore.initMock();
    const newUser = { id: mockStore.getNextUserId(), name, email: email.toLowerCase(), phone, password, role, photo: '', created_at: new Date().toISOString(), updated_at: new Date().toISOString() };
    mockStore.users.push(newUser);
    const { password: pw, ...rest } = newUser;
    return rest;
  }
  const [result] = await pool.query('INSERT INTO users (name,email,phone,password,role) VALUES (?,?,?,?,?)', [name, email.toLowerCase(), phone, password, role]);
  return findById(result.insertId);
}

async function listUsers({ search, role, limit = 100, offset = 0 }) {
  if (isMockMode()) {
    await mockStore.initMock();
    let filtered = [...mockStore.users];
    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(u => `${u.name} ${u.email} ${u.phone}`.toLowerCase().includes(q));
    }
    if (role && role !== 'all') filtered = filtered.filter(u => u.role === role);
    return filtered.slice(offset, offset + limit).map(u => { const { password, ...rest } = u; return rest; });
  }
  let query = 'SELECT id,name,email,phone,role,photo,created_at,updated_at FROM users WHERE 1=1';
  const params = [];
  if (search) { query += ' AND (name LIKE ? OR email LIKE ? OR phone LIKE ?)'; const like = `%${search}%`; params.push(like, like, like); }
  if (role && role !== 'all') { query += ' AND role = ?'; params.push(role); }
  query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
  params.push(parseInt(limit), parseInt(offset));
  const [rows] = await pool.query(query, params);
  return rows;
}

async function countUsers() {
  if (isMockMode()) { await mockStore.initMock(); return mockStore.users.length; }
  const [rows] = await pool.query('SELECT COUNT(*) as total FROM users');
  return rows[0].total;
}

async function updateUser(id, patch) {
  if (isMockMode()) {
    await mockStore.initMock();
    const idx = mockStore.users.findIndex(u => String(u.id) === String(id));
    if (idx === -1) return null;
    Object.assign(mockStore.users[idx], patch, { updated_at: new Date().toISOString() });
    const { password, ...rest } = mockStore.users[idx];
    return rest;
  }
  const allowed = ['name','phone','photo'];
  const fields = []; const values = [];
  for (const k of allowed) { if (patch[k] !== undefined) { fields.push(`${k} = ?`); values.push(patch[k]); } }
  if (fields.length === 0) return findById(id);
  values.push(id);
  await pool.query(`UPDATE users SET ${fields.join(', ')}, updated_at = NOW() WHERE id = ?`, values);
  return findById(id);
}

async function updatePassword(id, hashedPassword) {
  if (isMockMode()) {
    const u = mockStore.users.find(x => String(x.id) === String(id));
    if (u) u.password = hashedPassword;
    return;
  }
  await pool.query('UPDATE users SET password = ?, updated_at = NOW() WHERE id = ?', [hashedPassword, id]);
}

async function deleteUser(id) {
  if (isMockMode()) {
    const idx = mockStore.users.findIndex(u => String(u.id) === String(id));
    if (idx === -1) return false;
    mockStore.users.splice(idx, 1);
    return true;
  }
  const [res] = await pool.query('DELETE FROM users WHERE id = ?', [id]);
  return res.affectedRows > 0;
}

async function updateRole(id, role) {
  if (isMockMode()) {
    const u = mockStore.users.find(x => String(x.id) === String(id));
    if (u) u.role = role;
    const { password, ...rest } = u || {};
    return rest || null;
  }
  await pool.query('UPDATE users SET role = ?, updated_at = NOW() WHERE id = ?', [role, id]);
  return findById(id);
}

module.exports = { findByEmail, findById, findByIdWithPassword, createUser, listUsers, countUsers, updateUser, updatePassword, deleteUser, updateRole };
