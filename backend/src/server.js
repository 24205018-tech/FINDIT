import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import { connectDB } from './db.js';

import authRoutes from './routes/auth.js';
import usersRoutes from './routes/users.js';
import itemsRoutes from './routes/items.js';
import claimsRoutes from './routes/claims.js';
import notificationsRoutes from './routes/notifications.js';
import matchesRoutes from './routes/matches.js';
import analyticsRoutes from './routes/analytics.js';
import conversationsRoutes from './routes/conversations.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config();

const app = express();

const clientOrigin = process.env.CLIENT_URL || 'http://localhost:5173';
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, or dev proxy)
      if (!origin) return callback(null, true);
      // Allow localhost on any port (5173, 5174, etc.) or configured CLIENT_URL
      if (/^http:\/\/localhost(:\d+)?$/.test(origin) || origin === clientOrigin) {
        return callback(null, true);
      }
      return callback(null, true); // Dev convenience
    },
    credentials: true,
  })
);

app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

app.get('/api/health', (req, res) => {
  const isConnected = mongoose.connection.readyState === 1;
  if (isConnected) {
    return res.json({
      success: true,
      message: 'FindIt backend is running.',
      database: 'connected',
    });
  }
  return res.status(503).json({
    success: false,
    message: 'Backend running but MongoDB is not connected.',
    database: 'disconnected',
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/items', itemsRoutes);
app.use('/api/claims', claimsRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/matches', matchesRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/conversations', conversationsRoutes);

app.use((req, res) => {
  res.status(404).json({ success: false, message: 'API route not found.' });
});

// Centralized error handler
app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error.',
  });
});

const port = Number(process.env.PORT || 5000);

connectDB().catch((err) => {
  console.error('Initial MongoDB connection error:', err.message);
});

app.listen(port, () => {
  console.log(`FindIt backend running on http://localhost:${port}`);
});
