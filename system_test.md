# DECP Platform System Tests - Thunder Client

Create a Thunder Client environment named `DECP Local`, add the variables below, and run the test cases in order. All requests use the API Gateway unless the URL explicitly uses a direct service URL.

## Thunder Client Environment

| Variable | Value |
| --- | --- |
| `baseUrl` | `http://localhost:8080` |
| `userUrl` | `http://localhost:8082` |
| `studentEmail` | `student1@test.com` |
| `studentPassword` | `Password123!` |
| `alumniEmail` | `alumni1@test.com` |
| `alumniPassword` | `Password123!` |
| `adminEmail` | `admin@test.com` |
| `adminPassword` | `Password123!` |
| `studentToken` | save from student login |
| `alumniToken` | save from alumni login after role change |
| `adminToken` | save from admin login |
| `studentUserId` | save from `GET /users/me` |
| `jobId1` | save from first alumni job |
| `jobId2` | save from second alumni job |
| `jobId3` | save from third alumni job |
| `applicationId` | save from job application |
| `studentPostId` | save from student feed post |
| `alumniPostId` | save from alumni feed post |
| `commentId1` | save from first feed comment |
| `notificationId` | save from a visible unread notification |

Before `TC-AUTH-06`, manually bootstrap `admin@test.com` to role `ADMIN` in `decp_auth_db`, because there is no API that creates the first admin.

## Auth Service

### TC-AUTH-01 - Register Student

**Request**

- Method: `POST`
- URL: `http://localhost:8080/auth/register`
- Headers: `Content-Type: application/json`
- Body:

```json
{
  "email": "{{studentEmail}}",
  "password": "{{studentPassword}}",
  "name": "Student One"
}
```

**Thunder Client Tests**

- Status Code: `200`
- Response Body contains: `User registered successfully`

### TC-AUTH-02 - Register Alumni Candidate

**Request**

- Method: `POST`
- URL: `http://localhost:8080/auth/register`
- Headers: `Content-Type: application/json`
- Body:

```json
{
  "email": "{{alumniEmail}}",
  "password": "{{alumniPassword}}",
  "name": "Alumni One"
}
```

**Thunder Client Tests**

- Status Code: `200`
- Response Body contains: `User registered successfully`

### TC-AUTH-03 - Register Admin Bootstrap User

**Request**

- Method: `POST`
- URL: `http://localhost:8080/auth/register`
- Headers: `Content-Type: application/json`
- Body:

```json
{
  "email": "{{adminEmail}}",
  "password": "{{adminPassword}}",
  "name": "Admin One"
}
```

**Thunder Client Tests**

- Status Code: `200`
- Response Body contains: `User registered successfully`

### TC-AUTH-04 - Login Student

**Request**

- Method: `POST`
- URL: `http://localhost:8080/auth/login`
- Headers: `Content-Type: application/json`
- Body:

```json
{
  "email": "{{studentEmail}}",
  "password": "{{studentPassword}}"
}
```

**Thunder Client Tests**

- Status Code: `200`
- Response Body has JSON property: `token`
- Save variable: `studentToken = $.token`

### TC-AUTH-05 - Login Alumni Candidate

**Request**

- Method: `POST`
- URL: `http://localhost:8080/auth/login`
- Headers: `Content-Type: application/json`
- Body:

```json
{
  "email": "{{alumniEmail}}",
  "password": "{{alumniPassword}}"
}
```

**Thunder Client Tests**

- Status Code: `200`
- Response Body has JSON property: `token`

### TC-AUTH-06 - Login Admin

**Request**

- Method: `POST`
- URL: `http://localhost:8080/auth/login`
- Headers: `Content-Type: application/json`
- Body:

```json
{
  "email": "{{adminEmail}}",
  "password": "{{adminPassword}}"
}
```

**Thunder Client Tests**

- Status Code: `200`
- Response Body has JSON property: `token`
- Save variable: `adminToken = $.token`

### TC-AUTH-07 - Auth Test Endpoint

**Request**

- Method: `GET`
- URL: `http://localhost:8080/auth/test`

**Thunder Client Tests**

- Status Code: `200`
- Response Body contains: `Protected!`

### TC-AUTH-08 - Admin Assigns Alumni Role

**Request**

- Method: `PUT`
- URL: `http://localhost:8080/auth/admin/role`
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

