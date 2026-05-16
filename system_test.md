# DECP Platform System Tests - Thunder Client

## 1. System Overview

DECP Platform is a Spring Boot microservices backend for authentication, user profiles, job posting and applications, feed activity, and persistent notifications.

- Architecture: API Gateway plus independent Spring Boot services.
- Services: API Gateway, Auth Service, User Service, Job Service, Feed Service, Notification Service.
- Databases: one PostgreSQL database/container per service.
- Kafka: async events from Job Service to Feed Service and Notification Service.
- Auth model: JWT access tokens plus persisted refresh tokens with rotation.
- RBAC location: the API Gateway enforces most route-level role rules. Downstream services also extract JWT claims from the `Authorization` header for ownership and recipient checks.
- Local startup:

```bash
docker compose up --build
```

## 2. Services and Local Ports

| Component | Container | Local URL / Port | Notes |
|---|---|---:|---|
| API Gateway | `decp-api-gateway` | `http://localhost:8080` | Preferred test base URL |
| Auth Service | `decp-auth-service` | `http://localhost:8081` | Routed by `/auth/**` |
| User Service | `decp-user-service` | `http://localhost:8082` | Routed by `/users/**` |
| Feed Service | `decp-feed-service` | `http://localhost:8083` | Routed by `/feed/**` |
| Job Service | `decp-job-service` | `http://localhost:8084` | Routed by `/jobs/**` |
| Notification Service | `decp-notification-service` | `http://localhost:8085` | Routed by `/notifications/**` |
| Kafka | `decp-kafka` | `localhost:9092` | Docker internal listener is `kafka:29092` |
| Zookeeper | `decp-zookeeper` | `localhost:2181` | Kafka coordination |
| Auth PostgreSQL | `decp-postgres-auth` | `localhost:5433` | DB `decp_auth_db` |
| User PostgreSQL | `decp-postgres-user` | `localhost:5434` | DB `decp_user_db` |
| Feed PostgreSQL | `decp-postgres-feed` | `localhost:5435` | DB `decp_feed_db` |
| Job PostgreSQL | `decp-postgres-job` | `localhost:5436` | DB `decp_job_db` |
| Notification PostgreSQL | `decp-postgres-notification` | `localhost:5437` | DB `decp_notification_db` |

## 3. Thunder Client Environment

Create an environment named `DECP Local`.

| Variable | Value |
|---|---|
| `baseUrl` | `http://localhost:8080` |
| `authUrl` | `http://localhost:8081` |
| `userUrl` | `http://localhost:8082` |
| `jobUrl` | `http://localhost:8084` |
| `feedUrl` | `http://localhost:8083` |
| `notificationUrl` | `http://localhost:8085` |
| `studentEmail` | `student1@decp.local` |
| `studentPassword` | `Password123!` |
| `studentToken` | saved from login/refresh |
| `studentRefreshToken` | saved from login/refresh |
| `oldStudentRefreshToken` | saved before refresh rotation test |
| `secondStudentEmail` | `student2@decp.local` |
| `secondStudentPassword` | `Password123!` |
| `secondStudentToken` | saved from second student login/refresh |
| `secondStudentRefreshToken` | saved from second student login/refresh |
| `alumniEmail` | `alumni1@decp.local` |
| `alumniPassword` | `Password123!` |
| `alumniToken` | saved from login after role assignment |
| `alumniRefreshToken` | saved from login/refresh |
| `adminEmail` | `admin1@decp.local` |
| `adminPassword` | `Password123!` |
| `adminToken` | saved from login after manual DB bootstrap |
| `adminRefreshToken` | saved from login/refresh |
| `studentUserId` | saved from `GET /users/me` |
| `alumniUserId` | saved from `GET /users/me` |
| `adminUserId` | saved from `GET /users/me` |
| `jobId` | saved from alumni job creation |
| `adminJobId` | saved from admin job creation |
| `closeTestJobId` | saved from close-test job creation |
| `enrichedJobId` | saved from enriched alumni job creation |
| `savedJobId` | usually same as `jobId` |
| `applicationId` | saved from student application |
| `postId` | saved from feed list or created post |
| `studentPostId` | saved from student post creation |
| `alumniPostId` | saved from alumni post creation |
| `manualPostId` | saved from manual feed post creation |
| `jobGeneratedPostId` | saved from a feed post where `sourceType = JOB` |
| `commentId` | saved from comment creation |
| `studentNotificationId` | saved from student notifications |
| `alumniNotificationId` | saved from alumni notifications |
| `missingId` | `999999` |

## 4. Important Notes

- Run normal tests through the API Gateway using `{{baseUrl}}`; gateway RBAC is part of the real system behavior.
- Protected gateway routes require `Authorization: Bearer <accessToken>`.
- Refresh tokens are used only with `POST /auth/refresh` and `POST /auth/logout`.
- Access tokens expire after 30 minutes by default.
- Refresh tokens rotate after successful refresh; replace both saved tokens after refresh.
- `POST /auth/register` always creates an auth user with role `STUDENT`.
- There is no first-admin endpoint. Bootstrap the admin by manually updating the auth database user role to `ADMIN`, then log in again.
- `PUT /auth/admin/role` updates only the auth-service user role. Re-login the target user to receive a token with the new role.
- Auth role assignment accepts `STUDENT`, `ALUMNI`, and `ADMIN` as syntactically valid roles, but the current code rejects assigning `ADMIN` through the endpoint. There is no endpoint that assigns `RECRUITER`.
- Job Service recognizes `RECRUITER` in downstream service logic, but the Auth Service and Gateway currently do not issue or fully authorize `RECRUITER` tokens. Use `ALUMNI` as the recruiter role in tests.
- Kafka-driven feed posts and notifications may need a short delay before verification.
- Tests should be run in order because later tests reuse tokens and IDs.
- Registration only collects account credentials and display name: `email`, `password`, and `name`.
- Richer profile fields are completed later using `PUT /users/me`. This keeps registration simple and avoids forcing profile completion before login.
- User Service profile responses include basic fields plus optional rich profile fields: `bio`, `university`, `degree`, `graduationYear`, `skills`, `linkedinUrl`, `githubUrl`, and `profileImageUrl`.
- Job post creation requires the full job detail payload: title, description, company, location, job type, work mode, salary range, application deadline, requirements, responsibilities, skills, and experience level.
- `applicationDeadline` is informational in the current Job Service behavior; applying to jobs is still controlled by job `status`.
- Job Service validates create-job roles internally from JWT claims, so direct `{{jobUrl}}/jobs` calls are also protected.
- The `job.created` Kafka event includes job detail fields so Feed Service can create richer job-feed posts; Notification Service still uses the title and poster for its notification message.
- The `job.updated` Kafka event updates the existing linked feed post; it does not create a new feed post and does not create a notification.
- The `job.closed` Kafka event is published when a job transitions from `OPEN` to `CLOSED`.
- Job-created feed posts have `sourceType = JOB` and `sourceId = jobId`; manual feed posts have `sourceType = MANUAL` and `sourceId = null`.
- Job-generated feed posts cannot be edited manually through `PUT /feed/posts/{id}`. Close or update the original job workflow instead.
- Notification read state is per user. Role-targeted notifications remain visible to all users of that role, and one user's read action does not mark the row read for everyone.

## 5. Verified Endpoint Inventory

| Service | Method | Path | Request Body | Response Body |
|---|---|---|---|---|
| Auth | POST | `/auth/register` | `{email,password,name}` | text `"User registered successfully"` |
| Auth | POST | `/auth/login` | `{email,password}` | `{accessToken,refreshToken,tokenType}` |
| Auth | POST | `/auth/refresh` | `{refreshToken}` | `{accessToken,refreshToken,tokenType}` |
| Auth | POST | `/auth/logout` | `{refreshToken}` | `{message}` |
| Auth | PUT | `/auth/admin/role` | `{email,role}` | `{userId,email,role,message}` or text error |
| User | POST | `/users/register` | `{email,name,role}` | `UserProfileResponse` |
| User | GET | `/users/me` | none | `UserProfileResponse` |
| User | PUT | `/users/me` | optional profile fields | `UserProfileResponse` |
| User | GET | `/users/{id}` | none | `UserProfileResponse` |
| Job | POST | `/jobs` | full `CreateJobRequest` | `JobResponse` |
| Job | GET | `/jobs` | optional filters: `keyword`, `status`, `postedByEmail`, `jobType`, `workMode`, `location`, `experienceLevel` | Spring `Page<JobResponse>` |
| Job | PUT | `/jobs/{id}` | full `UpdateJobRequest` | `JobResponse` |
| Job | POST | `/jobs/{id}/save` | none | `JobResponse` |
| Job | DELETE | `/jobs/{id}/save` | none | no body |
| Job | GET | `/jobs/saved` | query params | Spring `Page<JobResponse>` |
| Job | GET | `/jobs/recruiter/dashboard` | none | `RecruiterDashboardResponse` |
| Job | PATCH | `/jobs/{id}/close` | none | `JobResponse` |
| Job | POST | `/jobs/{id}/apply` | none | `JobApplicationResponse` |
| Job | GET | `/jobs/{id}/applications` | none | `JobApplicationResponse[]` |
| Job | GET | `/jobs/applications/me` | none | `JobApplicationResponse[]` |
| Job | PATCH | `/jobs/applications/{id}/status` | `{status}` | `JobApplicationResponse` |
| Feed | POST | `/feed/posts` | `{content}` | `{id,content,authorEmail,likes,createdAt,sourceType,sourceId}` |
| Feed | GET | `/feed/posts` | query params | Spring `Page<PostResponse>` |
| Feed | PUT | `/feed/posts/{id}` | `{content}` | `PostResponse` |
| Feed | DELETE | `/feed/posts/{id}` | none | no body |
| Feed | POST | `/feed/posts/{id}/like` | none | `PostResponse` |
| Feed | POST | `/feed/posts/{id}/comments` | `{content}` | `{id,postId,authorEmail,content,createdAt}` |
| Feed | GET | `/feed/posts/{id}/comments` | none | `CommentResponse[]` |
| Notification | GET | `/notifications` | query params | Spring `Page<NotificationResponse>` |
| Notification | GET | `/notifications/unread` | none | `NotificationResponse[]` |
| Notification | GET | `/notifications/unread/count` | none | `{count}` |
| Notification | PATCH | `/notifications/{id}/read` | none | `NotificationResponse` |
| Notification | PATCH | `/notifications/read-all` | none | `NotificationResponse[]` |

Current endpoint count: 33.

## 6. Role Matrix

Use this matrix for gateway behavior through `{{baseUrl}}`.

| Endpoint / Workflow | STUDENT | ALUMNI / RECRUITER | ADMIN | Notes |
|---|---:|---:|---:|---|
| `POST /auth/register` | Yes | Yes | Yes | Public; creates `STUDENT` only |
| `POST /auth/login` | Yes | Yes | Yes | Public |
| `POST /auth/refresh` | Yes | Yes | Yes | Public; refresh token required |
| `POST /auth/logout` | Yes | Yes | Yes | Public; refresh token body |
| `PUT /auth/admin/role` | No | No | Yes | Controller validates token role `ADMIN` |
| `GET /users/me` | Yes | Yes | Yes | Authenticated |
| `PUT /users/me` | Yes | Yes | Yes | Authenticated; supports partial basic and rich profile updates |
| `POST /users/register` | Yes | Yes | Yes | Authenticated through gateway default allow |
| `GET /users/{id}` | No | No | Yes | Gateway allows only `ADMIN` |
| `POST /jobs` | No | Yes | Yes | Gateway allows `ALUMNI`, `ADMIN`; downstream does not re-check |
| `GET /jobs` | Yes | Yes | Yes | Authenticated |
| `PATCH /jobs/{id}/close` | No | Owner only | Any job | Downstream owner/admin rule |
| `POST /jobs/{id}/save` | Yes | No | No | Downstream requires `STUDENT` |
| `GET /jobs/saved` | Yes | No | No | Downstream requires `STUDENT` |
| `DELETE /jobs/{id}/save` | Yes | No | No | Missing saved record still returns 204 |
| `POST /jobs/{id}/apply` | Yes | No | No | Gateway and downstream require `STUDENT` |
| `GET /jobs/applications/me` | Yes | No | No | Downstream requires `STUDENT` |
| `GET /jobs/{id}/applications` | No | Owner only | No | Downstream requires `ALUMNI` or `RECRUITER`, then ownership |
| `PATCH /jobs/applications/{id}/status` | No | Owner only | No | Valid transitions only |
| `GET /jobs/recruiter/dashboard` | No | Yes | No | Downstream allows `ALUMNI` or `RECRUITER` only |
| `POST /feed/posts` | Yes | Yes | No | Gateway blocks admin create |
| `GET /feed/posts` | Yes | Yes | Yes | Authenticated |
| `PUT /feed/posts/{id}` | Owner only | Owner only | No | Current code forbids admin edits |
| `DELETE /feed/posts/{id}` | Owner only | Owner only | Yes | Current code allows admin delete |
| `POST /feed/posts/{id}/like` | Yes | Yes | Yes | Authenticated through gateway; downstream has no token requirement |
| `POST /feed/posts/{id}/comments` | Yes | Yes | Yes | Authenticated |
| `GET /feed/posts/{id}/comments` | Yes | Yes | Yes | Authenticated through gateway |
| `GET /notifications` | Yes | Yes | Yes | Gateway does not include `RECRUITER` |
| `GET /notifications/unread` | Yes | Yes | Yes | Recipient email or recipient role |
| `GET /notifications/unread/count` | Yes | Yes | Yes | Recipient email or recipient role |
| `PATCH /notifications/{id}/read` | Own/role notification | Own/role notification | Own/role notification | Service checks visibility |
| `PATCH /notifications/read-all` | Yes | Yes | Yes | Marks visible unread notifications |

