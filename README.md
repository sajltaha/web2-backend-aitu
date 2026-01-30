# Task Management API with RBAC

A secure RESTful API for managing tasks and comments, built with Node.js, Express, and MongoDB. This project implements Role-Based Access Control (RBAC) using JWT authentication and password hashing.

## 📋 Table of Contents

- [Project Overview](#project-overview)
- [Architecture](#architecture)
- [Features](#features)
- [Setup Instructions](#setup-instructions)
- [API Endpoints](#api-endpoints)
- [Authentication & RBAC](#authentication--rbac)
- [Testing with Postman](#testing-with-postman)

## 🎯 Project Overview

This application provides a task management system with the following features:
- **Task Management**: Create, read, update, and delete tasks
- **Comment System**: Add comments to tasks
- **User Authentication**: Secure registration and login with JWT
- **Role-Based Access Control**: Different permissions for users and admins

## 🏗️ Architecture

The project follows the **MVC (Model-View-Controller)** pattern for clean separation of concerns:

```
asiks/
├── models/          # MongoDB/Mongoose schemas
│   ├── User.js      # User model with email, password (hashed), role
│   ├── Task.js      # Task model (primary object)
│   └── Comment.js   # Comment model (secondary object, related to Task)
│
├── controllers/     # Business logic
│   ├── authController.js    # Authentication logic (register, login)
│   ├── taskController.js    # Task CRUD operations
│   └── commentController.js # Comment CRUD operations
│
├── routes/          # API endpoint definitions
│   ├── auth.js      # Authentication routes
│   ├── tasks.js     # Task routes
│   └── comments.js  # Comment routes
│
├── middleware/      # Custom middleware
│   ├── auth.js           # JWT authentication & RBAC
│   ├── errorHandler.js   # Centralized error handling
│   └── validateTask.js   # Task validation
│
└── server.js        # Application entry point
```

### Architectural Decisions

1. **MVC Pattern**: Separates data models, business logic, and routing for maintainability
2. **Middleware Chain**: Authentication and authorization are handled through reusable middleware
3. **Controller Layer**: All database operations are abstracted into controllers for testability
4. **Error Handling**: Centralized error handling middleware catches and formats all errors

## ✨ Features

### Two Related Objects

1. **Task** (Primary Object)
   - Fields: `title`, `description`, `status`, `priority`
   - Status: `todo`, `in_progress`, `done`
   - Priority: `low`, `medium`, `high`

2. **Comment** (Secondary Object)
   - Fields: `content`, `task` (reference), `author` (reference)
   - Related to: Task (many-to-one relationship)
   - Related to: User (many-to-one relationship)

### Security Features

- **Password Hashing**: Uses bcrypt with salt rounds of 10
- **JWT Authentication**: Token-based authentication with 7-day expiration
- **Role-Based Access Control**: Two roles - `user` and `admin`
- **Protected Routes**: Admin-only access for POST, PUT, DELETE operations

## 🚀 Setup Instructions

### Prerequisites

- Node.js (v14 or higher)
- MongoDB (local or MongoDB Atlas)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd asiks
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Create `.env` file**
   Create a `.env` file in the root directory:
   ```env
   PORT=3000
   MONGO_URI=mongodb://localhost:27017/taskmanager
   JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
   ```

4. **Install dependencies**
   ```bash
   npm install
   ```
   
   **Note for Windows users**: If `bcrypt` installation fails, you may need to install Visual Studio Build Tools with the "Desktop development with C++" workload. Alternatively, you can use `bcryptjs` (pure JavaScript) by replacing `bcrypt` with `bcryptjs` in `package.json` and updating imports.

5. **Start the server**
   ```bash
   npm run dev
   ```

   The server will start on `http://localhost:3000`

## 📡 API Endpoints

### Authentication Endpoints

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/api/auth/register` | Public | Register a new user |
| POST | `/api/auth/login` | Public | Login and receive JWT token |
| GET | `/api/auth/profile` | Authenticated | Get current user profile |

### Task Endpoints

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/api/tasks` | Public | Get all tasks |
| GET | `/api/tasks/:id` | Public | Get a single task |
| POST | `/api/tasks` | **Admin Only** | Create a new task |
| PUT | `/api/tasks/:id` | **Admin Only** | Update a task |
| DELETE | `/api/tasks/:id` | **Admin Only** | Delete a task |

### Comment Endpoints

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/api/comments` | Public | Get all comments |
| GET | `/api/comments/task/:taskId` | Public | Get comments for a task |
| GET | `/api/comments/:id` | Public | Get a single comment |
| POST | `/api/comments` | **Admin Only** | Create a new comment |
| PUT | `/api/comments/:id` | Authenticated | Update own comment (or admin) |
| DELETE | `/api/comments/:id` | **Admin Only** | Delete a comment |

## 🔐 Authentication & RBAC

### User Registration

When registering, users can optionally specify a role. If not specified, the default role is `"user"`.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "role": "user"  // Optional, defaults to "user"
}
```

**Response:**
```json
{
  "message": "User registered successfully",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "email": "user@example.com",
    "role": "user"
  }
}
```

### Password Security

- Passwords are **never stored in plain text**
- Bcrypt hashing is applied automatically via Mongoose pre-save hook
- Minimum password length: 6 characters
- Salt rounds: 10

### JWT Token Usage

After login or registration, include the token in the `Authorization` header:

```
Authorization: Bearer <your-jwt-token>
```

### Role-Based Access Control (RBAC)

#### Public Access (No Authentication Required)
- **GET** `/api/tasks` - View all tasks
- **GET** `/api/tasks/:id` - View a single task
- **GET** `/api/comments` - View all comments
- **GET** `/api/comments/task/:taskId` - View comments for a task

#### Authenticated Access (Login Required)
- **GET** `/api/auth/profile` - View own profile
- **PUT** `/api/comments/:id` - Update own comments (or admin can update any)

#### Admin-Only Access (Admin Role Required)
- **POST** `/api/tasks` - Create tasks
- **PUT** `/api/tasks/:id` - Update tasks
- **DELETE** `/api/tasks/:id` - Delete tasks
- **POST** `/api/comments` - Create comments
- **DELETE** `/api/comments/:id` - Delete comments

### Creating Admin Users

To create an admin user, register with `role: "admin"`:

```json
POST /api/auth/register
{
  "email": "admin@example.com",
  "password": "admin123",
  "role": "admin"
}
```

## 🧪 Testing with Postman

### Step 1: Register Users

**Register a regular user:**
```json
POST http://localhost:3000/api/auth/register
Content-Type: application/json

{
  "email": "user@test.com",
  "password": "password123"
}
```

**Register an admin user:**
```json
POST http://localhost:3000/api/auth/register
Content-Type: application/json

{
  "email": "admin@test.com",
  "password": "admin123",
  "role": "admin"
}
```

### Step 2: Login and Get Token

**Login as user:**
```json
POST http://localhost:3000/api/auth/login
Content-Type: application/json

{
  "email": "user@test.com",
  "password": "password123"
}
```

Copy the `token` from the response.

### Step 3: Test Public Endpoints (No Token)

**Get all tasks:**
```
GET http://localhost:3000/api/tasks
```

### Step 4: Test Admin-Only Endpoints

**Create a task (requires admin token):**
```json
POST http://localhost:3000/api/tasks
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "title": "Complete Assignment 4",
  "description": "Implement RBAC and MVC architecture",
  "status": "in_progress",
  "priority": "high"
}
```

**Try as regular user (should fail with 403):**
```json
POST http://localhost:3000/api/tasks
Authorization: Bearer <user-token>
Content-Type: application/json

{
  "title": "Test Task",
  "description": "This should fail",
  "status": "todo",
  "priority": "low"
}
```

### Step 5: Test Comment Endpoints

**Create a comment (admin only):**
```json
POST http://localhost:3000/api/comments
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "content": "Great progress on this task!",
  "taskId": "<task-id-from-previous-step>"
}
```

**Get comments for a task (public):**
```
GET http://localhost:3000/api/comments/task/<task-id>
```

### Postman Collection

Export your Postman collection with the following test cases:

1. ✅ Register user (role: user)
2. ✅ Register admin (role: admin)
3. ✅ Login as user
4. ✅ Login as admin
5. ✅ Get all tasks (public - no auth)
6. ✅ Create task as admin (should succeed)
7. ❌ Create task as user (should fail with 403)
8. ✅ Update task as admin (should succeed)
9. ❌ Update task as user (should fail with 403)
10. ✅ Delete task as admin (should succeed)
11. ❌ Delete task as user (should fail with 403)
12. ✅ Create comment as admin
13. ❌ Create comment as user (should fail with 403)

## 🔧 Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `PORT` | Server port | `3000` |
| `MONGO_URI` | MongoDB connection string | `mongodb://localhost:27017/taskmanager` |
| `JWT_SECRET` | Secret key for JWT signing | `your-secret-key` |

## 📝 Notes

- All timestamps are automatically managed by Mongoose (`createdAt`, `updatedAt`)
- Passwords are hashed automatically before saving to the database
- JWT tokens expire after 7 days
- Error responses follow a consistent format: `{ message: "Error description" }`

## 🛡️ Security Best Practices Implemented

1. ✅ Password hashing with bcrypt
2. ✅ JWT token-based authentication
3. ✅ Role-based access control
4. ✅ Input validation
5. ✅ Error handling without exposing sensitive information
6. ✅ MongoDB injection prevention (via Mongoose)

## 📚 Technologies Used

- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM for MongoDB
- **JWT** - Authentication tokens
- **bcrypt** - Password hashing

---

**Assignment 4 - MVC Architecture with RBAC Implementation**

