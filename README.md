# DECP Platform

DECP Platform is a full-stack distributed employment and career platform built with a Spring Boot microservice backend and a React/Vite frontend. The backend is split into independent services for authentication, users, feed activity, jobs, notifications, and gateway routing. PostgreSQL is used per service, and Kafka is used for event-driven communication between job, feed, and notification workflows.

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
`-- system_test.md
```

## Tech Stack

- Backend: Java 17, Spring Boot, Spring Web MVC, Spring Security, Spring Data JPA
- Gateway: Spring Cloud Gateway WebFlux
- Frontend: React, Vite, Axios, React Router, Zustand
- Databases: PostgreSQL 16
- Messaging: Apache Kafka with Zookeeper
- Build tools: Maven Wrapper, npm
- Deployment support: Docker and Docker Compose

## Backend Services

| Service | Port | Responsibility |
| --- | ---: | --- |
| API Gateway | 8080 | Routes public API requests to backend services |
| Auth Service | 8081 | Registration, login, refresh tokens, logout, password reset, roles |
| User Service | 8082 | User profile registration, retrieval, and updates |
| Feed Service | 8083 | Feed posts, comments, likes, and job-feed synchronization |
| Job Service | 8084 | Jobs, saved jobs, applications, recruiter dashboard, status updates |
| Notification Service | 8085 | Notifications, unread counts, and read status |

## Main API Routes

Requests should normally go through the API gateway at `http://localhost:8080`.

| Route Prefix | Routed Service |
| --- | --- |
| `/auth/**` | Auth Service |
| `/users/**` | User Service |
| `/feed/**` | Feed Service |
| `/jobs/**` | Job Service |
| `/notifications/**` | Notification Service |

## Prerequisites

- Docker Desktop
- Java 17
- Node.js and npm
- Maven is optional because each backend service includes `mvnw` / `mvnw.cmd`

## Environment Variables

Each backend service loads variables from its own `.env` file:

```text
decp-backend/api-gateway/.env
decp-backend/auth-service/.env
decp-backend/user-service/.env
decp-backend/feed-service/.env
decp-backend/job-service/.env
decp-backend/notification-service/.env
```

Common backend variables:

```env
DB_USERNAME=postgres
DB_PASSWORD=your_password
JWT_SECRET=your_base64_encoded_secret
```

Auth service also supports mail and password reset configuration:

```env
MAIL_HOST=smtp.example.com
MAIL_PORT=587
MAIL_USERNAME=your_email@example.com
MAIL_PASSWORD=your_app_password
MAIL_SMTP_AUTH=true
MAIL_SMTP_STARTTLS_ENABLE=true
MAIL_FROM=your_email@example.com
APP_FRONTEND_RESET_URL=http://localhost:3000/reset-password
PASSWORD_RESET_TOKEN_EXPIRATION_MS=900000
```

The frontend API client reads:

```env
VITE_API_BASE_URL=http://localhost:8080
```

Create this in `decp-frontend/.env` when running the frontend locally.

## Run With Docker Compose

From the project root:

```powershell
docker compose up --build
```

This starts:

- Zookeeper on `2181`
- Kafka on `9092`
- PostgreSQL databases on `5433` to `5437`
- Backend services on `8080` to `8085`

Stop the stack:

```powershell
docker compose down
```

Remove containers and database volumes:

```powershell
docker compose down -v
```

## Run Frontend Locally

In a separate terminal:

```powershell
cd decp-frontend
npm install
npm run dev
```

The Vite app will start on the URL printed in the terminal, commonly `http://localhost:5173`.

## Run Backend Services Locally

Start PostgreSQL and Kafka first. The easiest way is to run the infrastructure with Docker Compose, then run individual services from their directories.

Example for the auth service on Windows:

```powershell
cd decp-backend/auth-service
.\mvnw.cmd spring-boot:run
```

Example for macOS/Linux:

```bash
cd decp-backend/auth-service
./mvnw spring-boot:run
```

Repeat from the matching service directory for:

- `api-gateway`
- `auth-service`
- `user-service`
- `feed-service`
- `job-service`
- `notification-service`

## Testing

Run backend tests from an individual service directory:

```powershell
.\mvnw.cmd test
```

Run frontend linting:

```powershell
cd decp-frontend
npm run lint
```

Build the frontend:

```powershell
npm run build
```

## Event Flow

The job service publishes Kafka events for job and application lifecycle changes. Feed and notification services consume these events to keep the activity feed and notification records in sync.

Important event types include:

- Job created
- Job updated
- Job closed
- Job applied
- Application status updated

## Database Layout

Each service owns its own PostgreSQL database:

| Database | Docker Host Port | Service |
| --- | ---: | --- |
| `decp_auth_db` | 5433 | Auth Service |
| `decp_user_db` | 5434 | User Service |
| `decp_feed_db` | 5435 | Feed Service |
| `decp_job_db` | 5436 | Job Service |
| `decp_notification_db` | 5437 | Notification Service |

Spring JPA is currently configured with `ddl-auto: update`, so schemas are updated automatically during development.

## Notes

- Keep `.env` files out of version control because they contain database credentials, JWT secrets, and mail credentials.
- Use the API gateway URL from the frontend instead of calling backend services directly.
- If Docker containers fail to start, check that ports `2181`, `9092`, `5433-5437`, and `8080-8085` are free.