## 7. Expected Error Format

Most downstream service handlers return:

```json
{
  "timestamp": "2026-05-16T10:30:00.000000",
  "status": 404,
  "error": "Not Found",
  "message": "Job not found with id: 999999"
}
```

Gateway authentication/RBAC failures return a smaller JSON object:

```json
{
  "error": "Missing or invalid Authorization header",
  "status": 401
}
```

`PUT /auth/admin/role` has custom controller branches that can return plain text errors such as `"Only ADMIN users can assign roles"`.

Common status codes:

- `200 OK`: successful reads, updates, login, refresh, create operations in most services.
- `201 Created`: `POST /users/register`.
- `204 No Content`: delete/unsave operations.
- `400 Bad Request`: invalid login, invalid enum/query parameter, invalid status transition, invalid role assignment.
- `401 Unauthorized`: missing/invalid JWT or invalid refresh token.
- `403 Forbidden`: role or ownership failure.
- `404 Not Found`: missing job, application, post, notification, or user.
- `409 Conflict`: duplicate saved job or duplicate job application.

## 8. Test Execution Order

1. Start Docker environment.
2. Register student, alumni candidate, and admin bootstrap user.
3. Bootstrap admin manually in `decp_auth_db`.
4. Login and save access/refresh tokens.
5. Assign alumni role and re-login alumni.
6. User profile tests.
7. Job creation/list/search/filter tests.
8. Job closing tests.
9. Saved jobs tests.
10. Application workflow tests.
11. Recruiter dashboard tests.
12. Feed tests.
13. Notification tests.
14. Auth refresh/logout tests.
15. Cross-service Kafka verification.

## 9. Request and Response DTO Reference

### Auth DTOs

`RegisterRequest`

```json
{
  "email": "{{studentEmail}}",
  "password": "{{studentPassword}}",
  "name": "Student One"
}
```

`LoginRequest`

```json
{
  "email": "{{studentEmail}}",
  "password": "{{studentPassword}}"
}
```

`AuthResponse`

```json
{
  "accessToken": "...",
  "refreshToken": "...",
  "tokenType": "Bearer"
}
```

`RefreshTokenRequest` and `LogoutRequest`

```json
{
  "refreshToken": "{{studentRefreshToken}}"
}
```

`RoleAssignmentRequest`

```json
{
  "email": "{{alumniEmail}}",
  "role": "ALUMNI"
}
```

`RoleAssignmentResponse`

```json
{
  "userId": 2,
  "email": "alumni1@decp.local",
  "role": "ALUMNI",
  "message": "Role updated successfully"
}
```

### User DTOs

`CreateUserRequest`

```json
{
  "email": "manual-user@decp.local",
  "name": "Manual User",
  "role": "STUDENT"
}
```

`UpdateUserRequest`

```json
{
  "name": "Student One Rich",
  "bio": "Backend engineering enthusiast",
  "university": "University of Peradeniya",
  "degree": "Computer Engineering",
  "graduationYear": 2027,
  "skills": ["Spring Boot", "Kafka", "PostgreSQL"],
  "linkedinUrl": "https://linkedin.com/in/student-one",
  "githubUrl": "https://github.com/student-one",
  "profileImageUrl": "https://example.com/student-one.jpg"
}
```

`UserProfileResponse`

```json
{
  "id": 1,
  "email": "student1@decp.local",
  "name": "Student One Rich",
  "role": "STUDENT",
  "bio": "Backend engineering enthusiast",
  "university": "University of Peradeniya",
  "degree": "Computer Engineering",
  "graduationYear": 2027,
  "skills": ["Spring Boot", "Kafka", "PostgreSQL"],
  "linkedinUrl": "https://linkedin.com/in/student-one",
  "githubUrl": "https://github.com/student-one",
  "profileImageUrl": "https://example.com/student-one.jpg"
}
```

### Job DTOs

`CreateJobRequest` / `UpdateJobRequest`

```json
{
  "title": "Associate Software Engineer",
  "description": "Backend role for recent graduates",
  "companyName": "DECP Tech",
  "location": "Colombo",
  "jobType": "FULL_TIME",
  "workMode": "HYBRID",
  "salaryRange": "LKR 120,000 - 180,000",
  "applicationDeadline": "2026-12-31",
  "requirements": "Basic knowledge of Java, REST APIs, and databases",
  "responsibilities": "Build and maintain backend services",
  "skillsRequired": ["Java", "Spring Boot", "PostgreSQL", "Kafka"],
  "experienceLevel": "ENTRY"
}
```

`JobResponse`

```json
{
  "id": 1,
  "title": "Associate Software Engineer",
  "description": "Backend role for recent graduates",
  "postedByEmail": "alumni1@decp.local",
  "companyName": "DECP Tech",
  "location": "Colombo",
  "jobType": "FULL_TIME",
  "workMode": "HYBRID",
  "salaryRange": "LKR 120,000 - 180,000",
  "applicationDeadline": "2026-12-31",
  "requirements": "Basic knowledge of Java, REST APIs, and databases",
  "responsibilities": "Build and maintain backend services",
  "skillsRequired": ["Java", "Spring Boot", "PostgreSQL", "Kafka"],
  "experienceLevel": "ENTRY",
  "status": "OPEN",
  "createdAt": "2026-05-16T10:30:00"
}
```

`UpdateApplicationStatusRequest`

```json
{
  "status": "REVIEWING"
}
```

`JobApplicationResponse`

```json
{
  "id": 1,
  "jobId": 1,
  "studentEmail": "student1@decp.local",
  "applicantEmail": "student1@decp.local",
  "appliedAt": "2026-05-16T10:30:00",
  "status": "APPLIED"
}
```

Allowed job statuses: `OPEN`, `CLOSED`.

Allowed job types: `INTERNSHIP`, `FULL_TIME`, `PART_TIME`, `CONTRACT`.

Allowed work modes: `ONSITE`, `REMOTE`, `HYBRID`.

Allowed experience levels: `ENTRY`, `MID`, `SENIOR`.

Allowed application statuses: `APPLIED`, `REVIEWING`, `SHORTLISTED`, `REJECTED`, `ACCEPTED`.

Allowed application transitions:

| Current | Allowed Next |
|---|---|
| `APPLIED` | `REVIEWING` |
| `REVIEWING` | `SHORTLISTED`, `REJECTED` |
| `SHORTLISTED` | `ACCEPTED`, `REJECTED` |
| `REJECTED` | none |
| `ACCEPTED` | none |

`RecruiterDashboardResponse`

```json
{
  "jobsPosted": 2,
  "openJobs": 1,
  "closedJobs": 1,
  "totalApplications": 1,
  "applied": 0,
  "reviewing": 0,
  "shortlisted": 0,
  "accepted": 1,
  "rejected": 0
}
```

### Feed DTOs

`CreatePostRequest` and `UpdateFeedPostRequest`

```json
{
  "content": "Sharing an interview preparation tip."
}
```

`PostResponse`

```json
{
  "id": 1,
  "content": "Sharing an interview preparation tip.",
  "authorEmail": "student1@decp.local",
  "likes": 0,
  "createdAt": "2026-05-16T10:30:00",
  "sourceType": "MANUAL",
  "sourceId": null
}
```

`CreateCommentRequest`

```json
{
  "content": "Thanks for sharing."
}
```

`CommentResponse`

```json
{
  "id": 1,
  "postId": 1,
  "authorEmail": "alumni1@decp.local",
  "content": "Thanks for sharing.",
  "createdAt": "2026-05-16T10:30:00"
}
```

### Notification DTOs

`NotificationResponse`

```json
{
  "id": 1,
  "title": "Backend Intern",
  "message": "New job posted: Backend Intern by alumni1@decp.local",
  "type": "JOB_CREATED",
  "isRead": false,
  "createdAt": "2026-05-16T10:30:00"
}
```

`UnreadNotificationCountResponse`

```json
{
  "count": 1
}
```

Visibility rules:

- A notification is visible when `recipientEmail` matches the authenticated user's email.
- A notification is visible when `recipientRole` matches the authenticated user's role.
- `isRead` is calculated per authenticated user from `notification_reads`.
- Unread queries return visible notifications without a read record for the authenticated user.
- Mark-one-read and mark-all-read create per-user read records and do not globally hide role notifications from other users.

## 10. Auth Service Tests

### A01 - Register Student

**Service:** Auth Service

**Purpose:** Validate public registration and default `STUDENT` role creation.

**Thunder Client Request**

- Method: `POST`
- URL: `{{baseUrl}}/auth/register`
- Headers: `Content-Type: application/json`
- Body:

```json
{
  "email": "{{studentEmail}}",
  "password": "{{studentPassword}}",
  "name": "Student One"
}
```

**Expected**

- Status: `200 OK`
- Body expectations: text `User registered successfully`
- Variables to save: none

**Notes**

- Also creates a User Service profile through the Auth Service client.

### A02 - Register Alumni Candidate

**Service:** Auth Service

**Purpose:** Register a second account that will later be promoted to `ALUMNI`.

**Thunder Client Request**

- Method: `POST`
- URL: `{{baseUrl}}/auth/register`
- Headers: `Content-Type: application/json`
- Body:

```json
{
  "email": "{{alumniEmail}}",
  "password": "{{alumniPassword}}",
  "name": "Alumni One"
}
```

**Expected**

- Status: `200 OK`
- Body expectations: text `User registered successfully`
- Variables to save: none

**Notes**

- Initial role is `STUDENT`; role assignment happens after admin bootstrap.

### A03 - Register Admin Bootstrap User

**Service:** Auth Service

**Purpose:** Create the account that will be manually changed to `ADMIN`.

**Thunder Client Request**

- Method: `POST`
- URL: `{{baseUrl}}/auth/register`
- Headers: `Content-Type: application/json`
- Body:

```json
{
  "email": "{{adminEmail}}",
  "password": "{{adminPassword}}",
  "name": "Admin One"
}
```

**Expected**

- Status: `200 OK`
- Body expectations: text `User registered successfully`
- Variables to save: none

**Notes**

- Manual bootstrap required before admin login:

```sql
UPDATE users SET role = 'ADMIN' WHERE email = '{{adminEmail}}';
```

### A04 - Login Student

**Service:** Auth Service

**Purpose:** Obtain a student access token and refresh token.

**Thunder Client Request**

- Method: `POST`
- URL: `{{baseUrl}}/auth/login`
- Headers: `Content-Type: application/json`
- Body:

```json
{
  "email": "{{studentEmail}}",
  "password": "{{studentPassword}}"
}
```

**Expected**

- Status: `200 OK`
- Body expectations: `accessToken`, `refreshToken`, `tokenType = Bearer`
- Variables to save: `studentToken = accessToken`, `studentRefreshToken = refreshToken`

**Notes**

- Use `studentToken` for protected student requests.

### A05 - Login Alumni Candidate Before Role Assignment

**Service:** Auth Service

**Purpose:** Confirm newly registered users authenticate before promotion.

**Thunder Client Request**

- Method: `POST`
- URL: `{{baseUrl}}/auth/login`
- Headers: `Content-Type: application/json`
- Body:

```json
{
  "email": "{{alumniEmail}}",
  "password": "{{alumniPassword}}"
}
```

**Expected**

- Status: `200 OK`
- Body expectations: token role claim is currently `STUDENT`
- Variables to save: optional temporary token only

**Notes**

- After `A12`, run the alumni login again and overwrite `alumniToken`.

### A06 - Login Admin

**Service:** Auth Service

**Purpose:** Obtain an admin token after manual DB bootstrap.

**Thunder Client Request**

- Method: `POST`
- URL: `{{baseUrl}}/auth/login`
- Headers: `Content-Type: application/json`
- Body:

```json
{
  "email": "{{adminEmail}}",
  "password": "{{adminPassword}}"
}
```

**Expected**

- Status: `200 OK`
- Body expectations: token role claim is `ADMIN`
- Variables to save: `adminToken = accessToken`, `adminRefreshToken = refreshToken`

**Notes**

- If the token is still `STUDENT`, repeat the manual DB update and login again.

### A07 - Refresh Student Access Token

**Service:** Auth Service

**Purpose:** Validate refresh token rotation.

**Thunder Client Request**

- Method: `POST`
- URL: `{{baseUrl}}/auth/refresh`
- Headers: `Content-Type: application/json`
- Body:

