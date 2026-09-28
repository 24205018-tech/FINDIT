# FindIt — Lost & Found Management System (Full-Stack)

React Frontend + Node.js/Express Backend + MySQL Database

FindIt helps students report lost/found items, finds matches with confidence score, and handles claims securely.

## Features
- Auth: Register, Login, JWT, bcrypt, protected routes, student/admin roles
- Reporting: Lost & Found forms with validation, image upload, edit/delete own reports
- Search: Full-text search + filters (kind, category, location, status, sort)
- Claims: Secure claim wizard with hidden detail + proof, Pending/Under Review/Approved/Rejected
- Matching: Smart score (category +24, colour +18, location +22, brand +12, title +18, time +8)
- Notifications: Read/unread, mark-all-read, auto-generated on match & claim status
- Admin: Overview KPIs live from DB, users, items, claims queue, analytics charts, heatmap

## Tech Stack
- Frontend: React 18 + Vite, React Router v6, Fetch API, Context API, CSS3
- Backend: Node.js + Express 4.x, MySQL + mysql2/promise, JWT, bcryptjs, express-validator, CORS, dotenv
- Database: MySQL relational with FK, indexes, ENUMs, timestamps

## Architecture
```
React (5173) → REST API (5000) → MySQL (findit_db)
```
Flow: Register → bcrypt → INSERT users → JWT → Login → JWT stored in localStorage → Bearer token → CRUD items/claims/notifications → Matches computed server-side

## Folder Structure
```
findit/
├── backend/
│   ├── config/ db.js, initDb.js, mockStore.js (fallback when MySQL not available)
│   ├── controllers/ auth, user, item, claim, notification, match, analytics
│   ├── middleware/ auth.js, errorHandler.js, validate.js
│   ├── models/ user, item, claim, notification
│   ├── routes/ auth, user, item, claim, notification, match, analytics
│   ├── utils/ matchEngine.js
│   ├── server.js
│   ├── package.json
│   └── .env.example
├── src/
│   ├── components/ Button, Card, ItemCard, MatchCard, Modal, Navbar, etc.
│   ├── pages/ Landing, Login, Register, Dashboard, Search, MyReports, Claims, Notifications, Profile
│   ├── pages/admin/ Dashboard, Users, ItemsList, Claims, Analytics, Heatmap
│   ├── context/ AuthContext (JWT), ItemsContext
│   ├── hooks/ useAuth, useItems, useMatches, useClaims, useNotifications
│   ├── services/ api.js (central Fetch wrapper)
│   ├── utils/ helpers
│   ├── App.jsx, main.jsx, index.css, config.js
├── public/ items/*.jpg, favicon.svg
├── database.sql
├── package.json
├── vite.config.js
├── index.html
├── .env.example
└── README.md
```

## Database Design
```
users 1──* items (user_id FK CASCADE)
users 1──* claims (user_id FK)
items 1──* claims (item_id FK CASCADE)
users 1──* notifications (user_id FK CASCADE)
```
**users**: id PK, name NOT NULL, email UNIQUE NOT NULL, phone, password NOT NULL (bcrypt), role ENUM student/admin, photo, created_at/updated_at
**items**: id PK, kind ENUM lost/found NOT NULL, user_id FK, title NOT NULL, category NOT NULL, description NOT NULL, colour, brand, location NOT NULL, date NOT NULL, time, image, image_preview LONGTEXT, details, status ENUM Active/Reported/Claimed/Recovered, secret_question/answer, timestamps, indexes on kind,user_id,category,status
**claims**: id PK, item_id FK, item_kind, user_id FK, reason NOT NULL, hidden_detail NOT NULL, additional_info, proof_name, proof_preview, status ENUM Pending/Under Review/Approved/Rejected, timestamps
**notifications**: id PK, user_id FK, type ENUM match/claim/info/system, message NOT NULL, is_read BOOLEAN, created_at

## API Docs
Base: `http://localhost:5000/api`

| Method | Endpoint | Auth | Description |
| POST | /auth/register | No | {name,email,phone,password} → user+JWT |
| POST | /auth/login | No | {email,password} → user+JWT |
| GET | /auth/me | Yes | Current user |
| PUT | /auth/profile | Yes | Update profile |
| PUT | /auth/change-password | Yes | Change password |
| GET | /users?search=&role= | Admin | List users |
| GET | /users/:id | Admin | Get user |
| DELETE | /users/:id | Admin | Delete |
| PUT | /users/:id/role | Admin | Update role |
| GET | /items?kind=&category=&search= | Optional | List/search |
| GET | /items/:id | Optional | Get item |
| POST | /items | Yes | Create item |
| PUT | /items/:id | Owner/Admin | Update |
| DELETE | /items/:id | Owner/Admin | Delete |
| GET | /items/my | Yes | My items |
| GET | /claims?status=&userId= | Yes | List claims |
| GET | /claims/:id | Owner/Admin | Get claim |
| POST | /claims | Yes | Create claim |
| PUT | /claims/:id/status | Admin | Update status |
| DELETE | /claims/:id | Owner/Admin | Delete |
| GET | /notifications | Yes | List + unreadCount |
| PUT | /notifications/:id/read | Yes | Mark read |
| PUT | /notifications/read-all | Yes | Mark all read |
| DELETE | /notifications/:id | Yes | Delete |
| GET | /matches?userId=&threshold= | Optional | Compute matches |
| GET | /analytics | Optional | Categories, locations, stats |
| GET | /analytics/heatmap | Optional | Heatmap |
| GET | /analytics/overview | Admin | KPIs |