**Thunder Client Tests**

- Status Code: `200`
- Response Body JSON property `email` equals: `{{alumniEmail}}`
- Response Body JSON property `role` equals: `ALUMNI`

### TC-AUTH-09 - Login Alumni After Role Change

**Request**

- Method: `POST`
- URL: `http://localhost:8080/auth/login`
- Headers: `Content-Type: application/json`
- Body:

```json
{
  "email": "{{alumniEmail}}",
  "password": "{{alumniPassword}}"
}
```

**Thunder Client Tests**

- Status Code: `200`
- Response Body has JSON property: `token`
- Save variable: `alumniToken = $.token`

### TC-AUTH-10 - Student Cannot Assign Roles

**Request**

- Method: `PUT`
- URL: `http://localhost:8080/auth/admin/role`
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

**Thunder Client Tests**

- Status Code: `403`
- Response Body contains: `Only ADMIN users can assign roles`

### TC-AUTH-11 - Admin Role Assignment Rejects Missing User

**Request**

- Method: `PUT`
- URL: `http://localhost:8080/auth/admin/role`
- Headers:
  - `Authorization: Bearer {{adminToken}}`
  - `Content-Type: application/json`
- Body:

```json
{
  "email": "missing-user@test.com",
  "role": "ALUMNI"
}
```

**Thunder Client Tests**

- Status Code: `404`
- Response Body contains: `not found`

## User Service

### TC-USER-01 - Get Student Profile

**Request**

- Method: `GET`
- URL: `http://localhost:8080/users/me`
- Headers: `Authorization: Bearer {{studentToken}}`

**Thunder Client Tests**

- Status Code: `200`
- Response Body JSON property `email` equals: `{{studentEmail}}`
- Response Body has JSON property: `id`
- Save variable: `studentUserId = $.id`

### TC-USER-02 - Update Student Profile

**Request**

- Method: `PUT`
- URL: `http://localhost:8080/users/me`
- Headers:
  - `Authorization: Bearer {{studentToken}}`
  - `Content-Type: application/json`
- Body:

```json
{
  "name": "Student One Updated"
}
```

**Thunder Client Tests**

- Status Code: `200`
- Response Body JSON property `name` equals: `Student One Updated`

### TC-USER-03 - Admin Gets User By ID

**Request**

- Method: `GET`
- URL: `http://localhost:8080/users/{{studentUserId}}`
- Headers: `Authorization: Bearer {{adminToken}}`

**Thunder Client Tests**

- Status Code: `200`
- Response Body JSON property `id` equals: `{{studentUserId}}`

### TC-USER-04 - Student Cannot Get User By ID

**Request**

- Method: `GET`
- URL: `http://localhost:8080/users/{{studentUserId}}`
- Headers: `Authorization: Bearer {{studentToken}}`

**Thunder Client Tests**

- Status Code: `403`
- Response Body contains: `Insufficient permissions for this resource`

### TC-USER-05 - Gateway User Register Endpoint

**Request**

- Method: `POST`
- URL: `http://localhost:8080/users/register`
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

**Thunder Client Tests**

- Status Code: `201`
- Response Body JSON property `email` equals: `gateway-user@test.com`

### TC-USER-06 - Direct User Register Endpoint

**Request**

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

**Thunder Client Tests**

- Status Code: `201`
- Response Body JSON property `email` equals: `direct-user@test.com`

## Job Service

### TC-JOB-01 - Student Cannot Create Job

**Request**

- Method: `POST`
- URL: `http://localhost:8080/jobs`
- Headers:
  - `Authorization: Bearer {{studentToken}}`
  - `Content-Type: application/json`
- Body:

```json
{
  "title": "Unauthorized Student Job",
  "description": "Students should not create jobs"
}
```

**Thunder Client Tests**

- Status Code: `403`
- Response Body contains: `Insufficient permissions for this resource`

### TC-JOB-02 - Alumni Creates Job 1

**Request**

- Method: `POST`
- URL: `http://localhost:8080/jobs`
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

**Thunder Client Tests**

- Status Code: `200`
- Response Body JSON property `postedByEmail` equals: `{{alumniEmail}}`
- Response Body JSON property `status` equals: `OPEN`
- Save variable: `jobId1 = $.id`

