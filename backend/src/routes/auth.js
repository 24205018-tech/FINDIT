import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { User } from '../models/User.js';
import { requireAuth } from '../middleware/auth.js';
import { publicUser } from '../utils/user.js';
import { signToken } from '../utils/jwt.js';
import { verifyGoogleToken } from '../utils/googleAuth.js';

const router = Router();

router.post('/register', async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      password,
      role = 'student',
      department = '',
      designation = '',
    } = req.body || {};

    if (!name || !email || !phone || !password || !['student', 'teacher', 'admin'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, phone, password and valid role are required.',
      });
    }

    const normalized = String(email).trim().toLowerCase();

    // Check for duplicate email
    const existing = await User.findOne({ email: normalized });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email already exists.',
      });
    }

    // Enforce single admin rule
    if (role === 'admin') {
      const adminExists = await User.findOne({ role: 'admin' });
      if (adminExists) {
        return res.status(409).json({
          success: false,
          message: 'Only one administrator account is allowed.',
        });
      }
    }

    const hash = await bcrypt.hash(password, 12);
    const user = await User.create({
      name: String(name).trim(),
      email: normalized,
      phone: String(phone).trim(),
      password_hash: hash,
      role,
      department: String(department).trim() || (role === 'admin' ? 'Administration' : 'General'),
      designation: String(designation).trim() || (role === 'admin' ? 'System Administrator' : role === 'teacher' ? 'Teacher' : 'Student'),
    });

    const token = signToken({ id: user._id.toString() });
    res.status(201).json({
      success: true,
      message: 'Account created successfully.',
      data: publicUser(user),
      token,
    });
  } catch (err) {
    console.error('Registration error:', err);
    if (err.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email already exists.',
      });
    }
    res.status(500).json({ success: false, message: 'Registration failed.' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password, role } = req.body || {};
    const normalized = String(email || '').trim().toLowerCase();

    const query = { email: normalized };
    if (role) query.role = role;

    const user = await User.findOne(query);
    if (!user || !user.password_hash || !(await bcrypt.compare(password || '', user.password_hash))) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email, password, or account type.',
      });
    }

    const token = signToken({ id: user._id.toString() });
    res.json({
      success: true,
      message: 'Login successful.',
      data: publicUser(user),
      token,
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ success: false, message: 'Login failed.' });
  }
});

router.post('/google', async (req, res) => {
  try {
    const { idToken, credential, role } = req.body || {};
    const tokenToVerify = idToken || credential;

    if (!tokenToVerify) {
      return res.status(400).json({
        success: false,
        message: 'Google ID token is required.',
      });
    }

    let payload;
    try {
      payload = await verifyGoogleToken(tokenToVerify);
    } catch (verifyErr) {
      console.error('Google token verification error:', verifyErr.message);
      return res.status(401).json({
        success: false,
        message: verifyErr.message || 'Invalid or expired Google token.',
      });
    }

    if (!payload || !payload.email) {
      return res.status(400).json({
        success: false,
        message: 'Google token does not contain a valid email address.',
      });
    }

    const normalized = String(payload.email).trim().toLowerCase();

    // Check if a user with this email already exists
    let user = await User.findOne({ email: normalized });

    if (user) {
      // Existing user account found -> link Google ID if not yet linked
      let updated = false;
      if (!user.google_id && payload.sub) {
        user.google_id = payload.sub;
        updated = true;
      }
      if (!user.photo && payload.picture) {
        user.photo = payload.picture;
        updated = true;
      }
      if (updated) {
        await user.save();
      }

      const token = signToken({ id: user._id.toString() });
      return res.json({
        success: true,
        message: 'Login successful.',
        data: publicUser(user),
        token,
      });
    }

    // New user -> determine role and enforce single admin rule
    // Arbitrary Google users cannot register or become administrators
    if (role === 'admin') {
      return res.status(403).json({
        success: false,
        message:
          'Administrator accounts cannot be created via Google Sign-In. Only the existing administrator can sign in.',
      });
    }

    const chosenRole = ['student', 'teacher'].includes(role) ? role : 'student';

    user = await User.create({
      name: payload.name || normalized.split('@')[0],
      email: normalized,
      phone: '',
      password_hash: '',
      google_id: payload.sub || '',
      photo: payload.picture || '',
      role: chosenRole,
      department: 'General',
      designation: chosenRole === 'teacher' ? 'Teacher' : 'Student',
    });

    const token = signToken({ id: user._id.toString() });
    return res.status(201).json({
      success: true,
      message: 'Account created with Google successfully.',
      data: publicUser(user),
      token,
    });
  } catch (err) {
    console.error('Google auth error:', err);
    return res.status(500).json({
      success: false,
      message: err.message || 'Google authentication failed.',
    });
  }
});

router.get('/me', requireAuth, (req, res) => {
  res.json({ success: true, data: publicUser(req.user) });
});

router.put('/profile', requireAuth, async (req, res) => {
  try {
    const allowed = ['name', 'phone', 'department', 'designation', 'photo'];
    let changed = false;

    for (const k of allowed) {
      if (req.body?.[k] !== undefined) {
        req.user[k] = req.body[k];
        changed = true;
      }
    }

    if (changed) {
      await req.user.save();
    }

    res.json({ success: true, data: publicUser(req.user) });
  } catch (err) {
    console.error('Profile update error:', err);
    res.status(500).json({ success: false, message: 'Profile update failed.' });
  }
});

router.put('/change-password', requireAuth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body || {};

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    if (user.password_hash && !(await bcrypt.compare(currentPassword || '', user.password_hash))) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect.',
      });
    }

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters.',
      });
    }

    user.password_hash = await bcrypt.hash(newPassword, 12);
    await user.save();

    res.json({ success: true, message: 'Password changed successfully.' });
  } catch (err) {
    console.error('Password change error:', err);
    res.status(500).json({ success: false, message: 'Password change failed.' });
  }
});

export default router;
