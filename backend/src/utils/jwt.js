import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config();

export const JWT_SECRET = process.env.JWT_SECRET || 'FindIt_Project_2026_SecureKey_9xK7mP2';

export function signToken(payload, options = { expiresIn: '7d' }) {
  return jwt.sign(payload, JWT_SECRET, options);
}

export function verifyToken(token) {
  return jwt.verify(token, JWT_SECRET);
}