### TC-JOB-03 - Alumni Creates Job 2

**Request**

- Method: `POST`
- URL: `http://localhost:8080/jobs`
- Headers:
  - `Authorization: Bearer {{alumniToken}}`
  - `Content-Type: application/json`
- Body:

```json
{
  "title": "Frontend React Intern",
  "description": "React, accessibility, and API integration internship"
}
```

**Thunder Client Tests**

- Status Code: `200`
- Response Body JSON property `status` equals: `OPEN`
- Save variable: `jobId2 = $.id`

### TC-JOB-04 - Alumni Creates Job 3

**Request**

- Method: `POST`
- URL: `http://localhost:8080/jobs`
- Headers:
  - `Authorization: Bearer {{alumniToken}}`
  - `Content-Type: application/json`
- Body:

```json
{
  "title": "QA Automation Trainee",
  "description": "Thunder Client, Selenium, and REST API testing"
}
```

**Thunder Client Tests**

- Status Code: `200`
- Response Body JSON property `status` equals: `OPEN`
- Save variable: `jobId3 = $.id`

### TC-JOB-05 - Admin Creates Job

**Request**

- Method: `POST`
- URL: `http://localhost:8080/jobs`
- Headers:
  - `Authorization: Bearer {{adminToken}}`
  - `Content-Type: application/json`
- Body:

```json
{
  "title": "Platform Support Role",
  "description": "Admin-created job for permission coverage"
}
```

**Thunder Client Tests**

- Status Code: `200`
- Response Body has JSON property: `id`

### TC-JOB-06 - Get All Jobs

**Request**

- Method: `GET`
- URL: `http://localhost:8080/jobs?page=0&size=10`
- Headers: `Authorization: Bearer {{studentToken}}`

**Thunder Client Tests**

- Status Code: `200`
- Response Body has JSON property: `content`

### TC-JOB-07 - Search Jobs By Keyword

**Request**

- Method: `GET`
- URL: `http://localhost:8080/jobs?keyword=react&page=0&size=10`
- Headers: `Authorization: Bearer {{studentToken}}`

**Thunder Client Tests**

- Status Code: `200`
- Response Body has JSON property: `content`

### TC-JOB-08 - Filter Jobs By Status

**Request**

- Method: `GET`
- URL: `http://localhost:8080/jobs?status=OPEN&page=0&size=10`
- Headers: `Authorization: Bearer {{studentToken}}`

**Thunder Client Tests**

- Status Code: `200`
- Response Body has JSON property: `content`

### TC-JOB-09 - Filter Jobs By Poster Email

**Request**

- Method: `GET`
- URL: `http://localhost:8080/jobs?postedByEmail={{alumniEmail}}&page=0&size=10`
- Headers: `Authorization: Bearer {{studentToken}}`

**Thunder Client Tests**

- Status Code: `200`
- Response Body has JSON property: `content`

### TC-JOB-10 - Combined Job Filters

**Request**

- Method: `GET`
- URL: `http://localhost:8080/jobs?keyword=spring&status=OPEN&postedByEmail={{alumniEmail}}&page=0&size=10`
- Headers: `Authorization: Bearer {{studentToken}}`

**Thunder Client Tests**

- Status Code: `200`
- Response Body has JSON property: `content`

### TC-JOB-11 - Invalid Job Status Filter

**Request**

- Method: `GET`
- URL: `http://localhost:8080/jobs?status=INVALID&page=0&size=10`
- Headers: `Authorization: Bearer {{studentToken}}`

**Thunder Client Tests**

- Status Code: `400`
- Response Body JSON property `error` equals: `Bad Request`
- Response Body contains: `Invalid job status`

### TC-JOB-12 - Student Saves Job

**Request**

- Method: `POST`
- URL: `http://localhost:8080/jobs/{{jobId1}}/save`
- Headers: `Authorization: Bearer {{studentToken}}`

**Thunder Client Tests**

- Status Code: `200`
- Response Body JSON property `id` equals: `{{jobId1}}`

### TC-JOB-13 - Duplicate Saved Job Is Rejected

**Request**

- Method: `POST`
- URL: `http://localhost:8080/jobs/{{jobId1}}/save`
- Headers: `Authorization: Bearer {{studentToken}}`

**Thunder Client Tests**

