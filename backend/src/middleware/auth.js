import mongoose from 'mongoose';
import { verifyToken } from '../utils/jwt.js';
import User from '../models/User.js';

export async function requireAuth(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7).trim() : null;
    if (!token) {
      return res.status(401).json({ success: false, message: 'Authentication required.' });
    }

    let decoded;
    try {
      decoded = verifyToken(token);
    } catch (jwtErr) {
      return res.status(401).json({ success: false, message: 'Invalid or expired token.' });
    }

    const userId = decoded.id || decoded._id;
    if (!userId || !mongoose.isValidObjectId(userId)) {
      return res.status(401).json({ success: false, message: 'Invalid or expired token.' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(401).json({ success: false, message: 'User account not found.' });
    }

    req.user = user;
    next();
  } catch (err) {
    console.error('requireAuth middleware error:', err);
    return res.status(500).json({ success: false, message: 'Authentication verification failed.' });
  }
}

export function allowRoles(...roles) {
  return (req, res, next) => {
    if (roles.includes(req.user?.role)) {
      return next();
    }
    return res.status(403).json({
      success: false,
      message: 'You do not have permission for this action.',
    });
  };
}
