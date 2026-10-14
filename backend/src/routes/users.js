import { Router } from 'express';
import mongoose from 'mongoose';
import { User } from '../models/User.js';
import { requireAuth, allowRoles } from '../middleware/auth.js';
import { publicUser } from '../utils/user.js';

const router = Router();
router.use(requireAuth, allowRoles('admin'));

router.get('/', async (req, res) => {
  try {
    const role = req.query.role;
    const filter = role && role !== 'all' ? { role } : {};
    const users = await User.find(filter).sort({ createdAt: -1 });
    res.json({ success: true, data: users.map(publicUser) });
  } catch (err) {
    console.error('List users error:', err);
    res.status(500).json({ success: false, message: 'Failed to load users.' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }
    res.json({ success: true, data: publicUser(user) });
  } catch (err) {
    console.error('Get user error:', err);
    res.status(500).json({ success: false, message: 'Failed to load user.' });
  }
});

router.put('/:id/role', async (req, res) => {
  try {
    const role = req.body?.role;
    if (!['student', 'teacher', 'admin'].includes(role)) {
      return res.status(400).json({ success: false, message: 'Invalid role.' });
    }

    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    if (role === 'admin') {
      const existingAdmin = await User.findOne({
        role: 'admin',
        _id: { $ne: req.params.id },
      });
      if (existingAdmin) {
        return res.status(409).json({
          success: false,
          message: 'Only one administrator account is allowed.',
        });
      }
    }

    user.role = role;
    user.designation =
      role === 'admin'
        ? 'System Administrator'
        : role === 'teacher'
        ? 'Teacher'
        : 'Student';
    await user.save();

    res.json({ success: true, data: publicUser(user) });
  } catch (err) {
    console.error('Update role error:', err);
    res.status(500).json({ success: false, message: 'Role update failed.' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    if (String(req.params.id) === String(req.user._id)) {
      return res.status(400).json({
        success: false,
        message: 'You cannot delete your own admin account.',
      });
    }

    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    await User.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    console.error('Delete user error:', err);
    res.status(500).json({ success: false, message: 'Failed to delete user.' });
  }
});

export default router;