- Status Code: `409`
- Response Body contains: `Job is already saved`

### TC-JOB-14 - Student Gets Saved Jobs

**Request**

- Method: `GET`
- URL: `http://localhost:8080/jobs/saved?page=0&size=10`
- Headers: `Authorization: Bearer {{studentToken}}`

**Thunder Client Tests**

- Status Code: `200`
- Response Body has JSON property: `content`

### TC-JOB-15 - Alumni Cannot Save Job

**Request**

- Method: `POST`
- URL: `http://localhost:8080/jobs/{{jobId1}}/save`
- Headers: `Authorization: Bearer {{alumniToken}}`

**Thunder Client Tests**

- Status Code: `403`
- Response Body contains: `Only students can use saved jobs`

### TC-JOB-16 - Student Unsaves Job

**Request**

- Method: `DELETE`
- URL: `http://localhost:8080/jobs/{{jobId1}}/save`
- Headers: `Authorization: Bearer {{studentToken}}`

**Thunder Client Tests**

- Status Code: `204`

### TC-JOB-17 - Student Applies For Job

**Request**

- Method: `POST`
- URL: `http://localhost:8080/jobs/{{jobId1}}/apply`
- Headers: `Authorization: Bearer {{studentToken}}`

**Thunder Client Tests**

- Status Code: `200`
- Response Body JSON property `jobId` equals: `{{jobId1}}`
- Response Body JSON property `studentEmail` equals: `{{studentEmail}}`
- Response Body JSON property `status` equals: `APPLIED`
- Save variable: `applicationId = $.id`

### TC-JOB-18 - Duplicate Application Is Rejected

**Request**

- Method: `POST`
- URL: `http://localhost:8080/jobs/{{jobId1}}/apply`
- Headers: `Authorization: Bearer {{studentToken}}`

**Thunder Client Tests**

- Status Code: `409`
- Response Body contains: `Student already applied`

### TC-JOB-19 - Alumni Cannot Apply For Job

**Request**

- Method: `POST`
- URL: `http://localhost:8080/jobs/{{jobId1}}/apply`
- Headers: `Authorization: Bearer {{alumniToken}}`

**Thunder Client Tests**

- Status Code: `403`
- Response Body contains: `Insufficient permissions for this resource`

### TC-JOB-20 - Student Gets Own Applications

**Request**

- Method: `GET`
- URL: `http://localhost:8080/jobs/applications/me`
- Headers: `Authorization: Bearer {{studentToken}}`

**Thunder Client Tests**

- Status Code: `200`
- Response Body contains: `{{applicationId}}`

### TC-JOB-21 - Owning Alumni Gets Job Applications

**Request**

- Method: `GET`
- URL: `http://localhost:8080/jobs/{{jobId1}}/applications`
- Headers: `Authorization: Bearer {{alumniToken}}`

**Thunder Client Tests**

- Status Code: `200`
- Response Body contains: `{{applicationId}}`

### TC-JOB-22 - Student Cannot Manage Job Applications

**Request**

- Method: `GET`
- URL: `http://localhost:8080/jobs/{{jobId1}}/applications`
- Headers: `Authorization: Bearer {{studentToken}}`

**Thunder Client Tests**

- Status Code: `403`
- Response Body contains: `Only recruiters can manage applications`

### TC-JOB-23 - Alumni Updates Application To Reviewing

**Request**

- Method: `PATCH`
- URL: `http://localhost:8080/jobs/applications/{{applicationId}}/status`
- Headers:
  - `Authorization: Bearer {{alumniToken}}`
  - `Content-Type: application/json`
- Body:

```json
{
  "status": "REVIEWING"
}
```

**Thunder Client Tests**

- Status Code: `200`
- Response Body JSON property `status` equals: `REVIEWING`

### TC-JOB-24 - Invalid Application Status Transition

**Request**

- Method: `PATCH`
- URL: `http://localhost:8080/jobs/applications/{{applicationId}}/status`
- Headers:
  - `Authorization: Bearer {{alumniToken}}`
  - `Content-Type: application/json`
- Body:

```json
{
  "status": "ACCEPTED"
}
```

**Thunder Client Tests**

- Status Code: `400`
- Response Body contains: `Invalid application status transition`

### TC-JOB-25 - Alumni Updates Application To Shortlisted

**Request**