```json
{
  "refreshToken": "{{studentRefreshToken}}"
}
```

**Expected**

- Status: `200 OK`
- Body expectations: new `accessToken`, new `refreshToken`, `tokenType = Bearer`
- Variables to save: first copy current `studentRefreshToken` to `oldStudentRefreshToken`, then save `studentToken = accessToken`, `studentRefreshToken = refreshToken`

**Notes**

- The old refresh token is revoked during this request.

### A08 - Verify Old Refresh Token Fails After Rotation

**Service:** Auth Service

**Purpose:** Confirm rotated refresh tokens cannot be reused.

**Thunder Client Request**

- Method: `POST`
- URL: `{{baseUrl}}/auth/refresh`
- Headers: `Content-Type: application/json`
- Body:

```json
{
  "refreshToken": "{{oldStudentRefreshToken}}"
}
```

**Expected**

- Status: `401 Unauthorized`
- Body expectations: `message = Refresh token has been revoked`
- Variables to save: none

**Notes**

- Run only after `A07`.

### A09 - Logout Student

**Service:** Auth Service

**Purpose:** Revoke the current student refresh token.

**Thunder Client Request**

- Method: `POST`
- URL: `{{baseUrl}}/auth/logout`
- Headers: `Content-Type: application/json`
- Body:

```json
{
  "refreshToken": "{{studentRefreshToken}}"
}
```

**Expected**

- Status: `200 OK`
- Body expectations: `message = Logged out successfully`
- Variables to save: none

**Notes**

- Access tokens are stateless and are not revoked by this endpoint.

### A10 - Refresh After Logout Fails

**Service:** Auth Service

**Purpose:** Confirm logout revoked the refresh token.

**Thunder Client Request**

- Method: `POST`
- URL: `{{baseUrl}}/auth/refresh`
- Headers: `Content-Type: application/json`
- Body:

```json
{
  "refreshToken": "{{studentRefreshToken}}"
}
```

**Expected**

- Status: `401 Unauthorized`
- Body expectations: `message = Refresh token has been revoked`
- Variables to save: none

**Notes**

- Re-login the student after this test if later tests need a fresh token.

### A11 - Invalid Refresh Token Fails

**Service:** Auth Service

**Purpose:** Validate refresh token lookup failure.

**Thunder Client Request**

- Method: `POST`
- URL: `{{baseUrl}}/auth/refresh`
- Headers: `Content-Type: application/json`
- Body:

```json
{
  "refreshToken": "invalid-refresh-token"
}
```

**Expected**

- Status: `401 Unauthorized`
- Body expectations: `message = Invalid refresh token`
- Variables to save: none

**Notes**

- This test does not require an access token.

### A12 - Admin Assigns Alumni Role

**Service:** Auth Service

**Purpose:** Promote the alumni candidate to `ALUMNI`.

**Thunder Client Request**

- Method: `PUT`
- URL: `{{baseUrl}}/auth/admin/role`
- Headers: `Authorization: Bearer {{adminToken}}`, `Content-Type: application/json`
- Body:

```json
{
  "email": "{{alumniEmail}}",
  "role": "ALUMNI"
}
```

**Expected**

- Status: `200 OK`
- Body expectations: `email = {{alumniEmail}}`, `role = ALUMNI`, `message = Role updated successfully`
- Variables to save: none

**Notes**

- Re-login alumni after this test and save `alumniToken` plus `alumniRefreshToken`.
- User Service profile role is not synced by this endpoint; downstream authorization uses the JWT role.

### A13 - Non-Admin Cannot Assign Role

**Service:** Auth Service

**Purpose:** Validate controller-level admin check.

**Thunder Client Request**

- Method: `PUT`
- URL: `{{baseUrl}}/auth/admin/role`
- Headers: `Authorization: Bearer {{studentToken}}`, `Content-Type: application/json`
- Body:

```json
{
  "email": "{{alumniEmail}}",
  "role": "STUDENT"
}
```

**Expected**

- Status: `403 Forbidden`
- Body expectations: text `Only ADMIN users can assign roles`
- Variables to save: none

**Notes**

- This endpoint performs its own JWT validation because `/auth/**` is public at the gateway.

### A14 - Admin Cannot Assign Invalid Or Protected Role

**Service:** Auth Service

**Purpose:** Validate role assignment restrictions.

**Thunder Client Request**

- Method: `PUT`
- URL: `{{baseUrl}}/auth/admin/role`
- Headers: `Authorization: Bearer {{adminToken}}`, `Content-Type: application/json`
- Body:

```json
{
  "email": "{{studentEmail}}",
  "role": "RECRUITER"
}
```

**Expected**

- Status: `400 Bad Request`
- Body expectations: text contains `Invalid role`
- Variables to save: none

**Notes**

- A second protected-role check can use `"role": "ADMIN"` and should return `400 Bad Request`.

## 11. User Service Tests

### U01 - Get Own Student Profile

**Service:** User Service

**Purpose:** Fetch the authenticated user's profile from JWT email, including optional rich profile fields.

**Thunder Client Request**

- Method: `GET`
- URL: `{{baseUrl}}/users/me`
- Headers: `Authorization: Bearer {{studentToken}}`
- Body: none

**Expected**

- Status: `200 OK`
- Body expectations: response includes `id`, `email`, `name`, `role`, `bio`, `university`, `degree`, `graduationYear`, `skills`, `linkedinUrl`, `githubUrl`, and `profileImageUrl`
- Body expectations: `email = {{studentEmail}}`, `role = STUDENT`; rich fields may be `null`, and `skills` may be an empty array
- Variables to save: `studentUserId = id`

**Notes**

- If the profile does not exist, the service creates one with role `STUDENT`.

### U02 - Update Basic Profile Name

**Service:** User Service

**Purpose:** Validate supported profile update field.

**Thunder Client Request**

- Method: `PUT`
- URL: `{{baseUrl}}/users/me`
- Headers: `Authorization: Bearer {{studentToken}}`, `Content-Type: application/json`
- Body:

```json
{
  "name": "Student One Updated"
}
```

**Expected**

- Status: `200 OK`
- Body expectations: `name = Student One Updated`
- Variables to save: none

**Notes**

- Basic name updates remain supported; richer fields are optional.

### U03 - Update Rich Student Profile

**Service:** User Service

**Purpose:** Validate rich profile fields are updated after registration.

**Thunder Client Request**

- Method: `PUT`
- URL: `{{baseUrl}}/users/me`
- Headers: `Authorization: Bearer {{studentToken}}`, `Content-Type: application/json`
- Body:

```json
{
  "name": "Student One Rich",
  "bio": "Backend engineering enthusiast",
  "university": "University of Peradeniya",
  "degree": "Computer Engineering",
  "graduationYear": 2027,
  "skills": ["Spring Boot", "Kafka", "PostgreSQL"],
  "linkedinUrl": "https://linkedin.com/in/student-one",
  "githubUrl": "https://github.com/student-one",
  "profileImageUrl": "https://example.com/student-one.jpg"
}
```

**Expected**

- Status: `200 OK`
- Body expectations: `name = Student One Rich`
- Body expectations: `bio = Backend engineering enthusiast`
- Body expectations: `university = University of Peradeniya`
- Body expectations: `degree = Computer Engineering`
- Body expectations: `graduationYear = 2027`
- Body expectations: `skills = ["Spring Boot", "Kafka", "PostgreSQL"]`
- Body expectations: `linkedinUrl`, `githubUrl`, and `profileImageUrl` match the request
- Variables to save: none

**Notes**

- Rich profile fields are completed here, not during `POST /auth/register`.

### U04 - Partial Profile Update Preserves Existing Fields

**Service:** User Service

**Purpose:** Validate omitted fields remain unchanged during partial updates.

**Thunder Client Request**

- Method: `PUT`
- URL: `{{baseUrl}}/users/me`
- Headers: `Authorization: Bearer {{studentToken}}`, `Content-Type: application/json`
- Body:

```json
{
  "bio": "Updated bio only"
}
```

**Expected**

- Status: `200 OK`
- Body expectations: `bio = Updated bio only`
- Body expectations: existing `name`, `university`, `degree`, `graduationYear`, `skills`, `linkedinUrl`, `githubUrl`, and `profileImageUrl` remain unchanged from `U03`
- Variables to save: none

**Notes**

- Only non-null fields update existing values.

### U05 - Empty Skills List Clears Skills

**Service:** User Service

**Purpose:** Validate an explicit empty skills list clears existing skills.

**Thunder Client Request**

- Method: `PUT`
- URL: `{{baseUrl}}/users/me`
- Headers: `Authorization: Bearer {{studentToken}}`, `Content-Type: application/json`
- Body:

```json
{
  "skills": []
}
```

**Expected**

- Status: `200 OK`
- Body expectations: `skills = []`
- Body expectations: other existing profile fields remain unchanged
- Variables to save: none

**Notes**

- Omitted `skills` preserves existing skills; provided empty `skills` clears them.

### U06 - Invalid Graduation Year Returns 400

**Service:** User Service

**Purpose:** Validate graduation year validation rejects invalid values.

**Thunder Client Request**

- Method: `PUT`
- URL: `{{baseUrl}}/users/me`
- Headers: `Authorization: Bearer {{studentToken}}`, `Content-Type: application/json`
- Body:

```json
{
  "graduationYear": 1800
}
```

**Expected**

- Status: `400 Bad Request`
- Body expectations: message indicates invalid graduation year
- Variables to save: none

**Notes**

- A valid `graduationYear`, such as `2027`, is accepted.

### U07 - Admin Gets User By ID

**Service:** User Service

**Purpose:** Validate gateway-admin access to profile lookup by ID.

**Thunder Client Request**

- Method: `GET`
- URL: `{{baseUrl}}/users/{{studentUserId}}`
- Headers: `Authorization: Bearer {{adminToken}}`
- Body: none

**Expected**

- Status: `200 OK`
- Body expectations: `id = {{studentUserId}}`, `email = {{studentEmail}}`
- Body expectations: response includes richer profile fields `bio`, `university`, `degree`, `graduationYear`, `skills`, `linkedinUrl`, `githubUrl`, and `profileImageUrl`
- Variables to save: none

**Notes**

- The downstream controller itself has no role check; use the gateway for this test.

### U08 - Student Cannot Get User By ID Through Gateway

**Service:** User Service

**Purpose:** Validate gateway RBAC for admin-only lookup.

**Thunder Client Request**

- Method: `GET`
- URL: `{{baseUrl}}/users/{{adminUserId}}`
- Headers: `Authorization: Bearer {{studentToken}}`
- Body: none

**Expected**

- Status: `403 Forbidden`
- Body expectations: gateway error `Insufficient permissions for this resource`
- Variables to save: none

**Notes**

- Direct `{{userUrl}}/users/{id}` does not enforce this role rule.

### U09 - User Register Endpoint Still Exists

**Service:** User Service

**Purpose:** Validate the direct user creation endpoint exposed by User Service.

**Thunder Client Request**

- Method: `POST`
- URL: `{{baseUrl}}/users/register`
- Headers: `Authorization: Bearer {{adminToken}}`, `Content-Type: application/json`
- Body:

```json
{
  "email": "manual-user@decp.local",
  "name": "Manual User",
  "role": "STUDENT"
}
```

**Expected**

- Status: `201 Created`
- Body expectations: `email = manual-user@decp.local`, `name = Manual User`, `role = STUDENT`
- Body expectations: response includes richer profile fields; rich fields are `null` by default and `skills` is an empty array
- Variables to save: none

**Notes**

- Gateway currently allows any authenticated role to call this endpoint.
- This endpoint is used by Auth Service user-profile sync and accepts only basic profile data.

## 12. Job Service Tests

### J01 - Student Cannot Create Job

**Service:** Job Service

**Purpose:** Validate gateway RBAC for job creation.

**Thunder Client Request**

- Method: `POST`
- URL: `{{baseUrl}}/jobs`
- Headers: `Authorization: Bearer {{studentToken}}`, `Content-Type: application/json`
- Body:

```json
{
  "title": "Student Created Job",
  "description": "This should be blocked by the gateway",
  "companyName": "Student Company",
  "location": "Colombo",
  "jobType": "FULL_TIME",
  "workMode": "REMOTE",
  "salaryRange": "LKR 100,000 - 150,000",
  "applicationDeadline": "2026-12-31",
  "requirements": "This request should not reach Job Service through the gateway",
  "responsibilities": "Validate gateway RBAC before job creation",
  "skillsRequired": ["Spring Boot"],
  "experienceLevel": "ENTRY"
}
```

**Expected**

- Status: `403 Forbidden`
- Body expectations: gateway error `Insufficient permissions for this resource`
- Variables to save: none

**Notes**

- Gateway rejects this before the request reaches Job Service.
- Direct `{{jobUrl}}/jobs` is also rejected by Job Service internal JWT role validation.

### J-New-Role-01 - Direct Student Cannot Create Job

**Service:** Job Service

**Purpose:** Validate internal create-job role enforcement when bypassing the gateway.

**Thunder Client Request**

