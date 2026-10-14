# FindIt Backend Setup — Quick Start (MongoDB)

1. Install MongoDB and Node.js 18+.
2. Make sure MongoDB service is running (e.g. `mongodb://127.0.0.1:27017`).
3. Verify `backend/.env`:
   ```env
   PORT=5000
   MONGODB_URI=mongodb://127.0.0.1:27017/findit_db
   JWT_SECRET=FindIt_Project_2026_SecureKey_9xK7mP2
   CLIENT_URL=http://localhost:5173
   ```
4. Open terminal 1:
   ```cmd
   cd backend
   npm install
   npm run dev
   ```
5. Open terminal 2 at the project root:
   ```cmd
   npm install
   npm run dev
   ```
6. Open `http://localhost:5173` (or `http://localhost:5174`).

Backend health check: `http://localhost:5000/api/health` reports the MongoDB connection status.
No demo accounts are required; register your own Student, Teacher, or Admin account directly from the UI.
