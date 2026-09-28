const { pool, isMockMode } = require('../config/db');
const mockStore = require('../config/mockStore');

function mapRow(row) {
  if (!row) return null;
  return {
    id: row.id, itemId: row.item_id || row.itemId, item_id: row.item_id || row.itemId,
    itemKind: row.item_kind || row.itemKind, item_kind: row.item_kind || row.itemKind,
    userId: row.user_id || row.userId, user_id: row.user_id || row.userId,
    reason: row.reason, hiddenDetail: row.hidden_detail || row.hiddenDetail, hidden_detail: row.hidden_detail || row.hiddenDetail,
    additionalInfo: row.additional_info || row.additionalInfo || '', additional_info: row.additional_info || row.additionalInfo || '',
    proofName: row.proof_name || row.proofName || '', proof_name: row.proof_name || row.proofName || '',
    proofPreview: row.proof_preview || row.proofPreview || '', proof_preview: row.proof_preview || row.proofPreview || '',
    status: row.status, createdAt: row.created_at || row.createdAt, created_at: row.created_at || row.createdAt,
    updatedAt: row.updated_at || row.updatedAt, updated_at: row.updated_at || row.updatedAt,
    itemTitle: row.item_title || row.itemTitle || null, item_title: row.item_title || row.itemTitle || null,
    itemCategory: row.item_category || null, itemLocation: row.item_location || null,
    claimantName: row.claimant_name || null, claimantEmail: row.claimant_email || null,
  };
}

async function listClaims({ userId, status, itemId, limit = 100, offset = 0, isAdmin = false }) {
  if (isMockMode()) {
    await mockStore.initMock();
    let filtered = [...mockStore.claims];
    if (!isAdmin && userId) filtered = filtered.filter(c => String(c.user_id) === String(userId));
    else if (userId) filtered = filtered.filter(c => String(c.user_id) === String(userId));
    if (status && status !== 'All') filtered = filtered.filter(c => c.status === status);
    if (itemId) filtered = filtered.filter(c => String(c.item_id) === String(itemId));
    filtered.sort((a,b) => new Date(b.created_at) - new Date(a.created_at));
    return filtered.slice(offset, offset+limit).map(mapRow);
  }
  let query = `SELECT c.*, i.title as item_title, i.category as item_category, i.location as item_location, u.name as claimant_name, u.email as claimant_email FROM claims c LEFT JOIN items i ON c.item_id = i.id LEFT JOIN users u ON c.user_id = u.id WHERE 1=1`;
  const params = [];
  if (!isAdmin && userId) { query += ' AND c.user_id = ?'; params.push(userId); }
  else if (userId) { query += ' AND c.user_id = ?'; params.push(userId); }
  if (status && status !== 'All') { query += ' AND c.status = ?'; params.push(status); }
  if (itemId) { query += ' AND c.item_id = ?'; params.push(itemId); }
  query += ' ORDER BY c.created_at DESC LIMIT ? OFFSET ?';
  params.push(parseInt(limit), parseInt(offset));
  const [rows] = await pool.query(query, params);
  return rows.map(mapRow);
}

async function countClaims({ userId, status, isAdmin = false } = {}) {
  if (isMockMode()) { return (await listClaims({ userId, status, isAdmin, limit: 1000 })).length; }
  let q = 'SELECT COUNT(*) as total FROM claims WHERE 1=1'; const p = [];
  if (!isAdmin && userId) { q += ' AND user_id = ?'; p.push(userId); }
  else if (userId) { q += ' AND user_id = ?'; p.push(userId); }
  if (status && status !== 'All') { q += ' AND status = ?'; p.push(status); }
  const [rows] = await pool.query(q, p);
  return rows[0].total;
}

async function getClaimById(id) {
  if (isMockMode()) {
    const c = mockStore.claims.find(x => String(x.id) === String(id));
    return mapRow(c);
  }
  const [rows] = await pool.query(`SELECT c.*, i.title as item_title, i.category as item_category, i.location as item_location, u.name as claimant_name, u.email as claimant_email FROM claims c LEFT JOIN items i ON c.item_id = i.id LEFT JOIN users u ON c.user_id = u.id WHERE c.id = ? LIMIT 1`, [id]);
  return mapRow(rows[0]);
}

async function createClaim(data) {
  if (isMockMode()) {
    const newClaim = { id: mockStore.getNextClaimId(), ...data, status: 'Pending', created_at: new Date().toISOString(), updated_at: new Date().toISOString() };
    mockStore.claims.unshift(newClaim);
    return mapRow(newClaim);
  }
  const { item_id, item_kind, user_id, reason, hidden_detail, additional_info, proof_name, proof_preview } = data;
  const [result] = await pool.query(`INSERT INTO claims (item_id,item_kind,user_id,reason,hidden_detail,additional_info,proof_name,proof_preview,status) VALUES (?,?,?,?,?,?,?,?, 'Pending')`, [item_id, item_kind || 'found', user_id, reason, hidden_detail, additional_info || '', proof_name || '', proof_preview || '']);
  return getClaimById(result.insertId);
}

async function updateClaimStatus(id, status) {
  if (isMockMode()) {
    const c = mockStore.claims.find(x => String(x.id) === String(id));
    if (c) { c.status = status; c.updated_at = new Date().toISOString(); }
    return mapRow(c);
  }
  await pool.query('UPDATE claims SET status = ?, updated_at = NOW() WHERE id = ?', [status, id]);
  return getClaimById(id);
}

async function updateClaim(id, patch) {
  if (isMockMode()) {
    const c = mockStore.claims.find(x => String(x.id) === String(id));
    if (c) Object.assign(c, patch, { updated_at: new Date().toISOString() });
    return mapRow(c);
  }
  const allowed = ['reason','hidden_detail','additional_info','proof_name','proof_preview','status'];
  const fields = []; const values = [];
  for (const k of allowed) { if (patch[k] !== undefined) { fields.push(`${k} = ?`); values.push(patch[k]); } }
  if (fields.length === 0) return getClaimById(id);
  values.push(id);
  await pool.query(`UPDATE claims SET ${fields.join(', ')}, updated_at = NOW() WHERE id = ?`, values);
  return getClaimById(id);
}

async function deleteClaim(id) {
  if (isMockMode()) {
    const idx = mockStore.claims.findIndex(x => String(x.id) === String(id));
    if (idx === -1) return false;
    mockStore.claims.splice(idx,1);
    return true;
  }
  const [res] = await pool.query('DELETE FROM claims WHERE id = ?', [id]);
  return res.affectedRows > 0;
}

module.exports = { listClaims, countClaims, getClaimById, createClaim, updateClaimStatus, updateClaim, deleteClaim };