- Method: `POST`
- URL: `{{jobUrl}}/jobs`
- Headers: `Authorization: Bearer {{studentToken}}`, `Content-Type: application/json`
- Body:

```json
{
  "title": "Direct Student Job",
  "description": "Direct service request should still be blocked",
  "companyName": "Blocked Company",
  "location": "Colombo",
  "jobType": "FULL_TIME",
  "workMode": "REMOTE",
  "salaryRange": "LKR 100,000 - 150,000",
  "applicationDeadline": "2026-12-31",
  "requirements": "This should not create a job",
  "responsibilities": "Validate service-level authorization",
  "skillsRequired": ["Spring Boot"],
  "experienceLevel": "ENTRY"
}
```

**Expected**

- Status: `403 Forbidden`
- Body expectations: `message = Only alumni, recruiters, or admins can create jobs`
- Variables to save: none

**Notes**

- Job Service extracts email and role from the bearer token; it does not trust `X-User-Email` or `X-User-Role`.

### J02 - Alumni Creates Job

**Service:** Job Service

**Purpose:** Create the primary open job used by later tests.

**Thunder Client Request**

- Method: `POST`
- URL: `{{baseUrl}}/jobs`
- Headers: `Authorization: Bearer {{alumniToken}}`, `Content-Type: application/json`
- Body:

```json
{
  "title": "Backend Intern",
  "description": "Spring Boot and PostgreSQL internship",
  "companyName": "DECP Careers",
  "location": "Colombo",
  "jobType": "INTERNSHIP",
  "workMode": "HYBRID",
  "salaryRange": "LKR 60,000 - 90,000",
  "applicationDeadline": "2026-12-31",
  "requirements": "Basic Java, REST API, and SQL knowledge",
  "responsibilities": "Assist with backend service development and testing",
  "skillsRequired": ["Java", "Spring Boot", "PostgreSQL"],
  "experienceLevel": "ENTRY"
}
```

**Expected**

- Status: `200 OK`
- Body expectations: `title = Backend Intern`, `postedByEmail = {{alumniEmail}}`, `status = OPEN`
- Body expectations: response includes all required job detail fields from the request
- Variables to save: `jobId = id`, `savedJobId = id`

**Notes**

- Publishes Kafka topic `job.created`.
- All job detail fields are required for successful job creation.

### J03 - Admin Creates Job

**Service:** Job Service

**Purpose:** Validate admin job creation through gateway.

**Thunder Client Request**

- Method: `POST`
- URL: `{{baseUrl}}/jobs`
- Headers: `Authorization: Bearer {{adminToken}}`, `Content-Type: application/json`
- Body:

```json
{
  "title": "Platform Engineer",
  "description": "Admin-posted job for cross-role validation",
  "companyName": "DECP Platform",
  "location": "Remote",
  "jobType": "FULL_TIME",
  "workMode": "REMOTE",
  "salaryRange": "LKR 180,000 - 260,000",
  "applicationDeadline": "2026-12-31",
  "requirements": "Experience with distributed systems and cloud platforms",
  "responsibilities": "Maintain platform infrastructure and deployment workflows",
  "skillsRequired": ["Spring Boot", "Docker", "PostgreSQL"],
  "experienceLevel": "MID"
}
```

**Expected**

- Status: `200 OK`
- Body expectations: `postedByEmail = {{adminEmail}}`, `status = OPEN`
- Variables to save: `adminJobId = id`

**Notes**

- Admin can create and close jobs, but cannot manage applications as recruiter in current downstream service logic.

### J04 - Get Jobs With Pagination

**Service:** Job Service

**Purpose:** Validate paginated job listing.

**Thunder Client Request**

- Method: `GET`
- URL: `{{baseUrl}}/jobs?page=0&size=10&sort=createdAt,desc`
- Headers: `Authorization: Bearer {{studentToken}}`
- Body: none

**Expected**

- Status: `200 OK`
- Body expectations: Spring Page fields such as `content`, `pageable`, `totalElements`; content items are `JobResponse`
- Variables to save: none

**Notes**

- `GET /jobs` is authenticated through the gateway.

### J-Update-01 - Owning Alumni Updates Job

**Service:** Job Service

**Purpose:** Validate job owner can edit an open job through Job Service.

**Thunder Client Request**

- Method: `PUT`
- URL: `{{baseUrl}}/jobs/{{jobId}}`
- Headers: `Authorization: Bearer {{alumniToken}}`, `Content-Type: application/json`
- Body:

```json
{
  "title": "Backend Intern Updated",
  "description": "Updated Spring Boot and PostgreSQL internship",
  "companyName": "DECP Careers Updated",
  "location": "Colombo",
  "jobType": "INTERNSHIP",
  "workMode": "HYBRID",
  "salaryRange": "LKR 70,000 - 100,000",
  "applicationDeadline": "2026-12-31",
  "requirements": "Updated Java, REST API, and SQL knowledge",
  "responsibilities": "Assist with updated backend service development and testing",
  "skillsRequired": ["Java", "Spring Boot", "PostgreSQL", "Kafka"],
  "experienceLevel": "ENTRY"
}
```

**Expected**

- Status: `200 OK`
- Body expectations: `id = {{jobId}}`, `title = Backend Intern Updated`, `companyName = DECP Careers Updated`, `status = OPEN`
- Variables to save: none

**Notes**

- Publishes Kafka topic `job.updated`.
- Feed Service updates the existing linked job feed post instead of creating a new post.
- Notification Service does not consume `job.updated`.

### J-Update-02 - Alumni Cannot Update Another User's Job

**Service:** Job Service

**Purpose:** Validate job ownership enforcement.

**Thunder Client Request**

- Method: `PUT`
- URL: `{{baseUrl}}/jobs/{{adminJobId}}`
- Headers: `Authorization: Bearer {{alumniToken}}`, `Content-Type: application/json`
- Body:

```json
{
  "title": "Unauthorized Update",
  "description": "Alumni should not update admin job",
  "companyName": "Unauthorized Company",
  "location": "Remote",
  "jobType": "FULL_TIME",
  "workMode": "REMOTE",
  "salaryRange": "LKR 180,000 - 260,000",
  "applicationDeadline": "2026-12-31",
  "requirements": "Should be blocked",
  "responsibilities": "Should be blocked",
  "skillsRequired": ["Spring Boot"],
  "experienceLevel": "MID"
}
```

**Expected**

- Status: `403 Forbidden`
- Body expectations: `message = Cannot update another user's job`
- Variables to save: none

### J-Update-03 - Student Cannot Update Job

**Service:** Job Service

**Purpose:** Validate students cannot update job posts.

**Thunder Client Request**

- Method: `PUT`
- URL: `{{baseUrl}}/jobs/{{jobId}}`
- Headers: `Authorization: Bearer {{studentToken}}`, `Content-Type: application/json`
- Body:

```json
{
  "title": "Student Update Attempt",
  "description": "Student should not update jobs",
  "companyName": "Blocked Company",
  "location": "Colombo",
  "jobType": "INTERNSHIP",
  "workMode": "HYBRID",
  "salaryRange": "LKR 70,000 - 100,000",
  "applicationDeadline": "2026-12-31",
  "requirements": "Should be blocked",
  "responsibilities": "Should be blocked",
  "skillsRequired": ["Java"],
  "experienceLevel": "ENTRY"
}
```

**Expected**

- Status: `403 Forbidden`
- Body expectations: `message = Only admins, alumni, or recruiters can update jobs`
- Variables to save: none

### J-Update-04 - Admin Can Update Any Open Job

**Service:** Job Service

**Purpose:** Validate admin can edit an open job regardless of owner.

**Thunder Client Request**

- Method: `PUT`
- URL: `{{baseUrl}}/jobs/{{adminJobId}}`
- Headers: `Authorization: Bearer {{adminToken}}`, `Content-Type: application/json`
- Body:

```json
{
  "title": "Platform Engineer Updated",
  "description": "Admin-updated job for cross-role validation",
  "companyName": "DECP Platform",
  "location": "Remote",
  "jobType": "FULL_TIME",
  "workMode": "REMOTE",
  "salaryRange": "LKR 190,000 - 270,000",
  "applicationDeadline": "2026-12-31",
  "requirements": "Updated distributed systems and cloud platform experience",
  "responsibilities": "Maintain updated platform infrastructure and deployment workflows",
  "skillsRequired": ["Spring Boot", "Docker", "PostgreSQL", "Kafka"],
  "experienceLevel": "MID"
}
```

**Expected**

- Status: `200 OK`
- Body expectations: `id = {{adminJobId}}`, `title = Platform Engineer Updated`, `status = OPEN`
- Variables to save: none

### J05 - Search Jobs By Keyword

**Service:** Job Service

**Purpose:** Validate keyword search across title, description, and enriched text fields.

**Thunder Client Request**

- Method: `GET`
- URL: `{{baseUrl}}/jobs?keyword=Backend&page=0&size=10`
- Headers: `Authorization: Bearer {{studentToken}}`
- Body: none

**Expected**

- Status: `200 OK`
- Body expectations: at least one content item has title, description, companyName, location, requirements, or responsibilities containing `Backend`
- Variables to save: none

**Notes**

- Search is case-insensitive.

### J06 - Filter Jobs By Status OPEN

**Service:** Job Service

**Purpose:** Validate job status filtering.

**Thunder Client Request**

- Method: `GET`
- URL: `{{baseUrl}}/jobs?status=OPEN&page=0&size=10`
- Headers: `Authorization: Bearer {{studentToken}}`
- Body: none

**Expected**

- Status: `200 OK`
- Body expectations: content items have `status = OPEN`
- Variables to save: none

**Notes**

- The repository treats null status as open, though new jobs default to `OPEN`.

### J07 - Filter Jobs By PostedByEmail

**Service:** Job Service

**Purpose:** Validate recruiter/admin email filter.

**Thunder Client Request**

- Method: `GET`
- URL: `{{baseUrl}}/jobs?postedByEmail={{alumniEmail}}&page=0&size=10`
- Headers: `Authorization: Bearer {{studentToken}}`
- Body: none

**Expected**

- Status: `200 OK`
- Body expectations: content items have `postedByEmail = {{alumniEmail}}`
- Variables to save: none

**Notes**

- Matching is case-insensitive.

### J08 - Combined Filters

**Service:** Job Service

**Purpose:** Validate keyword, status, and poster filters together.

**Thunder Client Request**

- Method: `GET`
- URL: `{{baseUrl}}/jobs?keyword=Spring&status=OPEN&postedByEmail={{alumniEmail}}&page=0&size=10`
- Headers: `Authorization: Bearer {{studentToken}}`
- Body: none

**Expected**

- Status: `200 OK`
- Body expectations: matching content items satisfy all filters
- Variables to save: none

**Notes**

- Empty results are valid if test data differs.

### J09 - Invalid Status Returns 400

**Service:** Job Service

**Purpose:** Validate enum query parameter handling.

**Thunder Client Request**

- Method: `GET`
- URL: `{{baseUrl}}/jobs?status=ARCHIVED`
- Headers: `Authorization: Bearer {{studentToken}}`
- Body: none

**Expected**

- Status: `400 Bad Request`
- Body expectations: `message` contains `Invalid job status. Allowed values: OPEN, CLOSED`
- Variables to save: none

**Notes**

- Handled by Job Service `MethodArgumentTypeMismatchException`.

### J-New-01 - Alumni Creates Enriched Job

**Service:** Job Service

**Purpose:** Validate required enriched job details during job creation.

**Thunder Client Request**

- Method: `POST`
- URL: `{{baseUrl}}/jobs`
- Headers: `Authorization: Bearer {{alumniToken}}`, `Content-Type: application/json`
- Body:

```json
{
  "title": "Associate Software Engineer",
  "description": "Backend role for recent graduates",
  "companyName": "DECP Tech",
  "location": "Colombo",
  "jobType": "FULL_TIME",
  "workMode": "HYBRID",
  "salaryRange": "LKR 120,000 - 180,000",
  "applicationDeadline": "2026-12-31",
  "requirements": "Basic knowledge of Java, REST APIs, and databases",
  "responsibilities": "Build and maintain backend services",
  "skillsRequired": ["Java", "Spring Boot", "PostgreSQL", "Kafka"],
  "experienceLevel": "ENTRY"
}
```

**Expected**

- Status: `200 OK`
- Body expectations: response includes all enriched fields from the request
- Body expectations: `postedByEmail = {{alumniEmail}}`, `status = OPEN`
- Variables to save: `enrichedJobId = id`

**Notes**

- Job detail fields are required; this test verifies they are persisted and returned.

### J-New-02 - Get Jobs Includes Enriched Fields

**Service:** Job Service

**Purpose:** Validate paginated job listing returns enriched job fields.

**Thunder Client Request**

- Method: `GET`
- URL: `{{baseUrl}}/jobs?page=0&size=10`
- Headers: `Authorization: Bearer {{studentToken}}`
- Body: none

**Expected**

- Status: `200 OK`
- Body expectations: response content items include `companyName`, `location`, `jobType`, `workMode`, `salaryRange`, `applicationDeadline`, `requirements`, `responsibilities`, `skillsRequired`, and `experienceLevel`
- Variables to save: none

