# DECP Platform System Tests - Thunder Client

Use this file as a Thunder Client test checklist. Create one Thunder Client environment named `DECP Local` with the variables below, then run the requests in order because later tests reuse tokens and IDs created by earlier tests.

## Environment

| Variable | Value |
| --- | --- |
| `baseUrl` | `http://localhost:8080` |
| `authUrl` | `http://localhost:8081` |
| `userUrl` | `http://localhost:8082` |
| `studentEmail` | `student1@test.com` |
| `studentPassword` | `Password123!` |
| `alumniEmail` | `alumni1@test.com` |
| `alumniPassword` | `Password123!` |
| `adminEmail` | `admin@test.com` |
| `adminPassword` | `Password123!` |
| `studentToken` | set after login |
| `alumniToken` | set after login |
| `adminToken` | set after login |
| `studentUserId` | set from `GET /users/me` or admin lookup |
| `jobId` | set from `POST /jobs` |
| `applicationId` | set from `POST /jobs/{id}/apply` |
| `postId` | set from `POST /feed/posts` |
| `notificationId` | set from `GET /notifications` or `GET /notifications/unread` |

## Important Notes

- Run through the API Gateway (`{{baseUrl}}`) unless a test explicitly says direct service.
- All `/auth/**` endpoints are public through the gateway.
- Every non-auth gateway endpoint requires `Authorization: Bearer <token>`.
- New registrations are created with role `STUDENT`.
- `PUT /auth/admin/role` can assign `STUDENT` or `ALUMNI`, but the current service rejects assigning `ADMIN`. Bootstrap one admin manually before role tests, for example by updating the auth database user role to `ADMIN`.
- Job application status transitions must follow: `APPLIED -> REVIEWING -> SHORTLISTED/REJECTED -> ACCEPTED/REJECTED`.
- Kafka-driven notifications may need a short delay after job creation, application, or status update.

## Role Matrix

| Endpoint | Role requirement |
| --- | --- |
| `POST /auth/register` | Public |
| `POST /auth/login` | Public |
| `GET /auth/test` | Public in current gateway/auth config |
| `PUT /auth/admin/role` | Must provide `ADMIN` token; enforced in auth service |
| `POST /users/register` | Authenticated through gateway; intended for internal/direct user sync |
| `GET /users/me` | Any authenticated role |
| `PUT /users/me` | Any authenticated role |
| `GET /users/{id}` | `ADMIN` only through gateway |
| `POST /jobs` | `ALUMNI` or `ADMIN` through gateway |
| `GET /jobs` | Any authenticated role |
| `POST /jobs/{id}/apply` | `STUDENT` only through gateway and service |
| `GET /jobs/{id}/applications` | Gateway allows any authenticated role, service allows owning `ALUMNI` or `RECRUITER` only |
| `GET /jobs/applications/me` | Gateway allows any authenticated role, service allows `STUDENT` only |
| `PATCH /jobs/applications/{id}/status` | Gateway allows any authenticated role, service allows owning `ALUMNI` or `RECRUITER` only |
| `POST /feed/posts` | `STUDENT` or `ALUMNI` through gateway |
| `GET /feed/posts` | Any authenticated role |
| `POST /feed/posts/{id}/like` | Any authenticated role |
| `POST /feed/posts/{id}/comments` | Any authenticated role |
| `GET /feed/posts/{id}/comments` | Any authenticated role |
| `GET /notifications` | `STUDENT`, `ALUMNI`, or `ADMIN` |
| `GET /notifications/unread` | `STUDENT`, `ALUMNI`, or `ADMIN` |
| `PATCH /notifications/{id}/read` | Notification recipient email or recipient role only |
| `PATCH /notifications/read-all` | `STUDENT`, `ALUMNI`, or `ADMIN` |

## Test Cases

### 01 - Register Student

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
- Body contains: `User registered successfully`

### 02 - Register Alumni Candidate

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
- Body contains: `User registered successfully`

### 03 - Register Admin Bootstrap User

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
- Body contains: `User registered successfully`

**Manual bootstrap**

