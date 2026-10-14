# FindIt Backend — Node.js + Express + MongoDB

## 1. Requirements
- Node.js 18+
- MongoDB 6+ (Local or MongoDB Atlas)

## 2. Configure backend
Set up `backend/.env`:

```env
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/findit_db
JWT_SECRET=FindIt_Project_2026_SecureKey_9xK7mP2
CLIENT_URL=http://localhost:5173
```

## 3. Install and run backend
From the `backend` folder:

```cmd
npm install
npm run dev
```

Backend URL: `http://localhost:5000`  
Health check: `http://localhost:5000/api/health` (reports MongoDB connection status)

## 4. Run frontend
From the project root:

```cmd
npm install
npm run dev
```

Frontend: `http://localhost:5173` or `http://localhost:5174`

The Vite proxy forwards `/api/*` requests to the Express backend on port 5000.

## Authentication & Database
MongoDB is used via Mongoose models:
- `User`: User accounts, hashed passwords, roles (`student`, `teacher`, `admin`), profile data. Enforces single administrator rule and unique emails.
- `Item`: Lost and found reports with location, categories, images, and status.
- `Claim`: Claim requests on found items with proof details, status reviews.
- `Match`: Match pairings with similarity scores.
- `Notification`: User notifications and read status.

Passwords are securely hashed using bcrypt. Authentication uses JWT Bearer tokens signed with `JWT_SECRET`.