**Notes**

- Existing database rows from older builds may have `null` enriched fields, but new job creation requires all detail fields.

### J-New-03 - Filter By Job Type

**Service:** Job Service

**Purpose:** Validate `jobType` filtering.

**Thunder Client Request**

- Method: `GET`
- URL: `{{baseUrl}}/jobs?jobType=FULL_TIME&page=0&size=10`
- Headers: `Authorization: Bearer {{studentToken}}`
- Body: none

**Expected**

- Status: `200 OK`
- Body expectations: returned content items have `jobType = FULL_TIME`
- Variables to save: none

### J-New-04 - Filter By Work Mode

**Service:** Job Service

**Purpose:** Validate `workMode` filtering.

**Thunder Client Request**

- Method: `GET`
- URL: `{{baseUrl}}/jobs?workMode=HYBRID&page=0&size=10`
- Headers: `Authorization: Bearer {{studentToken}}`
- Body: none

**Expected**

- Status: `200 OK`
- Body expectations: returned content items have `workMode = HYBRID`
- Variables to save: none

### J-New-05 - Filter By Location

**Service:** Job Service

**Purpose:** Validate case-insensitive partial location filtering.

**Thunder Client Request**

- Method: `GET`
- URL: `{{baseUrl}}/jobs?location=Colombo&page=0&size=10`
- Headers: `Authorization: Bearer {{studentToken}}`
- Body: none

**Expected**

- Status: `200 OK`
- Body expectations: returned content items include `location` containing `Colombo`
- Variables to save: none

### J-New-06 - Filter By Experience Level

**Service:** Job Service

**Purpose:** Validate `experienceLevel` filtering.

**Thunder Client Request**

- Method: `GET`
- URL: `{{baseUrl}}/jobs?experienceLevel=ENTRY&page=0&size=10`
- Headers: `Authorization: Bearer {{studentToken}}`
- Body: none

**Expected**

- Status: `200 OK`
- Body expectations: returned content items have `experienceLevel = ENTRY`
- Variables to save: none

### J-New-07 - Combined Enriched Filters

**Service:** Job Service

**Purpose:** Validate existing and enriched filters can be combined.

**Thunder Client Request**

- Method: `GET`
- URL: `{{baseUrl}}/jobs?keyword=backend&status=OPEN&jobType=FULL_TIME&workMode=HYBRID&location=Colombo&experienceLevel=ENTRY&page=0&size=10`
- Headers: `Authorization: Bearer {{studentToken}}`
- Body: none

**Expected**

- Status: `200 OK`
- Body expectations: returned content items match all supplied filters
- Variables to save: none

**Notes**

- `keyword` remains case-insensitive and now also searches enriched text fields.

### J-New-08 - Invalid Job Type Returns 400

**Service:** Job Service

**Purpose:** Validate invalid `jobType` query parameter handling.

**Thunder Client Request**

- Method: `GET`
- URL: `{{baseUrl}}/jobs?jobType=INVALID&page=0&size=10`
- Headers: `Authorization: Bearer {{studentToken}}`
- Body: none

**Expected**

- Status: `400 Bad Request`
- Body expectations: `message` contains `Invalid job type`
- Variables to save: none

### J-New-09 - Invalid Work Mode Returns 400

**Service:** Job Service

**Purpose:** Validate invalid `workMode` query parameter handling.

**Thunder Client Request**

- Method: `GET`
- URL: `{{baseUrl}}/jobs?workMode=INVALID&page=0&size=10`
- Headers: `Authorization: Bearer {{studentToken}}`
- Body: none

**Expected**

- Status: `400 Bad Request`
- Body expectations: `message` contains `Invalid work mode`
- Variables to save: none

### J-New-10 - Invalid Experience Level Returns 400

**Service:** Job Service

**Purpose:** Validate invalid `experienceLevel` query parameter handling.

**Thunder Client Request**

- Method: `GET`
- URL: `{{baseUrl}}/jobs?experienceLevel=INVALID&page=0&size=10`
- Headers: `Authorization: Bearer {{studentToken}}`
- Body: none

**Expected**

- Status: `400 Bad Request`
- Body expectations: `message` contains `Invalid experience level`
- Variables to save: none

### J-New-11 - Missing Required Job Details Returns 400

**Service:** Job Service

**Purpose:** Validate full job details are required during job creation.

**Thunder Client Request**

- Method: `POST`
- URL: `{{baseUrl}}/jobs`
- Headers: `Authorization: Bearer {{alumniToken}}`, `Content-Type: application/json`
- Body:

```json
{
  "title": "Incomplete Job",
  "description": "Missing required job details"
}
```

**Expected**

- Status: `400 Bad Request`
- Body expectations: `message` indicates a missing required field, such as `companyName is required`
- Variables to save: none

### J10 - Create Close-Test Job

**Service:** Job Service

**Purpose:** Create a separate job for close workflow tests.

**Thunder Client Request**

- Method: `POST`
- URL: `{{baseUrl}}/jobs`
- Headers: `Authorization: Bearer {{alumniToken}}`, `Content-Type: application/json`
- Body:

```json
{
  "title": "Close Workflow Test Job",
  "description": "Temporary job used to validate closing behavior",
  "companyName": "DECP Test Company",
  "location": "Kandy",
  "jobType": "CONTRACT",
  "workMode": "ONSITE",
  "salaryRange": "LKR 100,000 - 140,000",
  "applicationDeadline": "2026-12-31",
  "requirements": "Ability to support manual workflow validation",
  "responsibilities": "Provide test data for close-job scenarios",
  "skillsRequired": ["Testing", "Documentation"],
  "experienceLevel": "ENTRY"
}
```

**Expected**

- Status: `200 OK`
- Body expectations: `status = OPEN`
- Variables to save: `closeTestJobId = id`

**Notes**

- Do not apply to this job before closing unless the specific test requires it.

### J11 - Student Cannot Close Job

**Service:** Job Service

**Purpose:** Validate downstream role restriction for closing jobs.

**Thunder Client Request**

- Method: `PATCH`
- URL: `{{baseUrl}}/jobs/{{closeTestJobId}}/close`
- Headers: `Authorization: Bearer {{studentToken}}`
- Body: none

**Expected**

- Status: `403 Forbidden`
- Body expectations: `message = Only admins, alumni, or recruiters can close jobs`
- Variables to save: none

**Notes**

- Gateway allows the request; Job Service rejects it.

### J12 - Owning Alumni Closes Job

**Service:** Job Service

**Purpose:** Validate owner close workflow.

**Thunder Client Request**

- Method: `PATCH`
- URL: `{{baseUrl}}/jobs/{{closeTestJobId}}/close`
- Headers: `Authorization: Bearer {{alumniToken}}`
- Body: none

**Expected**

- Status: `200 OK`
- Body expectations: `id = {{closeTestJobId}}`, `status = CLOSED`
- Variables to save: none

**Notes**

- Closing publishes Kafka topic `job.closed`.
- Closing an already closed job returns the existing closed job with `200 OK` and should not publish a duplicate `job.closed` event.

### J-Update-05 - Closed Job Cannot Be Updated

**Service:** Job Service

**Purpose:** Validate closed jobs are not editable.

**Thunder Client Request**

- Method: `PUT`
- URL: `{{baseUrl}}/jobs/{{closeTestJobId}}`
- Headers: `Authorization: Bearer {{alumniToken}}`, `Content-Type: application/json`
- Body:

```json
{
  "title": "Closed Job Update Attempt",
  "description": "Closed jobs should not be updated",
  "companyName": "DECP Test Company",
  "location": "Kandy",
  "jobType": "CONTRACT",
  "workMode": "ONSITE",
  "salaryRange": "LKR 100,000 - 140,000",
  "applicationDeadline": "2026-12-31",
  "requirements": "Should be blocked after close",
  "responsibilities": "Should be blocked after close",
  "skillsRequired": ["Testing", "Documentation"],
  "experienceLevel": "ENTRY"
}
```

**Expected**

- Status: `400 Bad Request`
- Body expectations: `message = Closed jobs cannot be edited`
- Variables to save: none

### J13 - Closed Job Appears In CLOSED Filter

**Service:** Job Service

**Purpose:** Verify closed job is discoverable through closed filter.

**Thunder Client Request**

- Method: `GET`
- URL: `{{baseUrl}}/jobs?status=CLOSED&page=0&size=20`
- Headers: `Authorization: Bearer {{studentToken}}`
- Body: none

**Expected**

- Status: `200 OK`
- Body expectations: content includes `id = {{closeTestJobId}}`
- Variables to save: none

**Notes**

- Run after `J12`.

### J14 - Closed Job Excluded From OPEN Filter

**Service:** Job Service

**Purpose:** Verify closed job no longer appears as open.

**Thunder Client Request**

- Method: `GET`
- URL: `{{baseUrl}}/jobs?status=OPEN&page=0&size=50`
- Headers: `Authorization: Bearer {{studentToken}}`
- Body: none

**Expected**

- Status: `200 OK`
- Body expectations: content does not include `id = {{closeTestJobId}}`
- Variables to save: none

**Notes**

- Run after `J12`.

### J15 - Student Cannot Apply To Closed Job

**Service:** Job Service

**Purpose:** Validate application blocking on closed jobs.

**Thunder Client Request**

- Method: `POST`
- URL: `{{baseUrl}}/jobs/{{closeTestJobId}}/apply`
- Headers: `Authorization: Bearer {{studentToken}}`
- Body: none

**Expected**

- Status: `400 Bad Request`
- Body expectations: `message = Applications are closed for this job`
- Variables to save: none

**Notes**

- Gateway allows students to apply; Job Service checks the job status.

### J16 - Admin Can Close Any Job

**Service:** Job Service

**Purpose:** Validate admin close authority.

**Thunder Client Request**

- Method: `PATCH`
- URL: `{{baseUrl}}/jobs/{{adminJobId}}/close`
- Headers: `Authorization: Bearer {{adminToken}}`
- Body: none

**Expected**

- Status: `200 OK`
- Body expectations: `id = {{adminJobId}}`, `status = CLOSED`
- Variables to save: none

**Notes**

- Admin does not need to be the job owner.

### J17 - Student Saves Job

**Service:** Job Service

**Purpose:** Validate saved-job creation for students.

**Thunder Client Request**

- Method: `POST`
- URL: `{{baseUrl}}/jobs/{{savedJobId}}/save`
- Headers: `Authorization: Bearer {{studentToken}}`
- Body: none

**Expected**

- Status: `200 OK`
- Body expectations: returned job has `id = {{savedJobId}}`
- Variables to save: none

**Notes**

- Saved jobs are keyed by `jobId` plus student email.

### J18 - Duplicate Save Returns 409

**Service:** Job Service

**Purpose:** Validate duplicate saved-job protection.

**Thunder Client Request**

- Method: `POST`
- URL: `{{baseUrl}}/jobs/{{savedJobId}}/save`
- Headers: `Authorization: Bearer {{studentToken}}`
- Body: none

**Expected**

- Status: `409 Conflict`
- Body expectations: `message` contains `Job is already saved`
- Variables to save: none

**Notes**

- Run immediately after `J17`.

### J19 - Student Gets Saved Jobs

**Service:** Job Service

**Purpose:** Validate saved-job listing.

**Thunder Client Request**

- Method: `GET`
- URL: `{{baseUrl}}/jobs/saved?page=0&size=10`
- Headers: `Authorization: Bearer {{studentToken}}`
- Body: none

**Expected**

- Status: `200 OK`
- Body expectations: content includes `id = {{savedJobId}}`
- Variables to save: none

**Notes**

- Results are ordered by saved time descending.

### J20 - Alumni Cannot Save Job

**Service:** Job Service

**Purpose:** Validate saved jobs are student-only.

**Thunder Client Request**

- Method: `POST`
- URL: `{{baseUrl}}/jobs/{{savedJobId}}/save`
- Headers: `Authorization: Bearer {{alumniToken}}`
- Body: none

**Expected**

- Status: `403 Forbidden`
- Body expectations: `message = Only students can use saved jobs`
- Variables to save: none

**Notes**

- This role check is in Job Service.

### J21 - Admin Cannot View Saved Jobs

**Service:** Job Service

**Purpose:** Validate saved-job listing is student-only.

**Thunder Client Request**

- Method: `GET`
- URL: `{{baseUrl}}/jobs/saved?page=0&size=10`
- Headers: `Authorization: Bearer {{adminToken}}`
- Body: none

**Expected**

- Status: `403 Forbidden`
- Body expectations: `message = Only students can use saved jobs`
- Variables to save: none

**Notes**

- Gateway allows the request; Job Service rejects it.

### J22 - Student Unsaves Job

**Service:** Job Service

**Purpose:** Validate saved-job removal.

**Thunder Client Request**

- Method: `DELETE`
- URL: `{{baseUrl}}/jobs/{{savedJobId}}/save`
- Headers: `Authorization: Bearer {{studentToken}}`
- Body: none

**Expected**