Before logging in as admin, update this user to role `ADMIN` in `decp_auth_db`. The API currently has no endpoint that creates the first admin.

### 04 - Login Student

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
- JSON body has `token`
- Save `token` as `studentToken`

### 05 - Login Alumni Candidate

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
- JSON body has `token`
- Save `token` as temporary candidate token if needed

### 06 - Login Admin

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
- JSON body has `token`
- Save `token` as `adminToken`

### 07 - Auth Test Endpoint

**Thunder Client Request**

- Method: `GET`
- URL: `{{baseUrl}}/auth/test`

**Expected**

- Status: `200 OK`
- Body contains: `Protected!`
- Note: despite the response text, this endpoint is public in current config.

### 08 - Admin Assigns Alumni Role

**Thunder Client Request**

- Method: `PUT`
- URL: `{{baseUrl}}/auth/admin/role`
- Headers:
  - `Authorization: Bearer {{adminToken}}`
  - `Content-Type: application/json`
- Body:

```json
{
  "email": "{{alumniEmail}}",
  "role": "ALUMNI"
}
```

**Expected**

- Status: `200 OK`
- JSON body:
  - `email` equals `{{alumniEmail}}`
  - `role` equals `ALUMNI`
  - `message` equals `Role updated successfully`

### 09 - Login Alumni Again After Role Change

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
- Save returned `token` as `alumniToken`

### 10 - Non-Admin Cannot Assign Role

**Thunder Client Request**

- Method: `PUT`
- URL: `{{baseUrl}}/auth/admin/role`
- Headers:
  - `Authorization: Bearer {{studentToken}}`
  - `Content-Type: application/json`
- Body:

```json
{
  "email": "{{alumniEmail}}",
  "role": "STUDENT"
}
```

**Expected**

- Status: `403 Forbidden`
- Body contains: `Only ADMIN users can assign roles`

### 11 - Admin Cannot Assign Admin Role

**Thunder Client Request**

- Method: `PUT`
- URL: `{{baseUrl}}/auth/admin/role`
- Headers:
  - `Authorization: Bearer {{adminToken}}`
  - `Content-Type: application/json`
- Body:

```json
{
  "email": "{{studentEmail}}",
  "role": "ADMIN"
}
```

**Expected**

- Status: `400 Bad Request`
- Body contains: `Only existing ADMIN users can assign ADMIN role`

### 12 - Get Student Profile

**Thunder Client Request**

- Method: `GET`
- URL: `{{baseUrl}}/users/me`
- Headers: `Authorization: Bearer {{studentToken}}`

**Expected**

- Status: `200 OK`
- JSON body has `id`, `email`, `name`, `role`
- `email` equals `{{studentEmail}}`
- Save `id` as `studentUserId`

### 13 - Update Student Profile

**Thunder Client Request**

- Method: `PUT`
- URL: `{{baseUrl}}/users/me`
- Headers:
  - `Authorization: Bearer {{studentToken}}`
  - `Content-Type: application/json`
- Body:

```json
{
  "name": "Student One Updated"
}
```

**Expected**

- Status: `200 OK`
- JSON body `name` equals `Student One Updated`

### 14 - Admin Gets User By ID

**Thunder Client Request**

- Method: `GET`
- URL: `{{baseUrl}}/users/{{studentUserId}}`
- Headers: `Authorization: Bearer {{adminToken}}`

**Expected**

- Status: `200 OK`
- JSON body `id` equals `{{studentUserId}}`

### 15 - Student Cannot Get User By ID

**Thunder Client Request**

- Method: `GET`
- URL: `{{baseUrl}}/users/{{studentUserId}}`
- Headers: `Authorization: Bearer {{studentToken}}`

**Expected**

- Status: `403 Forbidden`
- JSON body contains `Insufficient permissions for this resource`

### 16 - User Service Register Endpoint

This endpoint exists in user-service and is normally called by auth-service during registration. Through the gateway it requires authentication; direct service testing uses `{{userUrl}}`.

**Thunder Client Request - gateway**

