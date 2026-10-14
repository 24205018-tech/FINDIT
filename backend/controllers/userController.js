const userModel = require('../models/userModel');

async function listUsers(req, res) {
  try {
    const { search, role, limit = 100, offset = 0 } = req.query;
    const users = await userModel.listUsers({ search, role, limit, offset });
    const total = await userModel.countUsers();
    res.json({ success: true, data: users, total });
  } catch (err) {
    console.error('List users error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch users' });
  }
}

async function getUser(req, res) {
  try {
    const user = await userModel.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, data: user });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch user' });
  }
}

async function deleteUser(req, res) {
  try {
    const id = req.params.id;
    if (String(id) === String(req.user.id)) {
      return res.status(400).json({ success: false, message: 'Cannot delete your own account' });
    }
    const ok = await userModel.deleteUser(id);
    if (!ok) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, message: 'User deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Delete failed' });
  }
}

async function updateUserRole(req, res) {
  try {
    const { role } = req.body;
    if (!['student','admin'].includes(role)) {
      return res.status(400).json({ success: false, message: 'Invalid role' });
    }
    const user = await userModel.updateRole(req.params.id, role);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, message: 'Role updated', data: user });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Role update failed' });
  }
}

module.exports = { listUsers, getUser, deleteUser, updateUserRole };