- Status: `204 No Content`
- Body expectations: empty body
- Variables to save: none

**Notes**

- Unsave is idempotent for an existing job.

### J23 - Saved Jobs No Longer Include Unsaved Job

**Service:** Job Service

**Purpose:** Validate saved-job removal effect.

**Thunder Client Request**

- Method: `GET`
- URL: `{{baseUrl}}/jobs/saved?page=0&size=10`
- Headers: `Authorization: Bearer {{studentToken}}`
- Body: none

**Expected**

- Status: `200 OK`
- Body expectations: content does not include `id = {{savedJobId}}`
- Variables to save: none

**Notes**

- Run after `J22`.

### J24 - Saving Missing Job Returns 404

**Service:** Job Service

**Purpose:** Validate missing job handling for saved jobs.

**Thunder Client Request**

- Method: `POST`
- URL: `{{baseUrl}}/jobs/{{missingId}}/save`
- Headers: `Authorization: Bearer {{studentToken}}`
- Body: none

**Expected**

- Status: `404 Not Found`
- Body expectations: `message = Job not found with id: {{missingId}}`
- Variables to save: none

**Notes**

- The service checks job existence before saving.

### J25 - Student Applies For Job

**Service:** Job Service

**Purpose:** Validate the student application workflow.

**Thunder Client Request**

- Method: `POST`
- URL: `{{baseUrl}}/jobs/{{jobId}}/apply`
- Headers: `Authorization: Bearer {{studentToken}}`
- Body: none

**Expected**

- Status: `200 OK`
- Body expectations: `jobId = {{jobId}}`, `studentEmail = {{studentEmail}}`, `status = APPLIED`
- Variables to save: `applicationId = id`

**Notes**

- Publishes Kafka topic `job.applied`.

### J26 - Alumni Cannot Apply For Job

**Service:** Job Service

**Purpose:** Validate gateway and downstream student-only application rule.

**Thunder Client Request**

- Method: `POST`
- URL: `{{baseUrl}}/jobs/{{jobId}}/apply`
- Headers: `Authorization: Bearer {{alumniToken}}`
- Body: none

**Expected**

- Status: `403 Forbidden`
- Body expectations: gateway error `Insufficient permissions for this resource`
- Variables to save: none

**Notes**

- Through direct service URL, Job Service would also reject with `Only students can apply for jobs`.

### J27 - Duplicate Application Returns 409

**Service:** Job Service

**Purpose:** Validate duplicate application protection.

**Thunder Client Request**

- Method: `POST`
- URL: `{{baseUrl}}/jobs/{{jobId}}/apply`
- Headers: `Authorization: Bearer {{studentToken}}`
- Body: none

**Expected**

- Status: `409 Conflict`
- Body expectations: `message` contains `Student already applied`
- Variables to save: none

**Notes**

- Run after `J25`.

### J28 - Student Gets Own Applications

**Service:** Job Service

**Purpose:** Validate student application history.

**Thunder Client Request**

- Method: `GET`
- URL: `{{baseUrl}}/jobs/applications/me`
- Headers: `Authorization: Bearer {{studentToken}}`
- Body: none

**Expected**

- Status: `200 OK`
- Body expectations: array includes `id = {{applicationId}}`
- Variables to save: none

**Notes**

- Response is not paginated.

### J29 - Alumni Cannot Use Student Applications Endpoint

**Service:** Job Service

**Purpose:** Validate student-only application history.

**Thunder Client Request**

- Method: `GET`
- URL: `{{baseUrl}}/jobs/applications/me`
- Headers: `Authorization: Bearer {{alumniToken}}`
- Body: none

**Expected**

- Status: `403 Forbidden`
- Body expectations: `message = Only students can apply for jobs`
- Variables to save: none

**Notes**

- Error text is shared with the apply role validator.

### J30 - Owning Alumni Gets Applications For Job

**Service:** Job Service

**Purpose:** Validate recruiter application listing for owned job.

**Thunder Client Request**

- Method: `GET`
- URL: `{{baseUrl}}/jobs/{{jobId}}/applications`
- Headers: `Authorization: Bearer {{alumniToken}}`
- Body: none

**Expected**

- Status: `200 OK`
- Body expectations: array includes `id = {{applicationId}}`
- Variables to save: none

**Notes**

- Only `ALUMNI`/`RECRUITER` roles can call this downstream, and only for their own jobs.

### J31 - Student Cannot Get Job Applications

**Service:** Job Service

**Purpose:** Validate recruiter-only application management.

**Thunder Client Request**

- Method: `GET`
- URL: `{{baseUrl}}/jobs/{{jobId}}/applications`
- Headers: `Authorization: Bearer {{studentToken}}`
- Body: none

**Expected**

- Status: `403 Forbidden`
- Body expectations: `message = Only recruiters can manage applications`
- Variables to save: none

**Notes**

- Gateway allows the request; Job Service rejects it.

### J32 - Alumni Updates Application To REVIEWING

**Service:** Job Service

**Purpose:** Validate first allowed status transition.

**Thunder Client Request**

- Method: `PATCH`
- URL: `{{baseUrl}}/jobs/applications/{{applicationId}}/status`
- Headers: `Authorization: Bearer {{alumniToken}}`, `Content-Type: application/json`
- Body:

```json
{
  "status": "REVIEWING"
}
```

**Expected**

- Status: `200 OK`
- Body expectations: `status = REVIEWING`
- Variables to save: none

**Notes**

- Publishes Kafka topic `application.status.updated`.

### J33 - Invalid Status Transition Fails

**Service:** Job Service

**Purpose:** Validate transition guard.

**Thunder Client Request**

- Method: `PATCH`
- URL: `{{baseUrl}}/jobs/applications/{{applicationId}}/status`
- Headers: `Authorization: Bearer {{alumniToken}}`, `Content-Type: application/json`
- Body:

```json
{
  "status": "ACCEPTED"
}
```

**Expected**

- Status: `400 Bad Request`
- Body expectations: `message = Invalid application status transition from REVIEWING to ACCEPTED`
- Variables to save: none

**Notes**

- From `REVIEWING`, use `SHORTLISTED` or `REJECTED`.

### J34 - Alumni Updates Application To SHORTLISTED

**Service:** Job Service

**Purpose:** Validate second allowed status transition.

**Thunder Client Request**

- Method: `PATCH`
- URL: `{{baseUrl}}/jobs/applications/{{applicationId}}/status`
- Headers: `Authorization: Bearer {{alumniToken}}`, `Content-Type: application/json`
- Body:

```json
{
  "status": "SHORTLISTED"
}
```

**Expected**

- Status: `200 OK`
- Body expectations: `status = SHORTLISTED`
- Variables to save: none

**Notes**

- Publishes Kafka topic `application.status.updated`.

### J35 - Alumni Updates Application To ACCEPTED

**Service:** Job Service

**Purpose:** Validate final accepted transition.

**Thunder Client Request**

- Method: `PATCH`
- URL: `{{baseUrl}}/jobs/applications/{{applicationId}}/status`
- Headers: `Authorization: Bearer {{alumniToken}}`, `Content-Type: application/json`
- Body:

```json
{
  "status": "ACCEPTED"
}
```

**Expected**

- Status: `200 OK`
- Body expectations: `status = ACCEPTED`
- Variables to save: none

**Notes**

- `ACCEPTED` is terminal; later status updates should fail.

### J36 - Alumni Gets Recruiter Dashboard

**Service:** Job Service

**Purpose:** Validate dashboard aggregation for the recruiter/alumni.

**Thunder Client Request**

- Method: `GET`
- URL: `{{baseUrl}}/jobs/recruiter/dashboard`
- Headers: `Authorization: Bearer {{alumniToken}}`
- Body: none

**Expected**

- Status: `200 OK`
- Body expectations: numeric fields `jobsPosted`, `openJobs`, `closedJobs`, `totalApplications`, `applied`, `reviewing`, `shortlisted`, `accepted`, `rejected`
- Variables to save: none

**Notes**

- Counts include all jobs posted by the authenticated alumni email.

### J37 - Student Cannot Access Recruiter Dashboard

**Service:** Job Service

**Purpose:** Validate dashboard role restriction.

**Thunder Client Request**

- Method: `GET`
- URL: `{{baseUrl}}/jobs/recruiter/dashboard`
- Headers: `Authorization: Bearer {{studentToken}}`
- Body: none

**Expected**

- Status: `403 Forbidden`
- Body expectations: `message = Only recruiters can access dashboard`
- Variables to save: none

**Notes**

- Gateway allows the request; Job Service rejects it.

### J38 - Admin Cannot Access Recruiter Dashboard

**Service:** Job Service

**Purpose:** Document current dashboard behavior for admins.

**Thunder Client Request**

- Method: `GET`
- URL: `{{baseUrl}}/jobs/recruiter/dashboard`
- Headers: `Authorization: Bearer {{adminToken}}`
- Body: none

**Expected**

- Status: `403 Forbidden`
- Body expectations: `message = Only recruiters can access dashboard`
- Variables to save: none

**Notes**

- Current code allows only `ALUMNI` or `RECRUITER`.

### J39 - Dashboard Counts Reflect Closed Jobs

**Service:** Job Service

**Purpose:** Validate closed/open job aggregation.

**Thunder Client Request**

- Method: `GET`
- URL: `{{baseUrl}}/jobs/recruiter/dashboard`
- Headers: `Authorization: Bearer {{alumniToken}}`
- Body: none

**Expected**

- Status: `200 OK`
- Body expectations: `closedJobs >= 1` after `J12`; `jobsPosted = openJobs + closedJobs`
- Variables to save: none

**Notes**

- Run after the close workflow.

### J40 - Dashboard Counts Reflect Application Statuses

**Service:** Job Service

**Purpose:** Validate application status aggregation.

**Thunder Client Request**

- Method: `GET`
- URL: `{{baseUrl}}/jobs/recruiter/dashboard`
- Headers: `Authorization: Bearer {{alumniToken}}`
- Body: none

**Expected**

- Status: `200 OK`
- Body expectations: `totalApplications >= 1`, `accepted >= 1` after `J35`
- Variables to save: none

**Notes**

- Run after the application status workflow.

## 13. Feed Service Tests

### F01 - Student Creates Feed Post

**Service:** Feed Service

**Purpose:** Validate student post creation.

**Thunder Client Request**

- Method: `POST`
- URL: `{{baseUrl}}/feed/posts`
- Headers: `Authorization: Bearer {{studentToken}}`, `Content-Type: application/json`
- Body:

```json
{
  "content": "Student post for feed workflow tests"
}
```

**Expected**

- Status: `200 OK`
- Body expectations: `authorEmail = {{studentEmail}}`, `likes = 0`, `sourceType = MANUAL`, `sourceId = null`
- Variables to save: `studentPostId = id`, `manualPostId = id`, `postId = id`

**Notes**

- Gateway allows `STUDENT` and `ALUMNI`.

### F02 - Alumni Creates Feed Post

**Service:** Feed Service

**Purpose:** Validate alumni post creation.

**Thunder Client Request**

- Method: `POST`
- URL: `{{baseUrl}}/feed/posts`
- Headers: `Authorization: Bearer {{alumniToken}}`, `Content-Type: application/json`
- Body:

```json
{
  "content": "Alumni post for delete and ownership tests"
}
```

**Expected**

- Status: `200 OK`
- Body expectations: `authorEmail = {{alumniEmail}}`, `likes = 0`
- Variables to save: `alumniPostId = id`

**Notes**

- Keep this post until delete tests.

### F03 - Admin Cannot Create Feed Post

**Service:** Feed Service

**Purpose:** Validate gateway feed-post creation RBAC.

**Thunder Client Request**

- Method: `POST`
- URL: `{{baseUrl}}/feed/posts`
- Headers: `Authorization: Bearer {{adminToken}}`, `Content-Type: application/json`
- Body:

```json
{
  "content": "Admin post should be blocked by gateway"
}
```

**Expected**

- Status: `403 Forbidden`
- Body expectations: gateway error `Insufficient permissions for this resource`
- Variables to save: none

**Notes**

- Direct Feed Service does not perform this role check.

### F04 - Get Feed Posts With Pagination

**Service:** Feed Service

**Purpose:** Validate paginated feed listing.

**Thunder Client Request**

- Method: `GET`
- URL: `{{baseUrl}}/feed/posts?page=0&size=10&sort=createdAt,desc`
- Headers: `Authorization: Bearer {{studentToken}}`
- Body: none

**Expected**

- Status: `200 OK`
- Body expectations: Spring Page body with `content`; includes created feed posts
- Variables to save: optionally `postId` from any content item

**Notes**

- Kafka-created job posts also appear here.

### F-Source-01 - Job Created Feed Post Has Source Fields

**Service:** Feed Service

**Purpose:** Validate structural linking for a job-created feed post.

**Thunder Client Request**

- Method: `GET`
- URL: `{{baseUrl}}/feed/posts?page=0&size=50&sort=createdAt,desc`
- Headers: `Authorization: Bearer {{studentToken}}`
- Body: none

**Expected**

