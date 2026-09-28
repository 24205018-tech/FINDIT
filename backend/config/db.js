const mysql = require('mysql2/promise');
require('dotenv').config();

let useMock = false;

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'findit',
  password: process.env.DB_PASSWORD || 'findit123',
  database: process.env.DB_NAME || 'findit_db',
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
});

async function testConnection() {
  try {
    const conn = await pool.getConnection();
    console.log('✅ MySQL connected successfully');
    conn.release();
    useMock = false;
    return true;
  } catch (err) {
    console.warn('⚠️ MySQL not available, using in-memory mock DB for demo (still full-stack):', err.message);
    console.log('   → All features work, data resets on restart. To use real MySQL, create user findit/findit123 or change backend/.env to root');
    useMock = true;
    return true; // return true so server still starts
  }
}

function isMockMode() {
  return useMock;
}

module.exports = { pool, testConnection, isMockMode };
