# DECP Frontend

This is the React/Vite frontend for the DECP Platform. It talks to the Spring Cloud API gateway and provides the browser experience for students, alumni/recruiters, and admins.

## Current Features

- Login, registration, logout, access-token refresh, and session expiry handling
- Role-aware navigation for `STUDENT`, `ALUMNI`, and `ADMIN`
- Dashboard shortcuts based on the signed-in user's role
- Feed post listing, details, creation, editing, deleting, likes, and comments
- Job listing, filtering, details, likes, comments, saved jobs, applications, recruiter dashboard, and application status updates
- Profile viewing and editing
- Notification list, unread counts, and read-state updates
- Admin role management for supported role assignments

## Environment

Create `decp-frontend/.env`:

```env
VITE_API_BASE_URL=http://localhost:8080
```

The frontend should call the API gateway, not individual backend services.

## Scripts

```powershell
npm install
npm run dev
npm run lint
npm run build
npm run preview
```

Vite commonly serves the local app at `http://localhost:5173`.

## Main Routes

| Route | Access |
| --- | --- |
| `/login`, `/register` | Public |
| `/dashboard`, `/feed`, `/jobs`, `/profile`, `/notifications` | Authenticated users |
| `/jobs/create`, `/jobs/:id/edit` | `ALUMNI`, `ADMIN` |
| `/jobs/:id/applications`, `/recruiter/dashboard` | `ALUMNI` |
| `/jobs/saved`, `/applications/me` | `STUDENT` |
| `/admin/roles` | `ADMIN` |

## Docker

The root `docker-compose.yml` builds this app from `decp-frontend/Dockerfile` and exposes it on port `5173`.