- Status: `200 OK`
- Body expectations: content includes a post with `sourceType = JOB`, `sourceId = {{jobId}}`, and content containing the matching job title
- Variables to save: `jobGeneratedPostId = id` of the matching job-generated post

**Notes**

- Run after `J02`.
- Wait 1-3 seconds after job creation if the post is not visible immediately.

### F-Source-02 - Manual Feed Post Has Manual Source

**Service:** Feed Service

**Purpose:** Validate manual feed posts are not linked to a source job.

**Thunder Client Request**

- Method: `GET`
- URL: `{{baseUrl}}/feed/posts?page=0&size=50&sort=createdAt,desc`
- Headers: `Authorization: Bearer {{studentToken}}`
- Body: none

**Expected**

- Status: `200 OK`
- Body expectations: post `id = {{manualPostId}}` has `sourceType = MANUAL` and `sourceId = null`
- Variables to save: none

**Notes**

- Old posts with null `sourceType` are treated as `MANUAL` in API responses.

### F-Update-01 - Job Update Updates Existing Feed Post

**Service:** Feed Service

**Purpose:** Validate `job.updated` changes the existing linked feed post instead of creating a duplicate.

**Thunder Client Request**

- Method: `GET`
- URL: `{{baseUrl}}/feed/posts?page=0&size=50&sort=createdAt,desc`
- Headers: `Authorization: Bearer {{studentToken}}`
- Body: none

**Expected**

- Status: `200 OK`
- Body expectations: exactly one post should match `sourceType = JOB` and `sourceId = {{jobId}}`
- Body expectations: the matching post content contains `Job updated: Backend Intern Updated`, `Company: DECP Careers Updated`, and `Skills required: Java, Spring Boot, PostgreSQL, Kafka`
- Variables to save: `jobGeneratedPostId = id` of the matching post

**Notes**

- Run after `J-Update-01`.
- Wait 1-3 seconds after the job update for Kafka processing.
- No student notification should be created for this job update.

### F-Source-03 - Cannot Edit Job-Generated Feed Post

**Service:** Feed Service

**Purpose:** Validate job-generated feed posts cannot be manually edited.

**Thunder Client Request**

- Method: `PUT`
- URL: `{{baseUrl}}/feed/posts/{{jobGeneratedPostId}}`
- Headers: `Authorization: Bearer {{alumniToken}}`, `Content-Type: application/json`
- Body:

```json
{
  "content": "Manual edit should be rejected"
}
```

**Expected**

- Status: `400 Bad Request`
- Body expectations: message/reason contains `Job-generated feed posts cannot be edited manually`
- Variables to save: none

**Notes**

- Edit the original job workflow instead of editing the generated feed post.

### F-Closed-01 - Job Closed Updates Feed Post

**Service:** Feed Service

**Purpose:** Validate the `job.closed` event updates the related job feed post.

**Thunder Client Request**

- Method: `GET`
- URL: `{{baseUrl}}/feed/posts?page=0&size=50&sort=createdAt,desc`
- Headers: `Authorization: Bearer {{studentToken}}`
- Body: none

**Expected**

- Status: `200 OK`
- Body expectations: a post with `sourceType = JOB` and `sourceId = {{closeTestJobId}}` has content containing `[Closed]` or `Job closed`
- Variables to save: optionally `jobGeneratedPostId = id` for the matching closed job post

**Notes**

- Run after `J12`.
- Wait 1-3 seconds after closing the job for Kafka processing.

### F05 - Student Edits Own Post

**Service:** Feed Service

**Purpose:** Validate post owner edit.

**Thunder Client Request**

- Method: `PUT`
- URL: `{{baseUrl}}/feed/posts/{{studentPostId}}`
- Headers: `Authorization: Bearer {{studentToken}}`, `Content-Type: application/json`
- Body:

```json
{
  "content": "Student post edited by owner"
}
```

**Expected**

- Status: `200 OK`
- Body expectations: `id = {{studentPostId}}`, `content = Student post edited by owner`
- Variables to save: none

**Notes**

- Current code allows only the owner to edit; admins are also blocked from editing.

### F06 - Non-Owner Cannot Edit Post

**Service:** Feed Service

**Purpose:** Validate feed edit ownership.

**Thunder Client Request**

- Method: `PUT`
- URL: `{{baseUrl}}/feed/posts/{{studentPostId}}`
- Headers: `Authorization: Bearer {{alumniToken}}`, `Content-Type: application/json`
- Body:

```json
{
  "content": "Alumni should not edit student post"
}
```

**Expected**

- Status: `403 Forbidden`
- Body expectations: `message = Only the post owner can edit this post`
- Variables to save: none

**Notes**

- This check is in Feed Service.

### F07 - Like Feed Post

**Service:** Feed Service

**Purpose:** Validate like counter increment.

**Thunder Client Request**

- Method: `POST`
- URL: `{{baseUrl}}/feed/posts/{{studentPostId}}/like`
- Headers: `Authorization: Bearer {{alumniToken}}`
- Body: none

**Expected**

- Status: `200 OK`
- Body expectations: `likes` increases by 1
- Variables to save: none

**Notes**

- Downstream like endpoint does not identify the liker; it only increments a count.

### F08 - Like Missing Post Returns 404

**Service:** Feed Service

**Purpose:** Validate missing post handling for likes.

**Thunder Client Request**

- Method: `POST`
- URL: `{{baseUrl}}/feed/posts/{{missingId}}/like`
- Headers: `Authorization: Bearer {{studentToken}}`
- Body: none

**Expected**

- Status: `404 Not Found`
- Body expectations: `message = Post not found with id: {{missingId}}`
- Variables to save: none

**Notes**

- Uses Feed Service error format.

### F09 - Add Comment To Feed Post

**Service:** Feed Service

**Purpose:** Validate authenticated commenting.

**Thunder Client Request**

- Method: `POST`
- URL: `{{baseUrl}}/feed/posts/{{studentPostId}}/comments`
- Headers: `Authorization: Bearer {{alumniToken}}`, `Content-Type: application/json`
- Body:

```json
{
  "content": "Thanks for sharing this."
}
```

**Expected**

- Status: `200 OK`
- Body expectations: `postId = {{studentPostId}}`, `authorEmail = {{alumniEmail}}`
- Variables to save: `commentId = id`

**Notes**

- The service checks that the post exists before creating the comment.

### F10 - Get Comments For Feed Post

**Service:** Feed Service

**Purpose:** Validate comment listing for a post.

**Thunder Client Request**

- Method: `GET`
- URL: `{{baseUrl}}/feed/posts/{{studentPostId}}/comments`
- Headers: `Authorization: Bearer {{studentToken}}`
- Body: none

**Expected**

- Status: `200 OK`
- Body expectations: array includes `id = {{commentId}}`
- Variables to save: none

**Notes**

- Response is not paginated.

### F11 - Owner Deletes Own Post

**Service:** Feed Service

**Purpose:** Validate owner deletion and comment cleanup.

**Thunder Client Request**

- Method: `DELETE`
- URL: `{{baseUrl}}/feed/posts/{{studentPostId}}`
- Headers: `Authorization: Bearer {{studentToken}}`
- Body: none

**Expected**

- Status: `204 No Content`
- Body expectations: empty body
- Variables to save: none

**Notes**

- Run after like/comment tests using `studentPostId`.

### F12 - Admin Deletes Any Post

**Service:** Feed Service

**Purpose:** Validate admin delete authority.

**Thunder Client Request**

- Method: `DELETE`
- URL: `{{baseUrl}}/feed/posts/{{alumniPostId}}`
- Headers: `Authorization: Bearer {{adminToken}}`
- Body: none

**Expected**

- Status: `204 No Content`
- Body expectations: empty body
- Variables to save: none

**Notes**

- Current code allows admin delete but not admin edit.

### F13 - Non-Owner Non-Admin Cannot Delete Post

**Service:** Feed Service

**Purpose:** Validate delete ownership by creating a fresh alumni post and deleting as student.

**Thunder Client Request**

- Method: `DELETE`
- URL: `{{baseUrl}}/feed/posts/{{alumniPostId}}`
- Headers: `Authorization: Bearer {{studentToken}}`
- Body: none

**Expected**

- Status: `403 Forbidden`
- Body expectations: `message = Only the post owner or an admin can delete this post`
- Variables to save: none

**Notes**

- Run before `F12`, or create a second alumni post for this test.

### F14 - Missing Post Edit/Delete Returns 404

**Service:** Feed Service

**Purpose:** Validate missing post handling for mutation routes.

**Thunder Client Request**

- Method: `PUT`
- URL: `{{baseUrl}}/feed/posts/{{missingId}}`
- Headers: `Authorization: Bearer {{studentToken}}`, `Content-Type: application/json`
- Body:

```json
{
  "content": "Missing post edit"
}
```

**Expected**

- Status: `404 Not Found`
- Body expectations: `message = Post not found with id: {{missingId}}`
- Variables to save: none

**Notes**

- Repeat with `DELETE {{baseUrl}}/feed/posts/{{missingId}}` to validate delete 404.

### F15 - Deleted Post No Longer Appears

**Service:** Feed Service

**Purpose:** Validate delete effect in feed listing.

**Thunder Client Request**

- Method: `GET`
- URL: `{{baseUrl}}/feed/posts?page=0&size=50`
- Headers: `Authorization: Bearer {{studentToken}}`
- Body: none

**Expected**

- Status: `200 OK`
- Body expectations: content does not include deleted `studentPostId` or `alumniPostId`
- Variables to save: none

**Notes**

- Run after delete tests.

## 14. Notification Service Tests

### N01 - Student Gets Notifications With Pagination

**Service:** Notification Service

**Purpose:** Validate paginated visible notifications for a student.

**Thunder Client Request**

- Method: `GET`
- URL: `{{baseUrl}}/notifications?page=0&size=10`
- Headers: `Authorization: Bearer {{studentToken}}`
- Body: none

**Expected**

- Status: `200 OK`
- Body expectations: Spring Page body; visible notifications have types such as `JOB_CREATED` or `APPLICATION_STATUS_UPDATED`
- Variables to save: `studentNotificationId = first unread/visible id`

**Notes**

- Student sees notifications where `recipientRole = STUDENT` and notifications where `recipientEmail = {{studentEmail}}`.

### N02 - Student Gets Unread Notifications

**Service:** Notification Service

**Purpose:** Validate unread notification list.

**Thunder Client Request**

- Method: `GET`
- URL: `{{baseUrl}}/notifications/unread`
- Headers: `Authorization: Bearer {{studentToken}}`
- Body: none

**Expected**

- Status: `200 OK`
- Body expectations: array items have `isRead = false`
- Variables to save: `studentNotificationId = first id if available`

**Notes**

- If all notifications have been read, an empty array is valid.

### N03 - Student Gets Unread Count

**Service:** Notification Service

**Purpose:** Validate unread count endpoint.

**Thunder Client Request**

- Method: `GET`
- URL: `{{baseUrl}}/notifications/unread/count`
- Headers: `Authorization: Bearer {{studentToken}}`
- Body: none

**Expected**

- Status: `200 OK`
- Body expectations: `{ "count": number }`
- Variables to save: none

**Notes**

- Count uses same visibility rule as unread list.

### N04 - Mark One Notification As Read

**Service:** Notification Service

**Purpose:** Validate read mutation for a visible notification.

**Thunder Client Request**

- Method: `PATCH`
- URL: `{{baseUrl}}/notifications/{{studentNotificationId}}/read`
- Headers: `Authorization: Bearer {{studentToken}}`
- Body: none

**Expected**

- Status: `200 OK`
- Body expectations: `id = {{studentNotificationId}}`, `isRead = true`
- Variables to save: none

**Notes**

- Use a notification visible to the student.

### N05 - Unread Count Decreases Or Updates

**Service:** Notification Service

**Purpose:** Verify count after marking one notification read.

**Thunder Client Request**

- Method: `GET`
- URL: `{{baseUrl}}/notifications/unread/count`
- Headers: `Authorization: Bearer {{studentToken}}`
- Body: none

**Expected**

- Status: `200 OK`
- Body expectations: count is lower than before `N04`, unless duplicate role-visible notifications were already read
- Variables to save: none

**Notes**

- Role-targeted notifications are marked read only for the current user.

### N06 - Mark All Notifications As Read

**Service:** Notification Service

**Purpose:** Validate bulk read mutation.

**Thunder Client Request**

- Method: `PATCH`
- URL: `{{baseUrl}}/notifications/read-all`
- Headers: `Authorization: Bearer {{studentToken}}`
- Body: none

**Expected**

- Status: `200 OK`
- Body expectations: returned array items have `isRead = true`
- Variables to save: none

**Notes**

- Only notifications visible to the authenticated user are marked read for that user.
- This does not mark role notifications read for other users with the same role.

### N07 - Unread Count Becomes Zero

**Service:** Notification Service

**Purpose:** Validate unread count after bulk read.

**Thunder Client Request**

- Method: `GET`
- URL: `{{baseUrl}}/notifications/unread/count`
- Headers: `Authorization: Bearer {{studentToken}}`
- Body: none