- Method: `POST`
- URL: `{{baseUrl}}/users/register`
- Headers:
  - `Authorization: Bearer {{adminToken}}`
  - `Content-Type: application/json`
- Body:

```json
{
  "email": "gateway-user@test.com",
  "name": "Gateway User",
  "role": "STUDENT"
}
```

**Expected**

- Status: `201 Created`
- JSON body has `id`, `email`, `name`, `role`

**Thunder Client Request - direct service**

- Method: `POST`
- URL: `{{userUrl}}/users/register`
- Headers: `Content-Type: application/json`
- Body:

```json
{
  "email": "direct-user@test.com",
  "name": "Direct User",
  "role": "STUDENT"
}
```

**Expected**

- Status: `201 Created`
- JSON body has `id`, `email`, `name`, `role`

### 17 - Student Cannot Create Job

**Thunder Client Request**

- Method: `POST`
- URL: `{{baseUrl}}/jobs`
- Headers:
  - `Authorization: Bearer {{studentToken}}`
  - `Content-Type: application/json`
- Body:

```json
{
  "title": "Junior Backend Developer",
  "description": "Spring Boot and PostgreSQL role"
}
```

**Expected**

- Status: `403 Forbidden`
- JSON body contains `Insufficient permissions for this resource`

### 18 - Alumni Creates Job

**Thunder Client Request**

- Method: `POST`
- URL: `{{baseUrl}}/jobs`
- Headers:
  - `Authorization: Bearer {{alumniToken}}`
  - `Content-Type: application/json`
- Body:

```json
{
  "title": "Junior Backend Developer",
  "description": "Spring Boot and PostgreSQL role"
}
```

**Expected**

- Status: `200 OK`
- JSON body has `id`, `title`, `description`, `postedByEmail`, `status`, `createdAt`
- `postedByEmail` equals `{{alumniEmail}}`
- `status` equals `OPEN`
- Save `id` as `jobId`

### 19 - Admin Creates Job

**Thunder Client Request**

- Method: `POST`
- URL: `{{baseUrl}}/jobs`
- Headers:
  - `Authorization: Bearer {{adminToken}}`
  - `Content-Type: application/json`
- Body:

```json
{
  "title": "Platform QA Internship",
  "description": "API testing and system testing role"
}
```

**Expected**

- Status: `200 OK`
- JSON body has `id`

### 20 - Get Jobs

**Thunder Client Request**

- Method: `GET`
- URL: `{{baseUrl}}/jobs?page=0&size=10`
- Headers: `Authorization: Bearer {{studentToken}}`

**Expected**

- Status: `200 OK`
- JSON body has `content`
- `content` contains the job created in test 18
- returned job objects include `status`

### 20A - Get Jobs Existing Behavior Still Works

**Thunder Client Request**

- Method: `GET`
- URL: `{{baseUrl}}/jobs?page=0&size=10`
- Headers: `Authorization: Bearer {{studentToken}}`

**Expected**

- Status: `200 OK`
- JSON body has `content`, `pageable`, `totalElements`
- Existing jobs are returned

### 20B - Search Jobs By Keyword

**Thunder Client Request**

- Method: `GET`
- URL: `{{baseUrl}}/jobs?keyword=backend&page=0&size=10`
- Headers: `Authorization: Bearer {{studentToken}}`

**Expected**

- Status: `200 OK`
- JSON body has `content`
- Every returned job contains `backend` in `title` or `description`, case-insensitive

### 20C - Filter Jobs By Status

**Thunder Client Request**

- Method: `GET`
- URL: `{{baseUrl}}/jobs?status=OPEN&page=0&size=10`
- Headers: `Authorization: Bearer {{studentToken}}`

**Expected**

- Status: `200 OK`
- JSON body has `content`
- Every returned job has `status` equal to `OPEN`

### 20D - Filter Jobs By Poster Email

**Thunder Client Request**

- Method: `GET`
- URL: `{{baseUrl}}/jobs?postedByEmail={{alumniEmail}}&page=0&size=10`
- Headers: `Authorization: Bearer {{studentToken}}`

**Expected**

