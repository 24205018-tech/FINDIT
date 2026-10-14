# FindIt — React Frontend

FindIt is a React + Vite frontend for an intelligent campus Lost & Found Management System.

## Included
- React 18 + Vite
- React Router
- User / Student, Teacher and Admin dashboard UI
- Lost/Found reporting screens
- Search, matches, claims and notifications UI
- Admin analytics, users, items, claims and settings screens
- Role-based registration and login
- Frontend-only account storage using browser localStorage

## Not included
This package intentionally contains **frontend only**. Node/Express backend, MongoDB database files and backend configuration are not included.

## Authentication
There are **no default/demo accounts** in this build.

Users must register first and choose one of:
- User / Student
- Teacher
- Admin

The login page has the same three account-type options. The selected role must match the role used during registration.

Only **one Admin account** can be registered. Multiple Teachers and Users/Students can be registered.

All registered account details are stored locally in the browser using `localStorage`.

## Run
```bash
npm install
npm run dev
```

Open the Vite URL shown in the terminal, normally:
`http://localhost:5173`