**Expected**

- Status: `200 OK`
- Body expectations: `count = 0`
- Variables to save: none

**Notes**

- Run immediately after `N06`.

### N08 - Alumni Gets Notifications

**Service:** Notification Service

**Purpose:** Validate recruiter/alumni notification visibility.

**Thunder Client Request**

- Method: `GET`
- URL: `{{baseUrl}}/notifications?page=0&size=10`
- Headers: `Authorization: Bearer {{alumniToken}}`
- Body: none

**Expected**

- Status: `200 OK`
- Body expectations: page content may include `JOB_APPLIED` notifications addressed to `{{alumniEmail}}`
- Variables to save: `alumniNotificationId = first visible id`

**Notes**

- `JOB_APPLIED` notifications are recipient-email targeted to the job poster.

### N09 - Alumni Gets Unread Count

**Service:** Notification Service

**Purpose:** Validate alumni unread count endpoint.

**Thunder Client Request**

- Method: `GET`
- URL: `{{baseUrl}}/notifications/unread/count`
- Headers: `Authorization: Bearer {{alumniToken}}`
- Body: none

**Expected**

- Status: `200 OK`
- Body expectations: `{ "count": number }`
- Variables to save: none

**Notes**

- Count includes notifications where `recipientEmail = {{alumniEmail}}` or `recipientRole = ALUMNI`.

### N10 - Cannot Mark Another User's Notification

**Service:** Notification Service

**Purpose:** Validate notification visibility enforcement.

**Thunder Client Request**

- Method: `PATCH`
- URL: `{{baseUrl}}/notifications/{{alumniNotificationId}}/read`
- Headers: `Authorization: Bearer {{studentToken}}`
- Body: none

**Expected**

- Status: `403 Forbidden`
- Body expectations: message/reason `Cannot update this notification`
- Variables to save: none

**Notes**

- Use an alumni email-targeted notification, not a `recipientRole = STUDENT` notification.

### N11 - Missing Notification Returns 404

**Service:** Notification Service

**Purpose:** Validate missing notification handling.

**Thunder Client Request**

- Method: `PATCH`
- URL: `{{baseUrl}}/notifications/{{missingId}}/read`
- Headers: `Authorization: Bearer {{studentToken}}`
- Body: none

**Expected**

- Status: `404 Not Found`
- Body expectations: message/reason `Notification not found`
- Variables to save: none

**Notes**

- Notification Service has no custom global error DTO in current source; Spring may return its default error body.

### N12 - Missing Authorization Returns 401

**Service:** Notification Service

**Purpose:** Validate gateway auth requirement.

**Thunder Client Request**

- Method: `GET`
- URL: `{{baseUrl}}/notifications/unread/count`
- Headers: none
- Body: none

**Expected**

- Status: `401 Unauthorized`
- Body expectations: gateway error `Missing or invalid Authorization header`
- Variables to save: none

**Notes**

- The controller marks the header as optional for this endpoint, but the gateway still requires auth.

### N-Read-01 - Student A Reads Role Notification Without Affecting Student B

**Service:** Notification Service

**Purpose:** Validate per-user read tracking for role-targeted notifications.

**Setup**

- Register and log in `{{secondStudentEmail}}` using the Auth tests pattern if not already done.
- Create a fresh job as alumni to produce a `JOB_CREATED` notification for `recipientRole = STUDENT`.
- Wait 1-3 seconds for Kafka.
- Save the new role notification id from Student A's `GET /notifications/unread` as `studentNotificationId`.

**Thunder Client Request**

- Method: `PATCH`
- URL: `{{baseUrl}}/notifications/{{studentNotificationId}}/read`
- Headers: `Authorization: Bearer {{studentToken}}`
- Body: none

**Expected**

- Status: `200 OK`
- Body expectations: `id = {{studentNotificationId}}`, `isRead = true`
- Follow-up: Student A unread count decreases or no longer includes this notification
- Follow-up: Student B `GET /notifications/unread` still includes the same role notification id
- Variables to save: none

**Notes**

- This verifies `NotificationRead` rows are scoped by `notificationId + userEmail`.

### N-Read-02 - Mark All Read Is Per-User

**Service:** Notification Service

**Purpose:** Validate bulk read does not globally read role notifications for another student.

**Thunder Client Request**

- Method: `PATCH`
- URL: `{{baseUrl}}/notifications/read-all`
- Headers: `Authorization: Bearer {{studentToken}}`
- Body: none

**Expected**

- Status: `200 OK`
- Body expectations: returned visible notifications have `isRead = true`
- Follow-up: Student A `GET /notifications/unread/count` returns `0`
- Follow-up: Student B `GET /notifications/unread/count` is not forced to `0` by Student A's action
- Variables to save: none

**Notes**

- Run with `{{secondStudentToken}}` available.

### N-Read-03 - Email-Targeted Notification Read Is User-Specific

**Service:** Notification Service

**Purpose:** Validate email-targeted notification visibility and read protection.

**Setup**

- Use an alumni email-targeted notification such as `JOB_APPLIED`.
- Save its id as `alumniNotificationId`.

**Thunder Client Request**

- Method: `PATCH`
- URL: `{{baseUrl}}/notifications/{{alumniNotificationId}}/read`
- Headers: `Authorization: Bearer {{alumniToken}}`
- Body: none

**Expected**

- Status: `200 OK`
- Body expectations: `id = {{alumniNotificationId}}`, `isRead = true`
- Follow-up: Student trying `PATCH /notifications/{{alumniNotificationId}}/read` returns `403 Forbidden`
- Variables to save: none

**Notes**

- Email-targeted notifications use the same per-user read table, but visibility still prevents other users from reading them.

### N-Closed-01 - Job Closed Notification Created

**Service:** Notification Service

**Purpose:** Validate optional `job.closed` notification consumer.

**Thunder Client Request**

- Method: `GET`
- URL: `{{baseUrl}}/notifications?page=0&size=20`
- Headers: `Authorization: Bearer {{studentToken}}`
- Body: none

**Expected**

- Status: `200 OK`
- Body expectations: page content includes `type = JOB_CLOSED` or message containing `Job closed` for `{{closeTestJobId}}`
- Variables to save: none

**Notes**

- Run after `J12`.
- Wait 1-3 seconds after closing the job for Kafka processing.

## 15. Cross-Service / Kafka Workflow Tests

### K01 - `job.created` Creates Feed Post And Student Notification

**Service:** Job Service, Feed Service, Notification Service, Kafka

**Purpose:** Validate async processing after job creation.

**Thunder Client Request**

- Method: `POST`
- URL: `{{baseUrl}}/jobs`
- Headers: `Authorization: Bearer {{alumniToken}}`, `Content-Type: application/json`
- Body:

```json
{
  "title": "Kafka Verification Job",
  "description": "Created to verify job.created consumers",
  "companyName": "DECP Events",
  "location": "Colombo",
  "jobType": "FULL_TIME",
  "workMode": "HYBRID",
  "salaryRange": "LKR 150,000 - 220,000",
  "applicationDeadline": "2026-12-31",
  "requirements": "Backend service and event-driven architecture experience",
  "responsibilities": "Create test data for Kafka verification",
  "skillsRequired": ["Spring Boot", "Kafka", "PostgreSQL"],
  "experienceLevel": "MID"
}
```

**Expected**

- Status: `200 OK`
- Body expectations: saved job has `title = Kafka Verification Job`
- Variables to save: optional new `jobId = id`

**Notes**

- Wait 1-3 seconds.
- Verify `GET {{baseUrl}}/feed/posts?page=0&size=20` includes a post with `authorEmail = {{alumniEmail}}` and content containing `New job posted: Kafka Verification Job`, `Company: DECP Events`, `Location: Colombo`, `Type: FULL_TIME`, `Work mode: HYBRID`, and `Skills required: Spring Boot, Kafka, PostgreSQL`.
- Verify `GET {{baseUrl}}/notifications/unread` as student includes `type = JOB_CREATED`, title `Kafka Verification Job`, and message `New job posted: Kafka Verification Job by {{alumniEmail}}`.
- Feed Service builds job-created post content from the detailed `job.created` event.

### K02 - `job.applied` Creates Recruiter Notification

**Service:** Job Service, Notification Service, Kafka

**Purpose:** Validate recruiter notification after a student applies.

**Thunder Client Request**

- Method: `POST`
- URL: `{{baseUrl}}/jobs/{{jobId}}/apply`
- Headers: `Authorization: Bearer {{studentToken}}`
- Body: none

**Expected**

- Status: `200 OK`
- Body expectations: application status `APPLIED`
- Variables to save: `applicationId = id`

**Notes**

- Wait 1-3 seconds.
- Verify `GET {{baseUrl}}/notifications/unread` as alumni includes `type = JOB_APPLIED` and message `New application received for <jobTitle> from {{studentEmail}}`.
- If the student already applied to `{{jobId}}`, create a fresh job first.

### K03 - `application.status.updated` Creates Student Notification

**Service:** Job Service, Notification Service, Kafka

**Purpose:** Validate student notification after recruiter status update.

**Thunder Client Request**

- Method: `PATCH`
- URL: `{{baseUrl}}/jobs/applications/{{applicationId}}/status`
- Headers: `Authorization: Bearer {{alumniToken}}`, `Content-Type: application/json`
- Body:

```json
{
  "status": "REVIEWING"
}
```

**Expected**

- Status: `200 OK`
- Body expectations: `status = REVIEWING`
- Variables to save: none

**Notes**

- Wait 1-3 seconds.
- Verify `GET {{baseUrl}}/notifications/unread` as student includes `type = APPLICATION_STATUS_UPDATED` and message `Your application for <jobTitle> is under review`.

### K04 - `job.closed` Updates Feed And Creates Student Notification

**Service:** Job Service, Feed Service, Notification Service, Kafka

**Purpose:** Validate async processing after job closure.

**Thunder Client Request**

- Method: `PATCH`
- URL: `{{baseUrl}}/jobs/{{closeTestJobId}}/close`
- Headers: `Authorization: Bearer {{alumniToken}}`
- Body: none

**Expected**

- Status: `200 OK`
- Body expectations: `id = {{closeTestJobId}}`, `status = CLOSED`
- Variables to save: none

**Notes**

- If `{{closeTestJobId}}` was already closed by `J12`, this endpoint returns `200 OK` without publishing a duplicate event. For a fresh end-to-end Kafka check, create a new open job first, then close it once.
- Wait 1-3 seconds.
- Verify `GET {{baseUrl}}/feed/posts?page=0&size=50` includes `sourceType = JOB`, `sourceId = {{closeTestJobId}}`, and closed content.
- Verify `GET {{baseUrl}}/notifications/unread` as student includes `type = JOB_CLOSED` or message containing `Job closed`.

## 16. Frontend Integration Notes

- Store access token separately from refresh token.
- Use the access token in `Authorization: Bearer <accessToken>`.
- On access-token expiry, call `POST /auth/refresh`.
- Replace both access and refresh token after refresh because refresh token rotation is enabled.
- On logout, call `POST /auth/logout` with the current refresh token.
- Re-login after role changes so the JWT role claim is updated.
- Use the API Gateway base URL for frontend calls: `http://localhost:8080`.
- Gmail compose is frontend-only and does not require backend changes.

Example Gmail compose URL:

```text
https://mail.google.com/mail/?view=cm&fs=1&to=<email>
```

## 17. Known Constraints / Not In Scope

- No email delivery service in backend.
- No WebSockets/SSE yet.
- No file upload/resume upload yet.
- No gRPC needed.
- No Kubernetes yet.
- No production observability stack yet.
- No first-admin bootstrap endpoint.
- No current Auth Service endpoint to assign or issue `RECRUITER` role.
- Role assignment does not sync changed roles to User Service profiles.
- Some downstream services rely on the gateway for route-level RBAC; direct service-port testing can bypass those rules.

## 18. Completed Feature Checklist

- [x] Microservices architecture
- [x] Dockerized services
- [x] PostgreSQL per service
- [x] JWT access token authentication
- [x] Refresh token rotation
- [x] RBAC at API Gateway
- [x] Rich user profiles
- [x] Basic user profiles
- [x] Job creation/listing
- [x] Job search/filtering
- [x] Job closing workflow
- [x] Saved jobs
- [x] Job applications
- [x] Recruiter/alumni application management
- [x] Recruiter dashboard
- [x] Feed posts
- [x] Feed likes/comments
- [x] Feed edit/delete
- [x] Feed job source linking
- [x] Persistent notifications
- [x] Notification read/unread
- [x] Notification unread count
- [x] Notification per-user read tracking
- [x] Kafka `job.created` flow
- [x] Kafka `job.updated` flow
- [x] Kafka `job.closed` flow
- [x] Kafka `job.applied` flow
- [x] Kafka `application.status.updated` flow

## 19. Documented Test Case Count

| Section | Count |
|---|---:|
| Auth Service | 14 |
| User Service | 9 |
| Job Service | 57 |
| Feed Service | 20 |
| Notification Service | 16 |
| Cross-service Kafka | 4 |
| Total | 120 |
