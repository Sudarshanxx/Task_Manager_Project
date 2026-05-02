# TaskFlow – Team Task Manager

A full-stack collaborative task management web application built with **React**, **Node.js/Express**, and **SQLite**.

## Live Demo
> taskmanagerproject-production-a5cb.up.railway.app

---

## Features

- **JWT Authentication** – Signup / Login / Secure routes
- **Project Management** – Create projects, invite members, role-based access
- **Kanban Task Board** – To Do / In Progress / Done columns with drag-friendly layout
- **Role-Based Access Control** – Admin (full control) vs Member (view & update own tasks)
- **Dashboard** – Task stats, pie chart, bar chart, overdue count, my open tasks
- **RESTful API** – Clean, validated backend with proper error handling

---

## Tech Stack

| Layer      | Technology                        |
|------------|-----------------------------------|
| Frontend   | React 18, Vite, React Router v6   |
| Charts     | Recharts                          |
| HTTP       | Axios                             |
| Backend    | Node.js, Express 4                |
| Database   | SQLite (better-sqlite3)           |
| Auth       | JWT (jsonwebtoken), bcryptjs      |
| Deployment | Railway                           |

---

## Local Development Setup

### Prerequisites
- Node.js >= 18
- npm >= 8

### 1. Clone the repository
```bash
git clone https://github.com/yourusername/taskflow.git
cd taskflow
```

### 2. Setup Backend
```bash
cd backend
cp .env.example .env
# Edit .env: set JWT_SECRET to a long random string
npm install
npm run dev     # Runs on http://localhost:5000
```

### 3. Setup Frontend
```bash
cd frontend
cp .env.example .env
npm install
npm run dev     # Runs on http://localhost:5173
```

The frontend Vite dev server proxies `/api` requests to `localhost:5000` automatically.

---

## Environment Variables

### Backend (`backend/.env`)
| Variable       | Description                          | Example                  |
|----------------|--------------------------------------|--------------------------|
| `PORT`         | Server port                          | `5000`                   |
| `JWT_SECRET`   | Secret key for JWT signing           | `my-super-secret-key`    |
| `NODE_ENV`     | Environment                          | `production`             |
| `FRONTEND_URL` | Allowed CORS origin                  | `https://yourapp.up.railway.app` |
| `DB_PATH`      | Path for SQLite database file        | `./taskmanager.db`       |

### Frontend (`frontend/.env`)
| Variable        | Description                   | Example                          |
|-----------------|-------------------------------|----------------------------------|
| `VITE_API_URL`  | Backend URL (prod only)       | `https://yourapp.up.railway.app` |

---

## Deployment on Railway

### Step 1 – Push to GitHub
```bash
git init
git add .
git commit -m "initial commit"
git remote add origin https://github.com/yourusername/taskflow.git
git push -u origin main
```

### Step 2 – Create Railway Project
1. Go to [railway.app](https://railway.app) and sign in
2. Click **New Project → Deploy from GitHub repo**
3. Select your repository

### Step 3 – Set Environment Variables in Railway
In the Railway dashboard → your service → **Variables**, add:
```
JWT_SECRET=your-long-random-secret-here
NODE_ENV=production
PORT=5000
```

### Step 4 – Railway Build & Start
Railway will use `nixpacks.toml` to:
1. Install backend and frontend dependencies
2. Build the React frontend (`npm run build`)
3. Start `node backend/server.js` which serves both API and static frontend

### Step 5 – Get your URL
Railway provides a public URL like `https://taskflow-production.up.railway.app`.  
Set that as your `FRONTEND_URL` variable for CORS.

---

## API Endpoints

### Auth
| Method | Endpoint           | Description        |
|--------|--------------------|--------------------|
| POST   | `/api/auth/signup` | Register new user  |
| POST   | `/api/auth/login`  | Login, get JWT     |
| GET    | `/api/auth/me`     | Get current user   |

### Projects
| Method | Endpoint                          | Access        |
|--------|-----------------------------------|---------------|
| GET    | `/api/projects`                   | All members   |
| POST   | `/api/projects`                   | Any user      |
| GET    | `/api/projects/:id`               | Members only  |
| PUT    | `/api/projects/:id`               | Admin only    |
| DELETE | `/api/projects/:id`               | Admin only    |
| POST   | `/api/projects/:id/members`       | Admin only    |
| DELETE | `/api/projects/:id/members/:uid`  | Admin only    |

### Tasks
| Method | Endpoint       | Access                        |
|--------|----------------|-------------------------------|
| GET    | `/api/tasks?project_id=` | Project members     |
| POST   | `/api/tasks`   | Admin only                    |
| GET    | `/api/tasks/:id` | Project members             |
| PUT    | `/api/tasks/:id` | Admin (all fields) / Member (status only, own tasks) |
| DELETE | `/api/tasks/:id` | Admin only                  |

### Dashboard
| Method | Endpoint                    | Description           |
|--------|-----------------------------|-----------------------|
| GET    | `/api/dashboard`            | User overview stats   |
| GET    | `/api/dashboard/project/:id`| Per-project stats     |

---

## Database Schema

```
users           – id, name, email, password, created_at
projects        – id, name, description, created_by, created_at
project_members – id, project_id, user_id, role (admin|member), joined_at
tasks           – id, project_id, title, description, due_date, priority,
                  status, assigned_to, created_by, created_at, updated_at
```

---

## Project Structure

```
taskflow/
├── backend/
│   ├── db/database.js         # SQLite setup + schema
│   ├── middleware/auth.js      # JWT middleware
│   ├── routes/
│   │   ├── auth.js
│   │   ├── projects.js
│   │   ├── tasks.js
│   │   └── dashboard.js
│   ├── server.js
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── api/index.js        # Axios API client
│   │   ├── context/AuthContext.jsx
│   │   ├── components/
│   │   │   ├── Layout.jsx
│   │   │   └── TaskModal.jsx
│   │   ├── pages/
│   │   │   ├── AuthPage.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   ├── ProjectsPage.jsx
│   │   │   └── ProjectDetail.jsx
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   └── package.json
├── railway.json
├── nixpacks.toml
└── README.md
```

---

## Author
Built as a full-stack coding assessment demonstrating:
- REST API design with Express
- JWT-based authentication
- SQLite relational schema
- React SPA with protected routes
- Role-based access control
- Railway deployment
