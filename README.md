# Team Task Manager

Full-stack Team Task Manager app for creating projects, managing project members, assigning tasks, and tracking work across a dashboard and Kanban-style project boards.

## Features

- JWT authentication with signup and login
- Password hashing with bcrypt
- Project creation and membership management
- Project roles: `ADMIN` and `MEMBER`
- Admin-only project deletion, member management, and task creation/deletion
- Member task status updates for assigned tasks
- Dashboard totals, status counts, overdue tasks, and recent assigned tasks
- React Query-powered data fetching and cache invalidation
- Toast notifications for success and error states
- Railway-ready backend, frontend, and PostgreSQL deployment flow

## Tech Stack

- Backend: Node.js, Express.js, Prisma ORM, PostgreSQL
- Frontend: React, Vite, Tailwind CSS
- Auth: JWT, bcryptjs
- Data fetching: Axios, TanStack React Query
- UI helpers: react-hot-toast, lucide-react
- Deployment: Railway

## Project Structure

```txt
backend/
  prisma/
  src/
    controllers/
    middleware/
    routes/
    utils/
  server.js

frontend/
  src/
    api/
    components/
    context/
    hooks/
    pages/
    utils/
```

## Local Setup

### Prerequisites

- Node.js 20.x
- npm
- PostgreSQL database

### Backend

```bash
cd backend
npm install
copy .env.example .env
```

Update `backend/.env`:

```env
DATABASE_URL=postgresql://USER:PASSWORD@HOST:PORT/DATABASE
JWT_SECRET=replace_with_a_strong_secret
PORT=5000
```

Run migrations and start the API:

```bash
npx prisma migrate dev --name init
npm run dev
```

Backend runs at:

```txt
http://localhost:5000/api
```

### Frontend

```bash
cd frontend
npm install
copy .env.example .env
```

Update `frontend/.env`:

```env
VITE_API_URL=http://localhost:5000/api
```

Start the frontend:

```bash
npm run dev
```

Frontend runs at:

```txt
http://localhost:5173
```

## Environment Variables

### Backend

| Variable | Required | Description |
| --- | --- | --- |
| `DATABASE_URL` | Yes | PostgreSQL connection string used by Prisma |
| `JWT_SECRET` | Yes | Secret used to sign and verify JWTs |
| `PORT` | No | API server port. Defaults to `5000`; Railway sets this automatically |
| `NODE_ENV` | No | Set to `production` in deployment |

### Frontend

| Variable | Required | Description |
| --- | --- | --- |
| `VITE_API_URL` | Yes | Backend API base URL, for example `http://localhost:5000/api` |

## API Endpoints

### Auth

| Method | Path | Auth Required | Role Required | Description |
| --- | --- | --- | --- | --- |
| `POST` | `/api/auth/signup` | No | None | Create user account |
| `POST` | `/api/auth/login` | No | None | Login and receive JWT |

### Dashboard

| Method | Path | Auth Required | Role Required | Description |
| --- | --- | --- | --- | --- |
| `GET` | `/api/dashboard` | Yes | Any authenticated user | Get project/task summary for logged-in user |

### Projects

| Method | Path | Auth Required | Role Required | Description |
| --- | --- | --- | --- | --- |
| `POST` | `/api/projects` | Yes | Any authenticated user | Create project and add creator as admin |
| `GET` | `/api/projects` | Yes | Any authenticated user | List projects where user is a member |
| `GET` | `/api/projects/:projectId` | Yes | Project member | Get project with members and tasks |
| `DELETE` | `/api/projects/:projectId` | Yes | Project `ADMIN` | Delete project |
| `GET` | `/api/projects/:projectId/members` | Yes | Project member | List project members |
| `POST` | `/api/projects/:projectId/members` | Yes | Project `ADMIN` | Add member by email and role |
| `DELETE` | `/api/projects/:projectId/members/:memberId` | Yes | Project `ADMIN` | Remove project member |

### Tasks

| Method | Path | Auth Required | Role Required | Description |
| --- | --- | --- | --- | --- |
| `GET` | `/api/projects/:projectId/tasks` | Yes | Project member | List project tasks; supports `status` and `assigneeId` query filters |
| `POST` | `/api/projects/:projectId/tasks` | Yes | Project `ADMIN` | Create task |
| `GET` | `/api/projects/:projectId/tasks/:taskId` | Yes | Project member | Get single task with assignee info |
| `PATCH` | `/api/projects/:projectId/tasks/:taskId` | Yes | Project `ADMIN`, or assigned `MEMBER` for status-only update | Update task |
| `DELETE` | `/api/projects/:projectId/tasks/:taskId` | Yes | Project `ADMIN` | Delete task |

## Railway Deployment

### 1. Create Railway Project

1. Create a new Railway project.
2. Connect this GitHub repository.
3. Add a PostgreSQL plugin/service to the project.

### 2. PostgreSQL Addon

1. Open the PostgreSQL service in Railway.
2. Copy its `DATABASE_URL`.
3. Add that value to the backend service environment variables.

### 3. Backend Service

Create a Railway service from the `backend` directory.

Build command:

```bash
npm install && npx prisma generate && npx prisma migrate deploy
```

Start command:

```bash
node server.js
```

Environment variables:

```env
DATABASE_URL=<Railway PostgreSQL DATABASE_URL>
JWT_SECRET=<strong random secret>
NODE_ENV=production
```

`PORT` is set automatically by Railway. Do not hard-code it.

The backend also includes [backend/railway.json](backend/railway.json) with the same build and start commands.

### 4. Frontend Service

Create a Railway service from the `frontend` directory.

Build command:

```bash
npm install && npm run build
```

Output directory:

```txt
dist
```

Environment variables:

```env
VITE_API_URL=https://<your-backend-url>/api
```

Replace `<your-backend-url>` with the public Railway URL for the backend service.

### 5. Verify Deployment

1. Open the frontend URL.
2. Create an account from `/signup`.
3. Confirm dashboard loads.
4. Create a project.
5. Add members and tasks.
6. Confirm dashboard stats update.

## Screenshots

Add screenshots here:

- Login page
- Dashboard
- Projects list
- Project task board
- Members tab

