# DECP Platform

DECP is a distributed employment and career platform for students, alumni/recruiters, and admins. The current system combines a Spring Boot microservice backend, a Spring Cloud API gateway, Kafka-driven job events, per-service PostgreSQL databases, and a React/Vite frontend.

The application supports authentication, role-based access, user profiles, feed posts, job posting and applications, saved jobs, recruiter dashboards, notifications, and admin role management.

## Current System

```text
Browser
  |
  | http://localhost:5173
  v
React/Vite frontend
  |
  | VITE_API_BASE_URL=http://localhost:8080
  v
API Gateway :8080
  |-- /auth/**           -> Auth Service :8081
  |-- /users/**          -> User Service :8082
  |-- /feed/**           -> Feed Service :8083
  |-- /jobs/**           -> Job Service :8084
  `-- /notifications/**  -> Notification Service :8085

Kafka :9092 is used for job lifecycle events.
Each backend service owns its own PostgreSQL database.
```

## Project Structure

```text
decp-platform/
|-- decp-backend/
|   |-- api-gateway/
|   |-- auth-service/
|   |-- user-service/
|   |-- feed-service/
|   |-- job-service/
|   `-- notification-service/
|-- decp-frontend/
|-- docker-compose.yml
|-- CO528 Mini Project.pdf
`-- README.md
```

## Tech Stack

- Backend: Java 17, Spring Boot 4.0.5, Spring Web MVC, Spring Security, Spring Data JPA, Lombok
- Gateway: Spring Cloud Gateway WebFlux, Spring Cloud 2025.1.1
- Frontend: React 19, Vite 8, React Router 7, Axios, React Hook Form, Zod, TanStack Query, Zustand, Lucide React
- Databases: PostgreSQL 16, one database per service
- Messaging: Apache Kafka with Zookeeper
- Build and runtime: Maven Wrapper, npm, Docker, Docker Compose

## Services

| Service | Port | Main Responsibility |
| --- | ---: | --- |
| API Gateway | 8080 | Routes public API traffic, validates JWTs, applies gateway RBAC |
| Auth Service | 8081 | Registration, login, refresh-token rotation, logout, password changes, password reset backend support, role assignment |
| User Service | 8082 | User profile creation, current-profile lookup, profile updates, admin user lookup |
| Feed Service | 8083 | Feed posts, post comments, likes, and job-generated feed entries |
| Job Service | 8084 | Job listings, filters, saved jobs, likes, comments, applications, recruiter dashboards, status updates |
| Notification Service | 8085 | Notification lists, unread counts, read status, event-created notification records |
| Frontend | 5173 | Browser app for dashboard, feed, jobs, applications, profiles, notifications, and admin roles |

## Roles

The system uses three roles in JWTs and frontend route guards:

| Role | Capabilities |
| --- | --- |
| `STUDENT` | Browse jobs, save jobs, apply to jobs, create feed posts, manage own profile, view notifications |
| `ALUMNI` | Create and manage job posts, review applications, update application status, create feed posts |
| `ADMIN` | Manage supported role assignments, view admin routes, create jobs, moderate feed content |

New registrations are created as `STUDENT`. Admin role assignment currently supports assigning `STUDENT` or `ALUMNI` to existing users.

## API Routes

Use the gateway base URL for frontend and API clients:

```text
http://localhost:8080
```

| Area | Routes |
| --- | --- |
| Auth | `POST /auth/register`, `POST /auth/login`, `POST /auth/refresh`, `POST /auth/logout`, `PUT /auth/me/password`, `POST /auth/forgot-password`, `POST /auth/reset-password`, `PUT /auth/admin/role` |
| Users | `POST /users/register`, `GET /users/me`, `PUT /users/me`, `GET /users/{id}` |
| Feed | `GET /feed/posts`, `POST /feed/posts`, `GET /feed/posts/{id}`, `PUT /feed/posts/{id}`, `DELETE /feed/posts/{id}`, `POST /feed/posts/{id}/like`, post comments |
| Jobs | `GET /jobs`, `POST /jobs`, `GET /jobs/{id}`, `PUT /jobs/{id}`, save/unsave, like, comments, close, apply, applications, recruiter dashboard |
| Notifications | `GET /notifications`, `GET /notifications/unread`, `GET /notifications/unread/count`, `PATCH /notifications/{id}/read`, `PATCH /notifications/read-all` |

`/auth/**` and CORS preflight requests are public. Other gateway routes expect `Authorization: Bearer <accessToken>`. The gateway also restricts sensitive actions, such as job creation, job applications, feed post creation, admin user lookup, and notification access.

## Kafka Events

The job service publishes job and application events. Feed and notification services consume those events to keep activity and notifications synchronized.

| Topic | Publisher | Consumers |
| --- | --- | --- |
| `job.created` | Job Service | Feed Service, Notification Service |
| `job.updated` | Job Service | Feed Service |
| `job.closed` | Job Service | Feed Service, Notification Service |
| `job.applied` | Job Service | Notification Service |
| `application.status.updated` | Job Service | Notification Service |

## Databases

Docker Compose starts one PostgreSQL container per backend data service.

| Database | Compose Host Port | Owner |
| --- | ---: | --- |
| `decp_auth_db` | 5433 | Auth Service |
| `decp_user_db` | 5434 | User Service |
| `decp_feed_db` | 5435 | Feed Service |
| `decp_job_db` | 5436 | Job Service |
| `decp_notification_db` | 5437 | Notification Service |

Spring JPA is configured with `ddl-auto: update` for development.

## Prerequisites

- Docker Desktop
- Java 17
- Node.js 22 or newer for the frontend Docker image parity
- npm
- Maven is optional because each backend service includes `mvnw` and `mvnw.cmd`

## Environment Setup

Docker Compose expects `.env` files to exist before the first run. Keep all `.env` files out of version control.

Use the same `JWT_SECRET` value in every backend service that reads or validates tokens. Use at least 32 characters.

Create `decp-backend/api-gateway/.env`:

```env
JWT_SECRET=replace_with_the_same_32_plus_character_secret
```

Create `decp-backend/auth-service/.env`:

```env
DB_USERNAME=postgres
DB_PASSWORD=postgres
JWT_SECRET=replace_with_the_same_32_plus_character_secret
MAIL_HOST=localhost
MAIL_PORT=1025
MAIL_USERNAME=
MAIL_PASSWORD=
MAIL_SMTP_AUTH=false
MAIL_SMTP_STARTTLS_ENABLE=false
MAIL_FROM=no-reply@decp.local
APP_FRONTEND_RESET_URL=http://localhost:5173/reset-password
PASSWORD_RESET_TOKEN_EXPIRATION_MS=900000
```

Create these files with the same values for each data service:

```text
decp-backend/user-service/.env
decp-backend/feed-service/.env
decp-backend/job-service/.env
decp-backend/notification-service/.env
```

```env
DB_USERNAME=postgres
DB_PASSWORD=postgres
JWT_SECRET=replace_with_the_same_32_plus_character_secret
```

Create `decp-frontend/.env`:

```env
VITE_API_BASE_URL=http://localhost:8080
```

## Run Everything With Docker Compose

From the project root:

```powershell
docker compose up --build
```

Open:

- Frontend: `http://localhost:5173`
- API gateway: `http://localhost:8080`

Stop the stack:

```powershell
docker compose down
```

Remove containers and database volumes:

```powershell
docker compose down -v
```

## Run Frontend Locally

```powershell
cd decp-frontend
npm install
npm run dev
```

The app uses `VITE_API_BASE_URL`, so keep `decp-frontend/.env` pointed at the gateway.

## Run Backend Services Locally

You can run dependencies with Docker and services from your IDE or terminal. Start infrastructure first:

```powershell
docker compose up -d zookeeper kafka postgres-auth postgres-user postgres-feed postgres-job postgres-notification
```

When using the Compose databases from locally running Spring apps, set each service datasource URL to the matching host port:

| Service | Local datasource URL |
| --- | --- |
| Auth | `SPRING_DATASOURCE_URL=jdbc:postgresql://localhost:5433/decp_auth_db` |
| User | `SPRING_DATASOURCE_URL=jdbc:postgresql://localhost:5434/decp_user_db` |
| Feed | `SPRING_DATASOURCE_URL=jdbc:postgresql://localhost:5435/decp_feed_db` |
| Job | `SPRING_DATASOURCE_URL=jdbc:postgresql://localhost:5436/decp_job_db` |
| Notification | `SPRING_DATASOURCE_URL=jdbc:postgresql://localhost:5437/decp_notification_db` |

Feed, job, and notification services should also use:

```env
SPRING_KAFKA_BOOTSTRAP_SERVERS=localhost:9092
```

The auth service should use this when running outside Compose:

```env
USER_SERVICE_URL=http://localhost:8082
```

Run a service from its directory on Windows:

```powershell
cd decp-backend/auth-service
.\mvnw.cmd spring-boot:run
```

Run a service from its directory on macOS/Linux:

```bash
cd decp-backend/auth-service
./mvnw spring-boot:run
```

Repeat for `api-gateway`, `user-service`, `feed-service`, `job-service`, and `notification-service`.

## Frontend Routes

| Route | Access |
| --- | --- |
| `/login`, `/register` | Public |
| `/dashboard`, `/feed`, `/jobs`, `/profile`, `/notifications` | Authenticated users |
| `/jobs/create`, `/jobs/:id/edit` | `ALUMNI`, `ADMIN` |
| `/jobs/:id/applications`, `/recruiter/dashboard` | `ALUMNI` |
| `/jobs/saved`, `/applications/me` | `STUDENT` |
| `/admin/roles` | `ADMIN` |

## Testing And Checks

Run backend tests from a service directory:

```powershell
.\mvnw.cmd test
```

Run frontend linting and production build:

```powershell
cd decp-frontend
npm run lint
npm run build
```

## Notes

- Use the gateway URL from the frontend instead of calling backend services directly.
- If Compose fails early, check that every required `.env` file exists.
- If services cannot bind ports, check `2181`, `9092`, `5433-5437`, `8080-8085`, and `5173`.
- If authenticated requests fail, make sure all backend services share the exact same `JWT_SECRET`.
