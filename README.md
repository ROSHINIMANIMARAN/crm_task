# Manju Groups Real Estate CRM

A real-estate CRM for tracking leads, properties, bookings, follow-ups, sales activity, and reports. The project contains a React frontend and a separate Express/Prisma backend.

## Features

- Dashboard with lead stages, follow-ups, bookings, and property inventory.
- Lead, property, booking, and follow-up management screens.
- Role-based Admin and Sales Employee interface.
- Light and dark themes, Manju Groups branding, and responsive layouts.
- Local browser persistence for the current frontend data flows.
- A REST API backend using PostgreSQL, Prisma, and JWT authentication.

> **Data storage:** Current CRM screens use browser `localStorage` for much of their data. Changes are specific to that browser and are not synchronized across devices. The backend API is included as a separate service; not every frontend data flow currently uses it.

## Technology

- Frontend: React, TypeScript, Vite, Tailwind CSS, React Router, TanStack Query.
- Backend: Node.js, Express, TypeScript, Prisma.
- Database: PostgreSQL.

## Requirements

- Node.js and npm compatible with the installed Vite and backend dependencies.
- PostgreSQL, if running the backend API.

## Run the frontend

In PowerShell, from the project directory:

```powershell
Set-Location .\frontend
npm install
npm run dev
```

Open the Vite URL shown in the terminal (normally `http://localhost:5173`).

The frontend's `.env.example` contains `VITE_API_URL`. If you need to override the API URL, copy the example to `.env` and set the URL:

```powershell
Copy-Item .env.example .env
```

Do not commit `.env` files.

### Local sign-in accounts

The frontend's current local sign-in uses these development accounts:

| Role | Email | Password |
|---|---|---|
| Admin | `admin@estateflow.com` | `Admin@123` |
| Sales employee | `sales1@estateflow.com` | `Sales@123` |

These are development-only credentials, not production authentication. The frontend's current account checks are client-side and should not be treated as a security boundary.

## Run the backend API

Create a local environment file and configure a PostgreSQL connection and a unique JWT signing secret:

```powershell
Set-Location .\backend
Copy-Item .env.example .env
```

Edit `backend/.env` with values appropriate for your machine. For local development, set `NODE_ENV=development`. Replace the example `JWT_SECRET` with a long, random value. Keep `.env` private and out of version control.

Install dependencies, generate the Prisma client, and synchronize the database schema:

```powershell
npm install
npm run db:generate
npm run db:push
```

Optionally load the bundled sample database data:

```powershell
npm run db:seed
```

> **Warning:** The seed script clears existing CRM records before inserting sample data. Use it only with a disposable or empty database.

Start the backend in development mode:

```powershell
npm run dev
```

The API listens on `http://localhost:3001` by default. Check that it is responding at `http://localhost:3001/api/health`.

The Vite development server proxies `/api` requests to this backend. Set `FRONTEND_URL` in `backend/.env` to the frontend's origin if it differs from `http://localhost:5173`.

## Build

Build/type-check the frontend:

```powershell
Set-Location .\frontend
npm run build
```

Build the backend:

```powershell
Set-Location .\backend
npm run build
```

## Backend API areas

The Express API mounts routes under `/api` for:

- Authentication: `/auth`
- Users: `/users`
- Leads: `/leads`
- Projects, buildings, and units: `/projects`, `/buildings`, `/units`
- Bookings: `/bookings`
- Follow-ups: `/follow-ups`
- Dashboard and reports: `/dashboard`, `/reports`
- Health check: `/health`

## Security notes

- Never commit `.env` files, database passwords, or production signing secrets.
- Replace example credentials and secrets before deployment.
- The local frontend's client-side role checks do not provide backend authorization.
- Do not use the sample seed data or `db:reset` against a database containing data you need to keep.