- Method: `PATCH`
- URL: `http://localhost:8080/jobs/applications/{{applicationId}}/status`
- Headers:
  - `Authorization: Bearer {{alumniToken}}`
  - `Content-Type: application/json`
- Body:

```json
{
  "status": "SHORTLISTED"
}
```

**Thunder Client Tests**

- Status Code: `200`
- Response Body JSON property `status` equals: `SHORTLISTED`

### TC-JOB-26 - Alumni Updates Application To Accepted

**Request**

- Method: `PATCH`
- URL: `http://localhost:8080/jobs/applications/{{applicationId}}/status`
- Headers:
  - `Authorization: Bearer {{alumniToken}}`
  - `Content-Type: application/json`
- Body:

```json
{
  "status": "ACCEPTED"
}
```

**Thunder Client Tests**

- Status Code: `200`
- Response Body JSON property `status` equals: `ACCEPTED`

### TC-JOB-27 - Alumni Gets Recruiter Dashboard

**Request**

- Method: `GET`
- URL: `http://localhost:8080/jobs/recruiter/dashboard`
- Headers: `Authorization: Bearer {{alumniToken}}`

**Thunder Client Tests**

- Status Code: `200`
- Response Body has JSON property: `jobsPosted`
- Response Body has JSON property: `totalApplications`

### TC-JOB-28 - Student Cannot Access Recruiter Dashboard

**Request**

- Method: `GET`
- URL: `http://localhost:8080/jobs/recruiter/dashboard`
- Headers: `Authorization: Bearer {{studentToken}}`

**Thunder Client Tests**

- Status Code: `403`
- Response Body contains: `Only recruiters can access dashboard`

### TC-JOB-29 - Owning Alumni Closes Job 2

**Request**

- Method: `PATCH`
- URL: `http://localhost:8080/jobs/{{jobId2}}/close`
- Headers: `Authorization: Bearer {{alumniToken}}`

**Thunder Client Tests**

- Status Code: `200`
- Response Body JSON property `id` equals: `{{jobId2}}`
- Response Body JSON property `status` equals: `CLOSED`

### TC-JOB-30 - Closed Job Appears In Closed Filter

**Request**

- Method: `GET`
- URL: `http://localhost:8080/jobs?status=CLOSED&page=0&size=10`
- Headers: `Authorization: Bearer {{studentToken}}`

**Thunder Client Tests**

- Status Code: `200`
- Response Body contains: `{{jobId2}}`

### TC-JOB-31 - Student Cannot Apply To Closed Job

**Request**

- Method: `POST`
- URL: `http://localhost:8080/jobs/{{jobId2}}/apply`
- Headers: `Authorization: Bearer {{studentToken}}`

**Thunder Client Tests**

- Status Code: `400`
- Response Body contains: `Applications are closed for this job`

### TC-JOB-32 - Admin Closes Job 3

**Request**

- Method: `PATCH`
- URL: `http://localhost:8080/jobs/{{jobId3}}/close`
- Headers: `Authorization: Bearer {{adminToken}}`

**Thunder Client Tests**

- Status Code: `200`
- Response Body JSON property `id` equals: `{{jobId3}}`
- Response Body JSON property `status` equals: `CLOSED`

### TC-JOB-33 - Missing Job Is Not Found

**Request**

- Method: `POST`
- URL: `http://localhost:8080/jobs/999999/save`
- Headers: `Authorization: Bearer {{studentToken}}`

**Thunder Client Tests**

- Status Code: `404`
- Response Body contains: `Job not found`

## Feed Service

### TC-FEED-01 - Student Creates Feed Post

**Request**

- Method: `POST`
- URL: `http://localhost:8080/feed/posts`
- Headers:
  - `Authorization: Bearer {{studentToken}}`
  - `Content-Type: application/json`
- Body:

```json
{
  "content": "Excited to join the DECP platform."
}
```

**Thunder Client Tests**

- Status Code: `200`
- Response Body JSON property `authorEmail` equals: `{{studentEmail}}`
- Save variable: `studentPostId = $.id`

### TC-FEED-02 - Alumni Creates Feed Post

**Request**

- Method: `POST`
- URL: `http://localhost:8080/feed/posts`
- Headers:
  - `Authorization: Bearer {{alumniToken}}`
  - `Content-Type: application/json`
