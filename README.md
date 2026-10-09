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

## Deploy to Vercel

The frontend and API are separate applications, so deploy them as **two Vercel projects** from this repository. No database is provisioned by this configuration; provide an existing PostgreSQL database.

### 1. Deploy the backend

Create a Vercel project connected to this repository and set its **Root Directory** to `backend`. Leave framework/build settings at their detected defaults unless Vercel requests a build command; the project build command is `npm run build`. Vercel supplies the runtime port.

Configure these backend environment variables for each Vercel environment you deploy:

| Variable | Value |
|---|---|
| `DATABASE_URL` | Connection string for your existing PostgreSQL database. Use the provider's serverless-compatible connection URL when applicable. |
| `JWT_SECRET` | A unique, long, randomly generated production signing secret. |
| `FRONTEND_URL` | Exact deployed frontend origin(s), comma-separated if allowing more than one; for example `https://your-frontend.vercel.app`. Do not include `/api` or a trailing path. |
| `NODE_ENV` | `production` |

The Express API is mounted under `/api`; the health endpoint is `/api/health`. After deployment, verify that the backend project's `/api/health` URL returns JSON with `"status":"ok"`. Ensure the existing database schema is synchronized before using data-backed API routes; do not run the sample seed script against a database containing data you need.

### 2. Deploy the frontend

Create a second Vercel project from the same repository and set its **Root Directory** to `frontend`. Use Vercel's Vite defaults: build command `npm run build`, output directory `dist`. The included `frontend/vercel.json` sends client-side routes to the SPA entry point.

Set `VITE_API_URL` in the frontend project's Vercel environment variables to the deployed backend base URL ending in `/api`, such as `https://your-backend.vercel.app/api`. Set it for Production and any Preview environments that should call the backend. This value is public frontend configuration, not a secret.

Deploy the backend first, then set the frontend's `VITE_API_URL` and deploy the frontend. If using a custom frontend domain, add its exact origin to the backend's `FRONTEND_URL` and redeploy the backend.

### Local-only repository changes

These instructions and files prepare the repository for Vercel, but do not themselves create Vercel projects or deploy the application. Push the changes to GitHub, configure both Vercel projects and their environment variables, then deploy and verify `/api/health`. No `.env` file or production credential should be committed.

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