- Status: `200 OK`
- JSON body has `content`
- Every returned job has `postedByEmail` equal to `{{alumniEmail}}`

### 20E - Search Jobs With Combined Filters

**Thunder Client Request**

- Method: `GET`
- URL: `{{baseUrl}}/jobs?keyword=spring&status=OPEN&page=0&size=10`
- Headers: `Authorization: Bearer {{studentToken}}`

**Expected**

- Status: `200 OK`
- JSON body has `content`
- Every returned job has `status` equal to `OPEN`
- Every returned job contains `spring` in `title` or `description`, case-insensitive

### 20F - Invalid Job Status Is Rejected

**Thunder Client Request**

- Method: `GET`
- URL: `{{baseUrl}}/jobs?status=INVALID&page=0&size=10`
- Headers: `Authorization: Bearer {{studentToken}}`

**Expected**

- Status: `400 Bad Request`
- JSON body `error` equals `Bad Request`
- JSON body `message` contains `Invalid job status`

### 21 - Student Applies For Job

**Thunder Client Request**

- Method: `POST`
- URL: `{{baseUrl}}/jobs/{{jobId}}/apply`
- Headers: `Authorization: Bearer {{studentToken}}`

**Expected**

- Status: `200 OK`
- JSON body has `id`, `jobId`, `studentEmail`, `status`
- `status` equals `APPLIED`
- Save `id` as `applicationId`

### 22 - Alumni Cannot Apply For Job

**Thunder Client Request**

- Method: `POST`
- URL: `{{baseUrl}}/jobs/{{jobId}}/apply`
- Headers: `Authorization: Bearer {{alumniToken}}`

**Expected**

- Status: `403 Forbidden`
- JSON body contains `Insufficient permissions for this resource`

### 23 - Duplicate Application Is Rejected

**Thunder Client Request**

- Method: `POST`
- URL: `{{baseUrl}}/jobs/{{jobId}}/apply`
- Headers: `Authorization: Bearer {{studentToken}}`

**Expected**

- Status: `409 Conflict`
- JSON body `error` equals `Conflict`
- JSON body `message` contains `Student already applied`

### 24 - Student Gets Own Applications

**Thunder Client Request**

- Method: `GET`
- URL: `{{baseUrl}}/jobs/applications/me`
- Headers: `Authorization: Bearer {{studentToken}}`

**Expected**

- Status: `200 OK`
- JSON array contains `applicationId`

### 25 - Alumni Cannot Use Student Application History Endpoint

**Thunder Client Request**

- Method: `GET`
- URL: `{{baseUrl}}/jobs/applications/me`
- Headers: `Authorization: Bearer {{alumniToken}}`

**Expected**

- Status: `403 Forbidden`
- JSON body `message` contains `Only students can apply for jobs`

### 26 - Owning Alumni Gets Applications For Job

**Thunder Client Request**

- Method: `GET`
- URL: `{{baseUrl}}/jobs/{{jobId}}/applications`
- Headers: `Authorization: Bearer {{alumniToken}}`

**Expected**

- Status: `200 OK`
- JSON array contains `applicationId`

### 27 - Student Cannot Get Job Applications

**Thunder Client Request**

- Method: `GET`
- URL: `{{baseUrl}}/jobs/{{jobId}}/applications`
- Headers: `Authorization: Bearer {{studentToken}}`

**Expected**

- Status: `403 Forbidden`
- JSON body `message` contains `Only recruiters can manage applications`

### 28 - Alumni Updates Application To Reviewing

**Thunder Client Request**

- Method: `PATCH`
- URL: `{{baseUrl}}/jobs/applications/{{applicationId}}/status`
- Headers:
  - `Authorization: Bearer {{alumniToken}}`
  - `Content-Type: application/json`
- Body:

```json
{
  "status": "REVIEWING"
}
```

**Expected**

- Status: `200 OK`
- JSON body `status` equals `REVIEWING`

### 29 - Invalid Status Transition Is Rejected

**Thunder Client Request**