- Body:

```json
{
  "content": "Sharing a new opportunity with students."
}
```

**Thunder Client Tests**

- Status Code: `200`
- Response Body JSON property `authorEmail` equals: `{{alumniEmail}}`
- Save variable: `alumniPostId = $.id`

### TC-FEED-03 - Admin Cannot Create Feed Post

**Request**

- Method: `POST`
- URL: `http://localhost:8080/feed/posts`
- Headers:
  - `Authorization: Bearer {{adminToken}}`
  - `Content-Type: application/json`
- Body:

```json
{
  "content": "Admin post attempt."
}
```

**Thunder Client Tests**

- Status Code: `403`
- Response Body contains: `Insufficient permissions for this resource`

### TC-FEED-04 - Get Feed Posts

**Request**

- Method: `GET`
- URL: `http://localhost:8080/feed/posts?page=0&size=10`
- Headers: `Authorization: Bearer {{studentToken}}`

**Thunder Client Tests**

- Status Code: `200`
- Response Body has JSON property: `content`

### TC-FEED-05 - Student Updates Own Feed Post

**Request**

- Method: `PUT`
- URL: `http://localhost:8080/feed/posts/{{studentPostId}}`
- Headers:
  - `Authorization: Bearer {{studentToken}}`
  - `Content-Type: application/json`
- Body:

```json
{
  "content": "Updated student feed post"
}
```

**Thunder Client Tests**

- Status Code: `200`
- Response Body JSON property `content` equals: `Updated student feed post`

### TC-FEED-06 - Non-Owner Cannot Update Feed Post

**Request**

- Method: `PUT`
- URL: `http://localhost:8080/feed/posts/{{studentPostId}}`
- Headers:
  - `Authorization: Bearer {{alumniToken}}`
  - `Content-Type: application/json`
- Body:

```json
{
  "content": "Unauthorized update attempt"
}
```

**Thunder Client Tests**

- Status Code: `403`
- Response Body contains: `Only the post owner can edit this post`

### TC-FEED-07 - Like Feed Post

**Request**

- Method: `POST`
- URL: `http://localhost:8080/feed/posts/{{alumniPostId}}/like`
- Headers: `Authorization: Bearer {{studentToken}}`

**Thunder Client Tests**

- Status Code: `200`
- Response Body has JSON property: `likes`

### TC-FEED-08 - Add First Comment

**Request**

- Method: `POST`
- URL: `http://localhost:8080/feed/posts/{{alumniPostId}}/comments`
- Headers:
  - `Authorization: Bearer {{studentToken}}`
  - `Content-Type: application/json`
- Body:

```json
{
  "content": "This looks useful."
}
```

**Thunder Client Tests**

- Status Code: `200`
- Response Body JSON property `postId` equals: `{{alumniPostId}}`
- Save variable: `commentId1 = $.id`

### TC-FEED-09 - Add Second Comment

**Request**

- Method: `POST`
- URL: `http://localhost:8080/feed/posts/{{alumniPostId}}/comments`
- Headers:
  - `Authorization: Bearer {{alumniToken}}`
  - `Content-Type: application/json`
- Body:

```json
{
  "content": "Happy to answer questions."
}
```

**Thunder Client Tests**

- Status Code: `200`
- Response Body JSON property `postId` equals: `{{alumniPostId}}`

### TC-FEED-10 - Get Comments For Feed Post

**Request**

- Method: `GET`
- URL: `http://localhost:8080/feed/posts/{{alumniPostId}}/comments`
- Headers: `Authorization: Bearer {{studentToken}}`

**Thunder Client Tests**

- Status Code: `200`
- Response Body contains: `{{commentId1}}`

### TC-FEED-11 - Missing Feed Post Like Is Not Found

**Request**

- Method: `POST`
- URL: `http://localhost:8080/feed/posts/999999/like`
- Headers: `Authorization: Bearer {{studentToken}}`

**Thunder Client Tests**

- Status Code: `404`
- Response Body contains: `Post not found`

### TC-FEED-12 - Non-Owner Cannot Delete Feed Post

**Request**

- Method: `DELETE`
- URL: `http://localhost:8080/feed/posts/{{alumniPostId}}`
- Headers: `Authorization: Bearer {{studentToken}}`

**Thunder Client Tests**

