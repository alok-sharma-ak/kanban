# Nx Kanban Project

A simple full-stack **Kanban Board application** built using an **Nx monorepo**, with:

- **Frontend:** Next.js
- **Backend:** NestJS
- **Database:** PostgreSQL
- **ORM:** TypeORM
- **Authentication:** JWT
- **Drag & Drop:** dnd-kit
- **Package Manager:** pnpm

---

# 1. Project Goal

Build a simple Kanban application where users can:

1. Register and log in.
2. Create Kanban boards.
3. Create columns such as:
   - Todo
   - In Progress
   - Done
4. Create tasks inside columns.
5. Edit and delete tasks.
6. Drag tasks between columns.
7. Reorder tasks inside the same column.
8. View and manage their own boards.

Basic application flow:

```text
Authentication
      ↓
Dashboard
      ↓
Boards
      ↓
Board Details
      ↓
Columns
      ↓
Tasks
      ↓
Drag & Drop
```

---

# 2. Nx Workspace Structure

The structure for our applications is as follows:

```text
kanban/
│
├── packages/
│   │
│   ├── kanban-api/
│   │   ├── src/
│   │   │   └── app/
│   │   │       ├── auth/
│   │   │       ├── users/
│   │   │       ├── boards/
│   │   │       ├── columns/
│   │   │       └── tasks/
│   │   └── project.json
│   │
│   ├── kanban-api-e2e/
│   │
│   ├── kanban-dashboard/
│   │   ├── src/
│   │   └── project.json
│   │
│   └── kanban-dashboard-e2e/
│
├── nx.json
├── package.json
├── tsconfig.base.json
└── pnpm-lock.yaml
```

All backend modules are located directly within the NestJS application:

```text
packages/kanban-api/src/app/
├── auth/
├── users/
├── boards/
├── columns/
└── tasks/
```

---

# 3. Applications

## Backend

```text
packages/kanban-api
```

Technology:

```text
NestJS
TypeORM
PostgreSQL
JWT
bcrypt
class-validator
```

Responsibility:

```text
Authentication
Users
Boards
Columns
Tasks
Authorization
Database
```

---

## Frontend

```text
packages/kanban-dashboard
```

Technology:

```text
Next.js
React
Tailwind CSS
shadcn/ui
dnd-kit
```

Responsibility:

```text
Authentication UI
Dashboard
Board management
Column management
Task management
Drag & Drop
```

---

# 4. Backend Modules

Backend implementation priority:

| Priority | Module | Purpose |
|---|---|---|
| 🔴 1 | `AuthModule` | Register, login, JWT authentication |
| 🔴 2 | `UsersModule` | User identity and profile |
| 🔴 3 | `BoardsModule` | Create and manage Kanban boards |
| 🔴 4 | `ColumnsModule` | Manage Todo / In Progress / Done columns |
| 🔴 5 | `TasksModule` | Create, update, delete, move and reorder tasks |

Dependency flow:

```text
AuthModule
    ↓
UsersModule
    ↓
BoardsModule
    ↓
ColumnsModule
    ↓
TasksModule
```

---

# 5. Database Design

Main entities:

```text
User
Board
Column
Task
```

Relationship:

```text
User
 │
 └── Board
      │
      └── Column
           │
           └── Task
```

Or:

```text
User 1 ─────── N Board

Board 1 ────── N Column

Column 1 ───── N Task
```

---

# 6. User Entity

```text
users
-------------------------
id
name
email
password
createdAt
updatedAt
```

Example TypeScript model:

```ts
interface User {
  id: string;
  name: string;
  email: string;
  password: string;
  createdAt: Date;
  updatedAt: Date;
}
```

Important:

Never return the `password` field from the API.

Passwords must be hashed before storing them.

---

# 7. Board Entity

```text
boards
-------------------------
id
name
description
userId
createdAt
updatedAt
```

Example:

```ts
interface Board {
  id: string;
  name: string;
  description?: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}
```

Relationship:

```text
User
 ↓
Board
```

Every board belongs to one user.

---

# 8. Column Entity

```text
columns
-------------------------
id
name
position
boardId
createdAt
updatedAt
```

Example:

```ts
interface Column {
  id: string;
  name: string;
  position: number;
  boardId: string;
  createdAt: Date;
  updatedAt: Date;
}
```

Example columns:

```text
Todo
In Progress
Done
```

`position` controls column ordering.

Example:

```text
Todo          position = 1
In Progress   position = 2
Done          position = 3
```

---

# 9. Task Entity

```text
tasks
-------------------------
id
title
description
position
columnId
createdAt
updatedAt
```

Example:

```ts
interface Task {
  id: string;
  title: string;
  description?: string;
  position: number;
  columnId: string;
  createdAt: Date;
  updatedAt: Date;
}
```

`position` is important because tasks can be reordered using drag and drop.

Example:

```text
Todo

1 → Create login API
2 → Create JWT guard
3 → Create login page
```

---

# 10. Authentication Module

Responsibilities:

```text
Register
Login
Password hashing
JWT generation
JWT validation
Authentication guard
Current user
```

Endpoints:

```http
POST /api/auth/register

POST /api/auth/login

GET /api/auth/me
```

Register payload:

```json
{
  "name": "Jay",
  "email": "jay@example.com",
  "password": "password123"
}
```

Login payload:

```json
{
  "email": "jay@example.com",
  "password": "password123"
}
```

Login response:

```json
{
  "accessToken": "jwt-token",
  "user": {
    "id": "user-id",
    "name": "Jay",
    "email": "jay@example.com"
  }
}
```

---

# 11. Users Module

Responsibilities:

```text
Get current user
Get user profile
Update profile
```

Endpoints:

```http
GET /api/users/me

PATCH /api/users/me
```

Example response:

```json
{
  "id": "user-id",
  "name": "Jay",
  "email": "jay@example.com"
}
```

---

# 12. Boards Module

Responsibilities:

```text
Create board
List boards
Get board
Update board
Delete board
```

Endpoints:

```http
POST   /api/boards
GET    /api/boards
GET    /api/boards/:boardId
PATCH  /api/boards/:boardId
DELETE /api/boards/:boardId
```

Create board:

```json
{
  "name": "Development Board",
  "description": "Kanban board for development"
}
```

Response:

```json
{
  "id": "board-1",
  "name": "Development Board",
  "description": "Kanban board for development"
}
```

When creating a board, the backend can automatically create:

```text
Todo
In Progress
Done
```

Example:

```text
Development Board
│
├── Todo
├── In Progress
└── Done
```

---

# 13. Columns Module

Responsibilities:

```text
Create column
Update column
Delete column
Reorder columns
```

Endpoints:

```http
POST   /api/boards/:boardId/columns

PATCH  /api/columns/:columnId

DELETE /api/columns/:columnId

PATCH  /api/columns/reorder
```

Create column:

```json
{
  "name": "Review"
}
```

---

# 14. Tasks Module

Responsibilities:

```text
Create task
Get task
Update task
Delete task
Move task
Reorder tasks
```

Endpoints:

```http
POST   /api/columns/:columnId/tasks

GET    /api/tasks/:taskId

PATCH  /api/tasks/:taskId

DELETE /api/tasks/:taskId

PATCH  /api/tasks/:taskId/move

PATCH  /api/tasks/reorder
```

Create task:

```json
{
  "title": "Create login API",
  "description": "Implement JWT based login"
}
```

---

# 15. Moving Tasks

Suppose the board contains:

```text
Todo
----------------
Create login API
Create register API


In Progress
----------------
Create database


Done
----------------
Setup Nx
```

The user drags:

```text
Create login API
```

from:

```text
Todo
```

to:

```text
In Progress
```

Frontend sends:

```http
PATCH /api/tasks/:taskId/move
```

Payload:

```json
{
  "columnId": "in-progress-column-id",
  "position": 2
}
```

Backend updates:

```text
columnId
position
```

---

# 16. Board API

For the Board UI, avoid making many separate API requests.

Use:

```http
GET /api/boards/:boardId
```

Response:

```json
{
  "id": "board-1",
  "name": "Development Board",
  "columns": [
    {
      "id": "column-1",
      "name": "Todo",
      "position": 1,
      "tasks": [
        {
          "id": "task-1",
          "title": "Create login API",
          "position": 1
        },
        {
          "id": "task-2",
          "title": "Create register API",
          "position": 2
        }
      ]
    },
    {
      "id": "column-2",
      "name": "In Progress",
      "position": 2,
      "tasks": []
    },
    {
      "id": "column-3",
      "name": "Done",
      "position": 3,
      "tasks": []
    }
  ]
}
```

This allows the frontend to render the complete Kanban board from one API request.

---

# 17. Authentication Guard

Protected APIs should require JWT authentication.

Example:

```http
Authorization: Bearer <JWT>
```

Protected routes:

```text
/api/users/*
/api/boards/*
/api/columns/*
/api/tasks/*
```

Only these routes should remain public:

```text
POST /api/auth/register
POST /api/auth/login
```

---

# 18. Authorization

Authentication and authorization are different.

Authentication answers:

```text
Who is the user?
```

Authorization answers:

```text
Can this user access this board?
```