- Method: `PATCH`
- URL: `{{baseUrl}}/jobs/applications/{{applicationId}}/status`
- Headers:
  - `Authorization: Bearer {{alumniToken}}`
  - `Content-Type: application/json`
- Body:

```json
{
  "status": "ACCEPTED"
}
```

**Expected**

- Status: `400 Bad Request`
- JSON body `message` contains `Invalid application status transition`

### 30 - Alumni Updates Application To Shortlisted

**Thunder Client Request**

- Method: `PATCH`
- URL: `{{baseUrl}}/jobs/applications/{{applicationId}}/status`
- Headers:
  - `Authorization: Bearer {{alumniToken}}`
  - `Content-Type: application/json`
- Body:

```json
{
  "status": "SHORTLISTED"
}
```

**Expected**

- Status: `200 OK`
- JSON body `status` equals `SHORTLISTED`

### 31 - Alumni Updates Application To Accepted

**Thunder Client Request**

- Method: `PATCH`
- URL: `{{baseUrl}}/jobs/applications/{{applicationId}}/status`
- Headers:
  - `Authorization: Bearer {{alumniToken}}`
  - `Content-Type: application/json`
- Body:

```json
{
  "status": "ACCEPTED"
}
```

**Expected**

- Status: `200 OK`
- JSON body `status` equals `ACCEPTED`

### 32 - Create Feed Post As Student

**Thunder Client Request**

- Method: `POST`
- URL: `{{baseUrl}}/feed/posts`
- Headers:
  - `Authorization: Bearer {{studentToken}}`
  - `Content-Type: application/json`
- Body:

```json
{
  "content": "Excited to join the DECP platform."
}
```

**Expected**

- Status: `200 OK`
- JSON body has `id`, `content`, `authorEmail`, `likes`, `createdAt`
- Save `id` as `postId`

### 33 - Create Feed Post As Alumni

**Thunder Client Request**

- Method: `POST`
- URL: `{{baseUrl}}/feed/posts`
- Headers:
  - `Authorization: Bearer {{alumniToken}}`
  - `Content-Type: application/json`
- Body:

```json
{
  "content": "Sharing a new opportunity with students."
}
```

**Expected**

- Status: `200 OK`
- JSON body `authorEmail` equals `{{alumniEmail}}`

### 34 - Admin Cannot Create Feed Post

**Thunder Client Request**

- Method: `POST`
- URL: `{{baseUrl}}/feed/posts`
- Headers:
  - `Authorization: Bearer {{adminToken}}`
  - `Content-Type: application/json`
- Body:

```json
{
  "content": "Admin announcement attempt."
}
```

**Expected**

- Status: `403 Forbidden`
- JSON body contains `Insufficient permissions for this resource`

### 35 - Get Feed Posts

**Thunder Client Request**

- Method: `GET`
- URL: `{{baseUrl}}/feed/posts?page=0&size=10`
- Headers: `Authorization: Bearer {{adminToken}}`

**Expected**

- Status: `200 OK`
- JSON body has `content`

### 36 - Like Feed Post

**Thunder Client Request**

- Method: `POST`
- URL: `{{baseUrl}}/feed/posts/{{postId}}/like`
- Headers: `Authorization: Bearer {{studentToken}}`

**Expected**

- Status: `200 OK`
- JSON body `likes` is at least `1`

### 37 - Like Missing Feed Post

**Thunder Client Request**

- Method: `POST`
- URL: `{{baseUrl}}/feed/posts/999999/like`
- Headers: `Authorization: Bearer {{studentToken}}`

**Expected**

- Status: `404 Not Found`
- JSON body `message` contains `Post not found`

### 38 - Add Comment To Feed Post

**Thunder Client Request**

- Method: `POST`
- URL: `{{baseUrl}}/feed/posts/{{postId}}/comments`
- Headers:
  - `Authorization: Bearer {{alumniToken}}`
  - `Content-Type: application/json`
- Body:

```json
{
  "content": "Great progress!"
}
```

**Expected**

- Status: `200 OK`
- JSON body has `id`, `postId`, `authorEmail`, `content`, `createdAt`

### 39 - Get Comments For Feed Post

