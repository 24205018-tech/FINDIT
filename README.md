# FindIt — Lost & Found Management System

A full-stack web application that helps students report lost and found items, discover possible matches, communicate with item finders, and manage item recovery securely.

## Project Overview

FindIt provides a centralized platform for managing lost and found items. Users can report missing belongings, submit found-item reports, search for items, receive match notifications, communicate with other users, and submit claims to recover their belongings.

The application includes an administrative dashboard for managing users, reviewing claims, monitoring item activity, and tracking recovery statistics.

## Features

### 1. User Authentication
- User registration and login.
- Password hashing for secure credential storage.
- JWT-based authentication.
- Protected routes and role-based access.
- Google Sign-In integration.

### 2. Lost and Found Reporting
- Report lost items with relevant details.
- Report found items.
- Upload item images.
- View and manage personal reports.
- Update or delete eligible reports.

### 3. Search and Filtering
- Search for lost and found items.
- Filter items by category, location, type, and status.
- View item details to identify possible matches.

### 4. Smart Matching
- Compare lost-item and found-item details.
- Generate matching scores based on relevant item attributes.
- Display potential matches to users.
- Help users identify belongings more efficiently.

### 5. Claims Management
- Submit claims for items believed to belong to the user.
- Provide supporting information or proof.
- Track claim status.
- Allow administrators to review claims.
- Update item recovery status after an approved claim.

### 6. Messaging
- Enable communication between users about reported items.
- Send and view messages related to item recovery.

### 7. Notifications
- Notify users about relevant matches and claim-status updates.
- Display notifications in the application.
- Support reading and managing notifications.

### 8. Admin Dashboard
- View application statistics.
- Manage users and reported items.
- Review and process claims.
- Monitor item recovery.
- View analytics and activity information.

## Technology Stack

### Frontend
- React
- Vite
- React Router
- JavaScript
- HTML5
- CSS3
- Fetch API
- Context API

### Backend
- Node.js
- Express.js
- REST API
- JWT Authentication
- bcryptjs
- CORS
- dotenv

### Database
- MongoDB
- Mongoose

### Development Tools
- Visual Studio Code
- Git
- GitHub
- npm
- Postman

## System Architecture

The application follows a frontend-backend architecture.

```text
User
  |
  v
React Frontend
  |
  | HTTP Requests
  v
Node.js + Express Backend
  |
  | Database Operations
  v
MongoDB Database