For example:

```text
User A
 └── Board A

User B
 └── Board B
```

User A must not be able to access:

```text
/api/boards/board-b
```

Every board operation should verify ownership.

Example logic:

```text
JWT
 ↓
userId
 ↓
Find Board
 ↓
board.userId === userId
 ↓
Allow request
```

---

# 19. Frontend Pages

Recommended Next.js routes:

```text
/
│
├── /login
│
├── /register
│
├── /dashboard
│
└── /boards/[boardId]
```

Example App Router structure:

```text
packages/kanban-dashboard/src/app/
│
├── page.tsx
│
├── login/
│   └── page.tsx
│
├── register/
│   └── page.tsx
│
├── dashboard/
│   └── page.tsx
│
└── boards/
    └── [boardId]/
        └── page.tsx
```

---

# 20. Frontend Flow

```text
Login/Register
       ↓
Authentication
       ↓
Dashboard
       ↓
List Boards
       ↓
Select Board
       ↓
Kanban Board
       ↓
Columns
       ↓
Tasks
       ↓
Drag & Drop
```

---

# 21. Dashboard

Example:

```text
-----------------------------------------

          Kanban Dashboard

-----------------------------------------

My Boards

┌───────────────────────┐
│ Development Board     │
│ 12 Tasks              │
└───────────────────────┘

┌───────────────────────┐
│ Personal Board        │
│ 5 Tasks               │
└───────────────────────┘

       + Create Board

-----------------------------------------
```

---

# 22. Board UI

Example:

```text
Development Board

┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐
│ Todo             │ │ In Progress      │ │ Done             │
│                  │ │                  │ │                  │
│ Create Login     │ │ Setup Database   │ │ Setup Nx         │
│                  │ │                  │ │                  │
│ Create Register  │ │                  │ │                  │
│                  │ │                  │ │                  │
│ + Add Task       │ │ + Add Task       │ │ + Add Task       │
└──────────────────┘ └──────────────────┘ └──────────────────┘
```

---

# 23. Frontend Components

Recommended component structure:

```text
components/
│
├── auth/
│   ├── login-form.tsx
│   └── register-form.tsx
│
├── board/
│   ├── board-card.tsx
│   ├── board-header.tsx
│   ├── board-column.tsx
│   └── board-list.tsx
│
├── task/
│   ├── task-card.tsx
│   ├── task-form.tsx
│   └── task-dialog.tsx
│
└── layout/
    ├── navbar.tsx
    └── sidebar.tsx
```

---

# 24. Drag and Drop

Use:

```text
@dnd-kit/core
@dnd-kit/sortable
```

Drag flow:

```text
User starts dragging
        ↓
Frontend updates UI
        ↓
User drops task
        ↓
Determine target column
        ↓
Determine new position
        ↓
Call move/reorder API
        ↓
Backend updates database
```

---

# 25. Shared Types

To share TypeScript interfaces/types between the Next.js frontend and NestJS backend without creating extra library projects:

We can define shared interfaces and DTO definitions in both applications, or place them in a shared directory inside one of the apps (e.g., as exports or a package reference) or keep them aligned manually.

Example interface:

```ts
export interface Task {
  id: string;
  title: string;
  description?: string;
  position: number;
  columnId: string;
}
```

Avoid sharing database entities directly with the frontend.

Share:

```text
DTO types
API response types
Enums
Constants
```

Do not share:

```text
TypeORM entities
Repositories
Backend services
```

---

# 26. Environment Variables

Backend:

```env
PORT=3001

DATABASE_URL=postgresql://postgres:postgres@localhost:5432/kanban

JWT_SECRET=change-me
JWT_EXPIRES_IN=1d
```

Frontend:

```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

Never commit real secrets into Git.

---

# 27. Initial Nx Setup

Create workspace:

```bash
pnpm dlx create-nx-workspace@latest kanban
```

Install NestJS and Next.js plugins:

```bash
pnpm nx add @nx/nest
pnpm nx add @nx/next
```

Generate backend:

```bash
pnpm exec nx g @nx/nest:app --name=kanban-api --directory=packages/kanban-api
```

Generate frontend:

```bash
pnpm exec nx g @nx/next:app --name=kanban-dashboard --directory=packages/kanban-dashboard
```

Result:

```text
packages/
├── kanban-api/
├── kanban-api-e2e/
├── kanban-dashboard/
└── kanban-dashboard-e2e/
```

---

# 28. Backend Dependencies

Install:

```bash
pnpm add @nestjs/typeorm typeorm pg
```

Authentication dependencies:

```bash
pnpm add @nestjs/jwt @nestjs/passport passport passport-jwt bcrypt
```

Validation:

```bash
pnpm add class-validator class-transformer
```

Development types:

```bash
pnpm add -D @types/bcrypt @types/passport-jwt
```

---

# 29. Frontend Dependencies

Install drag and drop:

```bash
pnpm add @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
```

UI can use:

```text
Tailwind CSS
shadcn/ui
```

---

# 30. Backend Folder Structure

```text
packages/kanban-api/src/app/
│
├── auth/
│   ├── auth.controller.ts
│   ├── auth.service.ts
│   ├── auth.module.ts
│   ├── dto/
│   ├── guards/
│   └── strategies/
│
├── users/
│   ├── users.controller.ts
│   ├── users.service.ts
│   ├── users.module.ts
│   └── entities/
│
├── boards/
│   ├── boards.controller.ts
│   ├── boards.service.ts
│   ├── boards.module.ts
│   ├── dto/
│   └── entities/
│
├── columns/
│   ├── columns.controller.ts
│   ├── columns.service.ts
│   ├── columns.module.ts
│   ├── dto/
│   └── entities/
│
└── tasks/
    ├── tasks.controller.ts
    ├── tasks.service.ts
    ├── tasks.module.ts
    ├── dto/
    └── entities/
```

---

# 31. Development Order

Build the application in this order.

## Phase 1 — Nx Setup

```text
Create Nx workspace
Create NestJS application
Create Next.js application
Configure PostgreSQL
Configure TypeORM
```

---

## Phase 2 — Authentication

Implement:

```text
User entity
Register
Login
Password hashing
JWT
JWT strategy
Auth guard
GET /auth/me
```

Test authentication completely before continuing.

---

## Phase 3 — Boards

Implement:

```text
Create board
List boards
Get board
Update board
Delete board
Board ownership validation
```

---

## Phase 4 — Columns

Implement:

```text
Create column
Update column
Delete column
Column position
Default columns
```

When creating a new board automatically create:

```text
Todo
In Progress
Done
```

---

## Phase 5 — Tasks

Implement:

```text
Create task
Update task
Delete task
Task position
Move task
Reorder task
```

---

## Phase 6 — Frontend Authentication

Build:

```text
Register Page
Login Page
Authentication state
Protected routes
Logout
```

---

## Phase 7 — Dashboard

Build:

```text
Board list
Create board
Edit board
Delete board
Open board
```

---

## Phase 8 — Board UI

Build:

```text
Board Header
Columns
Task cards
Create task
Edit task
Delete task
```

---

## Phase 9 — Drag & Drop

Implement:

```text
Drag task
Drop task
Move between columns
Reorder inside column
Persist position through API
```

---

# 32. MVP Features

For the first version only build:

- [ ] Register
- [ ] Login
- [ ] Logout
- [ ] JWT authentication
- [ ] Create board
- [ ] View boards
- [ ] Update board
- [ ] Delete board
- [ ] Default Todo column
- [ ] Default In Progress column
- [ ] Default Done column
- [ ] Create task
- [ ] Update task
- [ ] Delete task
- [ ] Move task
- [ ] Reorder task
- [ ] Drag & Drop
- [ ] Board ownership validation

Do not initially add unnecessary features such as:

```text
Organizations
Teams
RBAC
Permissions
Comments
Notifications
Attachments
Activity logs
WebSockets
Redis
Queues
Microservices
```

Those can be added later.

---

# 33. Final Architecture

```text
                        Browser
                           │
                           ▼
                    Next.js Dashboard
                           │
                           │ HTTP / REST
                           ▼
                       NestJS API
                           │
             ┌─────────────┼─────────────┐
             │             │             │
             ▼             ▼             ▼
           Auth          Boards         Tasks
             │             │             │
             └─────────────┼─────────────┘
                           │
                           ▼
                        TypeORM
                           │
                           ▼
                       PostgreSQL
```

Domain structure:

```text
User
 │
 └── Board
      │
      ├── Todo
      │    ├── Task
      │    └── Task
      │
      ├── In Progress
      │    └── Task
      │
      └── Done
           └── Task
```

---

# 34. Final Development Flow

The recommended development sequence is:

```text
Nx Setup
   ↓
Database
   ↓
User
   ↓
Authentication
   ↓
Board
   ↓
Column
   ↓
Task
   ↓
Backend Testing
   ↓
Frontend Authentication
   ↓
Dashboard
   ↓
Board UI
   ↓
Task CRUD
   ↓
Drag & Drop
   ↓
Final Testing
```

The main goal of the first version should be to keep the architecture **simple, modular, and easy to understand** while still following patterns that can scale as the application grows.