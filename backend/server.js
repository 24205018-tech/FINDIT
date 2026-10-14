/**
 * FindIt Backend — Express + MySQL with Mock Fallback
 * Works even without MySQL — uses in-memory store for demo
 */
require('dotenv').config();

// Safe defaults so the app still works even if backend/.env is missing
process.env.JWT_SECRET = process.env.JWT_SECRET || 'findit-dev-secret-change-me';
process.env.JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
process.env.FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
process.env.NODE_ENV = process.env.NODE_ENV || 'development';

const express = require('express');
const cors = require('cors');
const { testConnection } = require('./config/db');
const { initMock } = require('./config/mockStore');
const { notFound, errorHandler } = require('./middleware/errorHandler');

const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const itemRoutes = require('./routes/itemRoutes');
const claimRoutes = require('./routes/claimRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const matchRoutes = require('./routes/matchRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');

const app = express();
let PORT = parseInt(process.env.PORT) || 5000;

// Allow the configured frontend plus any localhost / 127.0.0.1 port (Vite may pick 5173, 5174, ...)
const LOCAL_ORIGIN = /^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/;
app.use(cors({
  origin: (origin, cb) => {
    if (!origin || origin === process.env.FRONTEND_URL || LOCAL_ORIGIN.test(origin)) return cb(null, true);
    return cb(new Error(`CORS blocked origin: ${origin}`));
  },
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

if (process.env.NODE_ENV === 'development') {
  app.use((req, res, next) => {
    console.log(`${req.method} ${req.path}`);
    next();
  });
}

app.get('/', (req, res) => {
  res.json({ success: true, message: 'FindIt API is running (with mock fallback)', version: '2.0.0', timestamp: new Date().toISOString(), mode: require('./config/db').isMockMode() ? 'mock' : 'mysql' });
});
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'OK', db: require('./config/db').isMockMode() ? 'mock (in-memory)' : 'MySQL', uptime: process.uptime(), mode: require('./config/db').isMockMode() ? 'mock' : 'mysql' });
});

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/items', itemRoutes);
app.use('/api/claims', claimRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/matches', matchRoutes);
app.use('/api/analytics', analyticsRoutes);

app.use(notFound);
app.use(errorHandler);

async function start(port) {
  await testConnection();
  await initMock();
  
  const server = app.listen(port, '0.0.0.0', () => {
    console.log(`🚀 FindIt backend running on http://localhost:${port}`);
    console.log(`   Frontend allowed: ${process.env.FRONTEND_URL}`);
    console.log(`   Mode: ${require('./config/db').isMockMode() ? 'MOCK (no MySQL needed, data in memory)' : 'MySQL (persistent)'}`);
    console.log(`   Env: ${process.env.NODE_ENV}`);
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      // Do NOT hop to another port: the frontend proxy expects this exact port.
      console.error(`\n❌ Port ${port} is already in use (another backend is probably still running).`);
      console.error(`   Close the other terminal, or run:  npx kill-port ${port}\n`);
      process.exit(1);
    } else {
      console.error('Server error:', err);
      process.exit(1);
    }
  });
}

start(PORT);

module.exports = app;
