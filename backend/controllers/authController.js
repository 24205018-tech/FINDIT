const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const userModel = require('../models/userModel');

function generateToken(id) {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });
}

async function register(req, res) {
  try {
    const { name, email, phone, password, role } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Name, email and password are required' });
    }
    const existing = await userModel.findByEmail(email);
    if (existing) {
      return res.status(409).json({ success: false, message: 'An account with this email already exists' });
    }
    const hashed = await bcrypt.hash(password, 10);
    const user = await userModel.createUser({ name: name.trim(), email: email.trim(), phone: phone || '', password: hashed, role: role === 'admin' ? 'admin' : 'student' });
    const token = generateToken(user.id);
    res.status(201).json({
      success: true,
      message: 'Account created successfully',
      data: { user, token }
    });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ success: false, message: 'Registration failed', error: err.message });
  }
}

async function login(req, res) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }
    const userWithPass = await userModel.findByEmail(email);
    if (!userWithPass) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }
    const match = await bcrypt.compare(password, userWithPass.password);
    if (!match) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }
    const user = await userModel.findById(userWithPass.id);
    const token = generateToken(user.id);
    res.json({
      success: true,
      message: 'Login successful',
      data: { user, token }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ success: false, message: 'Login failed', error: err.message });
  }
}

async function getMe(req, res) {
  try {
    res.json({ success: true, data: req.user });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch profile' });
  }
}

async function updateProfile(req, res) {
  try {
    const { name, phone, photo } = req.body;
    const patch = {};
    if (name) patch.name = name.trim();
    if (phone) patch.phone = phone.trim();
    if (photo !== undefined) patch.photo = photo;
    const updated = await userModel.updateUser(req.user.id, patch);
    res.json({ success: true, message: 'Profile updated', data: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Profile update failed', error: err.message });
  }
}

async function changePassword(req, res) {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'Current and new password required' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'New password must be at least 6 characters' });
    }
    const userWithPass = await userModel.findByIdWithPassword(req.user.id);
    const match = await bcrypt.compare(currentPassword, userWithPass.password);
    if (!match) {
      return res.status(401).json({ success: false, message: 'Current password is incorrect' });
    }
    const hashed = await bcrypt.hash(newPassword, 10);
    await userModel.updatePassword(req.user.id, hashed);
    res.json({ success: true, message: 'Password changed successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Password change failed' });
  }
}

module.exports = { register, login, getMe, updateProfile, changePassword };