- Status Code: `403`
- Response Body contains: `Only the post owner or an admin can delete this post`

### TC-FEED-13 - Owner Deletes Own Feed Post

**Request**

- Method: `DELETE`
- URL: `http://localhost:8080/feed/posts/{{studentPostId}}`
- Headers: `Authorization: Bearer {{studentToken}}`

**Thunder Client Tests**

- Status Code: `204`

### TC-FEED-14 - Admin Deletes Feed Post

**Request**

- Method: `DELETE`
- URL: `http://localhost:8080/feed/posts/{{alumniPostId}}`
- Headers: `Authorization: Bearer {{adminToken}}`

**Thunder Client Tests**

- Status Code: `204`

### TC-FEED-15 - Missing Authorization Is Rejected

**Request**

- Method: `GET`
- URL: `http://localhost:8080/feed/posts`

**Thunder Client Tests**

- Status Code: `401`
- Response Body contains: `Missing or invalid Authorization header`

## Notification Service

Wait a few seconds after job creation, job application, and application status updates so Kafka-driven notifications can be consumed.

### TC-NOTIF-01 - Student Gets Notifications

**Request**

- Method: `GET`
- URL: `http://localhost:8080/notifications?page=0&size=10`
- Headers: `Authorization: Bearer {{studentToken}}`

**Thunder Client Tests**

- Status Code: `200`
- Response Body has JSON property: `content`
- Save variable from a visible unread notification: `notificationId = $.content[0].id`

### TC-NOTIF-02 - Student Gets Unread Notifications

**Request**

- Method: `GET`
- URL: `http://localhost:8080/notifications/unread`
- Headers: `Authorization: Bearer {{studentToken}}`

**Thunder Client Tests**

- Status Code: `200`

### TC-NOTIF-03 - Student Gets Unread Count

**Request**

- Method: `GET`
- URL: `http://localhost:8080/notifications/unread/count`
- Headers: `Authorization: Bearer {{studentToken}}`

**Thunder Client Tests**

- Status Code: `200`
- Response Body has JSON property: `count`

### TC-NOTIF-04 - Student Marks One Notification As Read

**Request**

- Method: `PATCH`
- URL: `http://localhost:8080/notifications/{{notificationId}}/read`
- Headers: `Authorization: Bearer {{studentToken}}`

**Thunder Client Tests**

- Status Code: `200`
- Response Body JSON property `isRead` equals: `true`

### TC-NOTIF-05 - Student Marks All Notifications As Read

**Request**

- Method: `PATCH`
- URL: `http://localhost:8080/notifications/read-all`
- Headers: `Authorization: Bearer {{studentToken}}`

**Thunder Client Tests**

- Status Code: `200`

### TC-NOTIF-06 - Student Unread Count Is Zero After Read All

**Request**

- Method: `GET`
- URL: `http://localhost:8080/notifications/unread/count`
- Headers: `Authorization: Bearer {{studentToken}}`

**Thunder Client Tests**

- Status Code: `200`
- Response Body JSON property `count` equals: `0`

### TC-NOTIF-07 - Alumni Gets Notifications

**Request**

- Method: `GET`
- URL: `http://localhost:8080/notifications?page=0&size=10`
- Headers: `Authorization: Bearer {{alumniToken}}`

**Thunder Client Tests**

- Status Code: `200`
- Response Body has JSON property: `content`

### TC-NOTIF-08 - Alumni Gets Unread Count

**Request**

- Method: `GET`
- URL: `http://localhost:8080/notifications/unread/count`
- Headers: `Authorization: Bearer {{alumniToken}}`

**Thunder Client Tests**

- Status Code: `200`
- Response Body has JSON property: `count`

### TC-NOTIF-09 - Missing Notification Is Not Found

**Request**

- Method: `PATCH`
- URL: `http://localhost:8080/notifications/999999/read`
- Headers: `Authorization: Bearer {{studentToken}}`

**Thunder Client Tests**

- Status Code: `404`
- Response Body contains: `Notification not found`

### TC-NOTIF-10 - Missing Authorization Is Rejected

**Request**

- Method: `GET`
- URL: `http://localhost:8080/notifications/unread/count`

**Thunder Client Tests**

- Status Code: `401`
- Response Body contains: `Missing or invalid Authorization header`