Response: `{success, message, data}`

## Quick Start (works without MySQL)
Prereq: Node 18+ (Node 20/22 recommended).

```bash
# 1. Install everything (frontend + backend)
npm run install:all

# 2. Start backend (port 5000) AND frontend (port 5173) together
npm run dev:all
```
Open http://localhost:5173 and use the **Student demo** / **Admin demo** chips on the login page.

- Student: `arjun@student.edu` / `student123`
- Admin: `admin@findit.edu` / `admin123`

If MySQL is not running, the backend automatically uses an in-memory database (all features work, data resets when the backend restarts).

### Run separately (two terminals)
```bash
# Terminal 1
cd backend && npm install && npm start      # must print: FindIt backend running on http://localhost:5000
# Terminal 2 (project root)
npm install && npm run dev                  # http://localhost:5173
```

## How the frontend talks to the backend
The frontend calls `/api/...` and the Vite dev server proxies it to `http://127.0.0.1:5000` (see `vite.config.js`).
So there are no CORS or port problems. Only set `VITE_API_URL` (in the root `.env`) if you deploy the backend somewhere else.

## Env Setup
`backend/.env` is included. Defaults:
```
PORT=5000
DB_HOST=localhost
DB_USER=findit
DB_PASSWORD=findit123
DB_NAME=findit_db
DB_PORT=3306
JWT_SECRET=findit_local_dev_secret_change_in_production
JWT_EXPIRES_IN=7d
FRONTEND_URL=http://localhost:5173
NODE_ENV=development
```
Root `.env`:
```
VITE_API_URL=/api
```

## Optional: Use real MySQL (persistent data)
```sql
CREATE USER 'findit'@'localhost' IDENTIFIED BY 'findit123';
GRANT ALL PRIVILEGES ON findit_db.* TO 'findit'@'localhost';
FLUSH PRIVILEGES;
```
```bash
cd backend && npm run init-db   # creates findit_db, tables, seeds users + items
npm start                       # should say: MySQL connected successfully
```
Check the mode any time at http://localhost:5000/api/health

## Troubleshooting
| Problem | Fix |
|---|---|
| "Login failed - Failed to fetch" | Backend is not running. Run `npm run dev:all`, or `cd backend && npm start`. |
| "Port 5000 is already in use" | An old backend is still running. Close that terminal (or `npx kill-port 5000`) and start again. |
| `npm install` errors | Use Node 18+; delete `node_modules` and `package-lock.json`, run `npm install` again. |
| Changed `.env` but nothing changed | Restart both servers (env files are read only at startup). |

## How to Test
1. Register → /register → create account
2. Login → /login → JWT stored, redirect to /dashboard
3. Dashboard shows live stats from DB, recent reports, match alert
4. Report Lost → e.g. Black Phone, Library, 2026-09-20 → success + possible match
5. My Reports → your items with match %
6. Search → type "watch", filter category Watch, location Library
7. Open found item → Claim This Item → fill reason + hidden detail → Pending
8. Logout → Profile → Logout
9. Login admin@findit.edu / admin123 → /admin → Overview KPIs
10. Admin Claims → Approve → item Recovered, claimant gets notification
11. Refresh, login again — data persists in MySQL (or in-memory if mock mode)

Demo accounts: arjun@student.edu / student123 (student), admin@findit.edu / admin123 (admin)

## Security
- bcrypt hashing (10 rounds), JWT Bearer 7d, protect + adminOnly middleware
- express-validator, CORS configured, dotenv, parameterized queries (SQL injection prevention), ownership checks

## Remaining / Known Issues
- Image stored as base64 LONGTEXT (for production use S3/multer disk)
- Backend supports limit/offset but no pagination UI yet
- Notifications in-app only (ready for email extension)
- Heatmap simulated (real lat/long can be added)
- Mock fallback data resets on restart (MySQL mode is persistent)

## For College Demo
1. Show database.sql → tables, FKs
2. Run node config/initDb.js → tables created + seeded
3. npm start backend → health
4. npm run dev frontend → login with demo chips
5. Story: Register → Report → Search → Claim → Admin Approve → Recovered
6. DevTools → LocalStorage findit_token, Network → Authorization header