**Thunder Client Request**

- Method: `GET`
- URL: `{{baseUrl}}/feed/posts/{{postId}}/comments`
- Headers: `Authorization: Bearer {{studentToken}}`

**Expected**

- Status: `200 OK`
- JSON array contains the comment from test 38

### 40 - Missing Authorization Is Rejected

**Thunder Client Request**

- Method: `GET`
- URL: `{{baseUrl}}/feed/posts`

**Expected**

- Status: `401 Unauthorized`
- JSON body contains `Missing or invalid Authorization header`

### 41 - Student Gets Notifications

Wait a few seconds after tests 18, 21, and 31 so notification-service can consume Kafka events.

**Thunder Client Request**

- Method: `GET`
- URL: `{{baseUrl}}/notifications?page=0&size=10`
- Headers: `Authorization: Bearer {{studentToken}}`

**Expected**

- Status: `200 OK`
- JSON body has `content`
- May contain `JOB_CREATED` and `APPLICATION_STATUS_UPDATED` notifications
- Save a notification `id` that belongs to this student or role as `notificationId`

### 42 - Student Gets Unread Notifications

**Thunder Client Request**

- Method: `GET`
- URL: `{{baseUrl}}/notifications/unread`
- Headers: `Authorization: Bearer {{studentToken}}`

**Expected**

- Status: `200 OK`
- JSON array contains unread notifications or an empty array

### 43 - Mark One Notification As Read

**Thunder Client Request**

- Method: `PATCH`
- URL: `{{baseUrl}}/notifications/{{notificationId}}/read`
- Headers: `Authorization: Bearer {{studentToken}}`

**Expected**

- Status: `200 OK`
- JSON body `isRead` equals `true`

### 44 - Mark All Notifications As Read

**Thunder Client Request**

- Method: `PATCH`
- URL: `{{baseUrl}}/notifications/read-all`
- Headers: `Authorization: Bearer {{studentToken}}`

**Expected**

- Status: `200 OK`
- JSON array contains updated notifications or an empty array

### 45 - Alumni Gets Notifications

**Thunder Client Request**

- Method: `GET`
- URL: `{{baseUrl}}/notifications?page=0&size=10`
- Headers: `Authorization: Bearer {{alumniToken}}`

**Expected**

- Status: `200 OK`
- JSON body has `content`
- Should include `JOB_APPLIED` notification for the job owner after test 21

### 46 - Cannot Mark Another User Email Notification

Use a notification ID targeted only to the alumni email, then call with the student token.

**Thunder Client Request**

- Method: `PATCH`
- URL: `{{baseUrl}}/notifications/{{notificationId}}/read`
- Headers: `Authorization: Bearer {{studentToken}}`

**Expected**

- Status: `403 Forbidden`
- Body contains `Cannot update this notification`

### 47 - Missing Notification Is Not Found

**Thunder Client Request**

- Method: `PATCH`
- URL: `{{baseUrl}}/notifications/999999/read`
- Headers: `Authorization: Bearer {{studentToken}}`

**Expected**

- Status: `404 Not Found`
- Body contains `Notification not found`

## Thunder Client Assertion Checklist

For each request, add these checks in the Thunder Client `Tests` tab where applicable:

| Check | Example |
| --- | --- |
| Status code | `Status Code = 200` |
| JSON field exists | `Response Body has JSON property token` |
| JSON field equals | `Response Body JSON property role equals ALUMNI` |
| Body contains text | `Response Body contains User registered successfully` |
| Header check | `Response Headers content-type contains application/json` |

Suggested saved variables after successful responses:

| Request | Save |
| --- | --- |
| Login Student | `studentToken = $.token` |
| Login Alumni After Role Change | `alumniToken = $.token` |
| Login Admin | `adminToken = $.token` |
| Get Student Profile | `studentUserId = $.id` |
| Create Job | `jobId = $.id` |
| Apply For Job | `applicationId = $.id` |
| Create Feed Post | `postId = $.id` |
| Get Notifications | `notificationId = $.content[0].id` or the specific notification ID under test |
