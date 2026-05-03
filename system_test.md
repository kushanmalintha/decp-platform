# System Test Cases - DECP Platform

## Overview
This document contains all system test cases for the DECP (Decentralized Professional Platform) system. The tests are organized by service and formatted for easy copy-paste into Thunder Client.

### Base URLs
- **API Gateway**: http://localhost:8080
- **Auth Service** (Direct): http://localhost:8081
- **User Service** (Direct): http://localhost:8082
- **Feed Service** (Direct): http://localhost:8083
- **Job Service** (Direct): http://localhost:8084

> Note: All requests should go through the API Gateway on port 8080. Direct service ports are for debugging only.

---

## 1. AUTHENTICATION SERVICE TESTS

### 1.1 User Registration

#### Test 1.1.1: Register New User - Success
**Method:** POST  
**URL:** `http://localhost:8080/auth/register`  
**Headers:**
```
Content-Type: application/json
```
**Request Body:**
```json
{
  "email": "user1@example.com",
  "password": "password123"
}
```
**Expected Response Status:** 200  
**Expected Response:**
```
User registered successfully
```

#### Test 1.1.2: Register User - Duplicate Email
**Method:** POST  
**URL:** `http://localhost:8080/auth/register`  
**Headers:**
```
Content-Type: application/json
```
**Request Body:**
```json
{
  "email": "user1@example.com",
  "password": "password456"
}
```
**Expected Response Status:** 400  
**Expected Response:**
```json
{
  "timestamp": "2024-05-03T10:30:00",
  "status": 400,
  "error": "Bad Request",
  "message": "Email already exists"
}
```

#### Test 1.1.3: Register User - Missing Email
**Method:** POST  
**URL:** `http://localhost:8080/auth/register`  
**Headers:**
```
Content-Type: application/json
```
**Request Body:**
```json
{
  "password": "password123"
}
```
**Expected Response Status:** 400  
**Expected Response:** Error message about missing email

#### Test 1.1.4: Register User - Missing Password
**Method:** POST  
**URL:** `http://localhost:8080/auth/register`  
**Headers:**
```
Content-Type: application/json
```
**Request Body:**
```json
{
  "email": "user2@example.com"
}
```
**Expected Response Status:** 400  
**Expected Response:** Error message about missing password

---

### 1.2 User Login

#### Test 1.2.1: Login - Success
**Method:** POST  
**URL:** `http://localhost:8080/auth/login`  
**Headers:**
```
Content-Type: application/json
```
**Request Body:**
```json
{
  "email": "user1@example.com",
  "password": "password123"
}
```
**Expected Response Status:** 200  
**Expected Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```
**Note:** Save the token for subsequent authenticated requests

#### Test 1.2.2: Login - Wrong Password
**Method:** POST  
**URL:** `http://localhost:8080/auth/login`  
**Headers:**
```
Content-Type: application/json
```
**Request Body:**
```json
{
  "email": "user1@example.com",
  "password": "wrongpassword"
}
```
**Expected Response Status:** 401  
**Expected Response:**
```json
{
  "timestamp": "2024-05-03T10:30:00",
  "status": 401,
  "error": "Unauthorized",
  "message": "Invalid email or password"
}
```

#### Test 1.2.3: Login - User Not Found
**Method:** POST  
**URL:** `http://localhost:8080/auth/login`  
**Headers:**
```
Content-Type: application/json
```
**Request Body:**
```json
{
  "email": "nonexistent@example.com",
  "password": "password123"
}
```
**Expected Response Status:** 401  
**Expected Response:**
```json
{
  "timestamp": "2024-05-03T10:30:00",
  "status": 401,
  "error": "Unauthorized",
  "message": "Invalid email or password"
}
```

---

### 1.3 Admin Role Assignment

#### Test 1.3.1: Assign Role to User - Success (Admin Only)
**Method:** PUT  
**URL:** `http://localhost:8080/auth/admin/role`  
**Headers:**
```
Content-Type: application/json
Authorization: Bearer {ADMIN_TOKEN}
```
**Request Body:**
```json
{
  "email": "user1@example.com",
  "role": "ADMIN"
}
```
**Expected Response Status:** 200  
**Expected Response:**
```json
{
  "userId": 1,
  "email": "user1@example.com",
  "role": "ADMIN",
  "message": "Role assigned successfully"
}
```

#### Test 1.3.2: Assign Role to User - Missing Authorization Header
**Method:** PUT  
**URL:** `http://localhost:8080/auth/admin/role`  
**Headers:**
```
Content-Type: application/json
```
**Request Body:**
```json
{
  "email": "user1@example.com",
  "role": "ADMIN"
}
```
**Expected Response Status:** 401  
**Expected Response:**
```
Missing or invalid Authorization header
```

#### Test 1.3.3: Assign Role to User - Invalid Token
**Method:** PUT  
**URL:** `http://localhost:8080/auth/admin/role`  
**Headers:**
```
Content-Type: application/json
Authorization: Bearer invalid_token_xyz
```
**Request Body:**
```json
{
  "email": "user1@example.com",
  "role": "ADMIN"
}
```
**Expected Response Status:** 401  
**Expected Response:**
```
Invalid or expired token
```

#### Test 1.3.4: Assign Role to User - Non-Admin User
**Method:** PUT  
**URL:** `http://localhost:8080/auth/admin/role`  
**Headers:**
```
Content-Type: application/json
Authorization: Bearer {USER_TOKEN}
```
**Request Body:**
```json
{
  "email": "user1@example.com",
  "role": "ADMIN"
}
```
**Expected Response Status:** 403  
**Expected Response:**
```
Only ADMIN users can assign roles
```

---

### 1.4 Authentication Test Endpoint

#### Test 1.4.1: Test Protected Endpoint - Success
**Method:** GET  
**URL:** `http://localhost:8080/auth/test`  
**Headers:**
```
Authorization: Bearer {VALID_TOKEN}
```
**Expected Response Status:** 200  
**Expected Response:**
```
Protected!
```

#### Test 1.4.2: Test Protected Endpoint - No Token
**Method:** GET  
**URL:** `http://localhost:8080/auth/test`  
**Expected Response Status:** 401  
**Expected Response:** Unauthorized

---

## 2. USER SERVICE TESTS

### 2.1 Get User Profile

#### Test 2.1.1: Get Current User Profile - Success
**Method:** GET  
**URL:** `http://localhost:8080/users/me`  
**Headers:**
```
X-User-Email: user1@example.com
```
**Expected Response Status:** 200  
**Expected Response:**
```json
{
  "id": 1,
  "email": "user1@example.com",
  "name": null,
  "role": "USER"
}
```

#### Test 2.1.2: Get Current User Profile - Missing X-User-Email Header
**Method:** GET  
**URL:** `http://localhost:8080/users/me`  
**Expected Response Status:** 400 or 500  
**Expected Response:** Error message

#### Test 2.1.3: Get User Profile by ID - Success
**Method:** GET  
**URL:** `http://localhost:8080/users/1`  
**Expected Response Status:** 200  
**Expected Response:**
```json
{
  "id": 1,
  "email": "user1@example.com",
  "name": null,
  "role": "USER"
}
```

#### Test 2.1.4: Get User Profile by ID - User Not Found
**Method:** GET  
**URL:** `http://localhost:8080/users/9999`  
**Expected Response Status:** 404  
**Expected Response:**
```json
{
  "timestamp": "2024-05-03T10:30:00",
  "status": 404,
  "error": "Not Found",
  "message": "User not found with ID: 9999"
}
```

---

### 2.2 Update User Profile

#### Test 2.2.1: Update User Profile - Success
**Method:** PUT  
**URL:** `http://localhost:8080/users/me`  
**Headers:**
```
Content-Type: application/json
X-User-Email: user1@example.com
```
**Request Body:**
```json
{
  "name": "John Doe"
}
```
**Expected Response Status:** 200  
**Expected Response:**
```json
{
  "id": 1,
  "email": "user1@example.com",
  "name": "John Doe",
  "role": "USER"
}
```

#### Test 2.2.2: Update User Profile - Missing Header
**Method:** PUT  
**URL:** `http://localhost:8080/users/me`  
**Headers:**
```
Content-Type: application/json
```
**Request Body:**
```json
{
  "name": "Jane Doe"
}
```
**Expected Response Status:** 400 or 500  
**Expected Response:** Error message

#### Test 2.2.3: Update User Profile - Empty Name
**Method:** PUT  
**URL:** `http://localhost:8080/users/me`  
**Headers:**
```
Content-Type: application/json
X-User-Email: user1@example.com
```
**Request Body:**
```json
{
  "name": ""
}
```
**Expected Response Status:** 200  
**Expected Response:**
```json
{
  "id": 1,
  "email": "user1@example.com",
  "name": "",
  "role": "USER"
}
```

---

## 3. FEED SERVICE TESTS

### 3.1 Create Post

#### Test 3.1.1: Create Post - Success
**Method:** POST  
**URL:** `http://localhost:8080/feed/posts`  
**Headers:**
```
Content-Type: application/json
X-User-Email: user1@example.com
```
**Request Body:**
```json
{
  "content": "This is my first post!"
}
```
**Expected Response Status:** 200  
**Expected Response:**
```json
{
  "id": 1,
  "content": "This is my first post!",
  "authorEmail": "user1@example.com",
  "likes": 0,
  "createdAt": "2024-05-03T10:30:00"
}
```

#### Test 3.1.2: Create Post - Empty Content
**Method:** POST  
**URL:** `http://localhost:8080/feed/posts`  
**Headers:**
```
Content-Type: application/json
X-User-Email: user1@example.com
```
**Request Body:**
```json
{
  "content": ""
}
```
**Expected Response Status:** 200 or 400  
**Expected Response:** Depends on validation; may accept or reject

#### Test 3.1.3: Create Post - Missing Email Header
**Method:** POST  
**URL:** `http://localhost:8080/feed/posts`  
**Headers:**
```
Content-Type: application/json
```
**Request Body:**
```json
{
  "content": "Test post without email"
}
```
**Expected Response Status:** 400 or 500  
**Expected Response:** Error message

#### Test 3.1.4: Create Post - Long Content
**Method:** POST  
**URL:** `http://localhost:8080/feed/posts`  
**Headers:**
```
Content-Type: application/json
X-User-Email: user1@example.com
```
**Request Body:**
```json
{
  "content": "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur."
}
```
**Expected Response Status:** 200  
**Expected Response:**
```json
{
  "id": 2,
  "content": "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.",
  "authorEmail": "user1@example.com",
  "likes": 0,
  "createdAt": "2024-05-03T10:30:00"
}
```

---

### 3.2 Get All Posts

#### Test 3.2.1: Get All Posts - Default Pagination
**Method:** GET  
**URL:** `http://localhost:8080/feed/posts`  
**Expected Response Status:** 200  
**Expected Response:**
```json
{
  "content": [
    {
      "id": 1,
      "content": "This is my first post!",
      "authorEmail": "user1@example.com",
      "likes": 0,
      "createdAt": "2024-05-03T10:30:00"
    },
    {
      "id": 2,
      "content": "Another post",
      "authorEmail": "user2@example.com",
      "likes": 5,
      "createdAt": "2024-05-03T10:30:00"
    }
  ],
  "pageable": {
    "pageNumber": 0,
    "pageSize": 20,
    "sort": {
      "empty": false,
      "unsorted": false,
      "sorted": true
    }
  },
  "totalElements": 2,
  "totalPages": 1,
  "last": true,
  "size": 20,
  "number": 0,
  "sort": {
    "empty": false,
    "unsorted": false,
    "sorted": true
  },
  "numberOfElements": 2,
  "first": true,
  "empty": false
}
```

#### Test 3.2.2: Get All Posts - Custom Pagination (Page 0, Size 5)
**Method:** GET  
**URL:** `http://localhost:8080/feed/posts?page=0&size=5`  
**Expected Response Status:** 200  
**Expected Response:** Posts paginated with size 5

#### Test 3.2.3: Get All Posts - Page Out of Range
**Method:** GET  
**URL:** `http://localhost:8080/feed/posts?page=100&size=20`  
**Expected Response Status:** 200  
**Expected Response:** Empty content array

#### Test 3.2.4: Get All Posts - Custom Sorting
**Method:** GET  
**URL:** `http://localhost:8080/feed/posts?page=0&size=10&sort=createdAt,desc`  
**Expected Response Status:** 200  
**Expected Response:** Posts sorted by createdAt in descending order

---

### 3.3 Like Post

#### Test 3.3.1: Like Post - Success
**Method:** POST  
**URL:** `http://localhost:8080/feed/posts/1/like`  
**Expected Response Status:** 200  
**Expected Response:**
```json
{
  "id": 1,
  "content": "This is my first post!",
  "authorEmail": "user1@example.com",
  "likes": 1,
  "createdAt": "2024-05-03T10:30:00"
}
```

#### Test 3.3.2: Like Post - Multiple Times
**Method:** POST  
**URL:** `http://localhost:8080/feed/posts/1/like`  
**Expected Response Status:** 200  
**Expected Response:**
```json
{
  "id": 1,
  "content": "This is my first post!",
  "authorEmail": "user1@example.com",
  "likes": 2,
  "createdAt": "2024-05-03T10:30:00"
}
```

#### Test 3.3.3: Like Post - Post Not Found
**Method:** POST  
**URL:** `http://localhost:8080/feed/posts/9999/like`  
**Expected Response Status:** 404  
**Expected Response:**
```json
{
  "timestamp": "2024-05-03T10:30:00",
  "status": 404,
  "error": "Not Found",
  "message": "Post not found with ID: 9999"
}
```

#### Test 3.3.4: Like Post - Invalid Post ID
**Method:** POST  
**URL:** `http://localhost:8080/feed/posts/abc/like`  
**Expected Response Status:** 400  
**Expected Response:** Bad request - invalid ID format

---

### 3.4 Add Comment to Post

#### Test 3.4.1: Add Comment - Success
**Method:** POST  
**URL:** `http://localhost:8080/feed/posts/1/comments`  
**Headers:**
```
Content-Type: application/json
X-User-Email: user2@example.com
```
**Request Body:**
```json
{
  "content": "Great post!"
}
```
**Expected Response Status:** 200  
**Expected Response:**
```json
{
  "id": 1,
  "postId": 1,
  "authorEmail": "user2@example.com",
  "content": "Great post!",
  "createdAt": "2024-05-03T10:30:00"
}
```

#### Test 3.4.2: Add Comment - Empty Content
**Method:** POST  
**URL:** `http://localhost:8080/feed/posts/1/comments`  
**Headers:**
```
Content-Type: application/json
X-User-Email: user2@example.com
```
**Request Body:**
```json
{
  "content": ""
}
```
**Expected Response Status:** 200 or 400  
**Expected Response:** Depends on validation

#### Test 3.4.3: Add Comment - Post Not Found
**Method:** POST  
**URL:** `http://localhost:8080/feed/posts/9999/comments`  
**Headers:**
```
Content-Type: application/json
X-User-Email: user2@example.com
```
**Request Body:**
```json
{
  "content": "Comment on non-existent post"
}
```
**Expected Response Status:** 404  
**Expected Response:**
```json
{
  "timestamp": "2024-05-03T10:30:00",
  "status": 404,
  "error": "Not Found",
  "message": "Post not found with ID: 9999"
}
```

#### Test 3.4.4: Add Comment - Missing Email Header
**Method:** POST  
**URL:** `http://localhost:8080/feed/posts/1/comments`  
**Headers:**
```
Content-Type: application/json
```
**Request Body:**
```json
{
  "content": "Comment without email"
}
```
**Expected Response Status:** 400 or 500  
**Expected Response:** Error message

#### Test 3.4.5: Add Comment - Long Content
**Method:** POST  
**URL:** `http://localhost:8080/feed/posts/1/comments`  
**Headers:**
```
Content-Type: application/json
X-User-Email: user2@example.com
```
**Request Body:**
```json
{
  "content": "This is a very long comment. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua."
}
```
**Expected Response Status:** 200  
**Expected Response:**
```json
{
  "id": 2,
  "postId": 1,
  "authorEmail": "user2@example.com",
  "content": "This is a very long comment. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
  "createdAt": "2024-05-03T10:30:00"
}
```

---

### 3.5 Get Comments on Post

#### Test 3.5.1: Get Comments - Success (Post Has Comments)
**Method:** GET  
**URL:** `http://localhost:8080/feed/posts/1/comments`  
**Expected Response Status:** 200  
**Expected Response:**
```json
[
  {
    "id": 1,
    "postId": 1,
    "authorEmail": "user2@example.com",
    "content": "Great post!",
    "createdAt": "2024-05-03T10:30:00"
  },
  {
    "id": 2,
    "postId": 1,
    "authorEmail": "user3@example.com",
    "content": "I agree!",
    "createdAt": "2024-05-03T10:31:00"
  }
]
```

#### Test 3.5.2: Get Comments - Post With No Comments
**Method:** GET  
**URL:** `http://localhost:8080/feed/posts/2/comments`  
**Expected Response Status:** 200  
**Expected Response:**
```json
[]
```

#### Test 3.5.3: Get Comments - Post Not Found
**Method:** GET  
**URL:** `http://localhost:8080/feed/posts/9999/comments`  
**Expected Response Status:** 404  
**Expected Response:**
```json
{
  "timestamp": "2024-05-03T10:30:00",
  "status": 404,
  "error": "Not Found",
  "message": "Post not found with ID: 9999"
}
```

---

## 4. JOB SERVICE TESTS

### 4.1 Create Job

#### Test 4.1.1: Create Job - Success
**Method:** POST  
**URL:** `http://localhost:8080/jobs`  
**Headers:**
```
Content-Type: application/json
X-User-Email: recruiter@company.com
```
**Request Body:**
```json
{
  "title": "Senior Software Engineer",
  "description": "We are looking for a Senior Software Engineer with 5+ years of experience in Java and Spring Boot."
}
```
**Expected Response Status:** 200  
**Expected Response:**
```json
{
  "id": 1,
  "title": "Senior Software Engineer",
  "description": "We are looking for a Senior Software Engineer with 5+ years of experience in Java and Spring Boot.",
  "postedByEmail": "recruiter@company.com",
  "createdAt": "2024-05-03T10:30:00"
}
```

#### Test 4.1.2: Create Job - Missing Title
**Method:** POST  
**URL:** `http://localhost:8080/jobs`  
**Headers:**
```
Content-Type: application/json
X-User-Email: recruiter@company.com
```
**Request Body:**
```json
{
  "description": "Job description without title"
}
```
**Expected Response Status:** 400  
**Expected Response:** Error message about missing title

#### Test 4.1.3: Create Job - Missing Description
**Method:** POST  
**URL:** `http://localhost:8080/jobs`  
**Headers:**
```
Content-Type: application/json
X-User-Email: recruiter@company.com
```
**Request Body:**
```json
{
  "title": "Job Title"
}
```
**Expected Response Status:** 400  
**Expected Response:** Error message about missing description

#### Test 4.1.4: Create Job - Missing Email Header
**Method:** POST  
**URL:** `http://localhost:8080/jobs`  
**Headers:**
```
Content-Type: application/json
```
**Request Body:**
```json
{
  "title": "Senior Developer",
  "description": "Job without email header"
}
```
**Expected Response Status:** 400 or 500  
**Expected Response:** Error message

#### Test 4.1.5: Create Job - Empty Title and Description
**Method:** POST  
**URL:** `http://localhost:8080/jobs`  
**Headers:**
```
Content-Type: application/json
X-User-Email: recruiter@company.com
```
**Request Body:**
```json
{
  "title": "",
  "description": ""
}
```
**Expected Response Status:** 400  
**Expected Response:** Error message about empty fields

#### Test 4.1.6: Create Job - Very Long Title
**Method:** POST  
**URL:** `http://localhost:8080/jobs`  
**Headers:**
```
Content-Type: application/json
X-User-Email: recruiter@company.com
```
**Request Body:**
```json
{
  "title": "This is a very long job title that might exceed character limit restrictions for job titles in the database",
  "description": "Job description"
}
```
**Expected Response Status:** 200 or 400  
**Expected Response:** Depends on validation rules

---

### 4.2 Get All Jobs

#### Test 4.2.1: Get All Jobs - Default Pagination
**Method:** GET  
**URL:** `http://localhost:8080/jobs`  
**Expected Response Status:** 200  
**Expected Response:**
```json
{
  "content": [
    {
      "id": 1,
      "title": "Senior Software Engineer",
      "description": "We are looking for a Senior Software Engineer with 5+ years of experience in Java and Spring Boot.",
      "postedByEmail": "recruiter@company.com",
      "createdAt": "2024-05-03T10:30:00"
    },
    {
      "id": 2,
      "title": "Junior Developer",
      "description": "Fresh graduates welcome",
      "postedByEmail": "recruiter@company.com",
      "createdAt": "2024-05-03T10:31:00"
    }
  ],
  "pageable": {
    "pageNumber": 0,
    "pageSize": 20,
    "sort": {
      "empty": false,
      "unsorted": false,
      "sorted": true
    }
  },
  "totalElements": 2,
  "totalPages": 1,
  "last": true,
  "size": 20,
  "number": 0,
  "sort": {
    "empty": false,
    "unsorted": false,
    "sorted": true
  },
  "numberOfElements": 2,
  "first": true,
  "empty": false
}
```

#### Test 4.2.2: Get All Jobs - Custom Pagination (Page 0, Size 5)
**Method:** GET  
**URL:** `http://localhost:8080/jobs?page=0&size=5`  
**Expected Response Status:** 200  
**Expected Response:** Jobs paginated with size 5

#### Test 4.2.3: Get All Jobs - Page Out of Range
**Method:** GET  
**URL:** `http://localhost:8080/jobs?page=100&size=20`  
**Expected Response Status:** 200  
**Expected Response:** Empty content array

#### Test 4.2.4: Get All Jobs - Sorted by createdAt Descending
**Method:** GET  
**URL:** `http://localhost:8080/jobs?page=0&size=10&sort=createdAt,desc`  
**Expected Response Status:** 200  
**Expected Response:** Jobs sorted by creation time in descending order

#### Test 4.2.5: Get All Jobs - No Jobs Available
**Method:** GET  
**URL:** `http://localhost:8080/jobs`  
**Expected Response Status:** 200  
**Expected Response:**
```json
{
  "content": [],
  "pageable": {...},
  "totalElements": 0,
  "totalPages": 0,
  "empty": true
}
```

---

### 4.3 Apply for Job

#### Test 4.3.1: Apply for Job - Success
**Method:** POST  
**URL:** `http://localhost:8080/jobs/1/apply`  
**Headers:**
```
X-User-Email: applicant@example.com
```
**Expected Response Status:** 200  
**Expected Response:**
```json
{
  "id": 1,
  "jobId": 1,
  "applicantEmail": "applicant@example.com",
  "appliedAt": "2024-05-03T10:30:00"
}
```

#### Test 4.3.2: Apply for Job - Job Not Found
**Method:** POST  
**URL:** `http://localhost:8080/jobs/9999/apply`  
**Headers:**
```
X-User-Email: applicant@example.com
```
**Expected Response Status:** 404  
**Expected Response:**
```json
{
  "timestamp": "2024-05-03T10:30:00",
  "status": 404,
  "error": "Not Found",
  "message": "Job not found with ID: 9999"
}
```

#### Test 4.3.3: Apply for Job - Missing Email Header
**Method:** POST  
**URL:** `http://localhost:8080/jobs/1/apply`  
**Expected Response Status:** 400 or 500  
**Expected Response:** Error message

#### Test 4.3.4: Apply for Job - Duplicate Application
**Method:** POST  
**URL:** `http://localhost:8080/jobs/1/apply`  
**Headers:**
```
X-User-Email: applicant@example.com
```
**Expected Response Status:** 200 or 400  
**Expected Response:** Either success (if duplicates allowed) or conflict error

#### Test 4.3.5: Apply for Job - Invalid Job ID
**Method:** POST  
**URL:** `http://localhost:8080/jobs/abc/apply`  
**Headers:**
```
X-User-Email: applicant@example.com
```
**Expected Response Status:** 400  
**Expected Response:** Bad request - invalid ID format

#### Test 4.3.6: Apply for Multiple Jobs
**Method:** POST  
**URL:** `http://localhost:8080/jobs/2/apply`  
**Headers:**
```
X-User-Email: applicant@example.com
```
**Expected Response Status:** 200  
**Expected Response:**
```json
{
  "id": 2,
  "jobId": 2,
  "applicantEmail": "applicant@example.com",
  "appliedAt": "2024-05-03T10:31:00"
}
```

---

### 4.4 Get Job Applications

#### Test 4.4.1: Get Applications - Success (Job Has Applications)
**Method:** GET  
**URL:** `http://localhost:8080/jobs/1/applications`  
**Expected Response Status:** 200  
**Expected Response:**
```json
[
  {
    "id": 1,
    "jobId": 1,
    "applicantEmail": "applicant1@example.com",
    "appliedAt": "2024-05-03T10:30:00"
  },
  {
    "id": 2,
    "jobId": 1,
    "applicantEmail": "applicant2@example.com",
    "appliedAt": "2024-05-03T10:31:00"
  }
]
```

#### Test 4.4.2: Get Applications - Job With No Applications
**Method:** GET  
**URL:** `http://localhost:8080/jobs/2/applications`  
**Expected Response Status:** 200  
**Expected Response:**
```json
[]
```

#### Test 4.4.3: Get Applications - Job Not Found
**Method:** GET  
**URL:** `http://localhost:8080/jobs/9999/applications`  
**Expected Response Status:** 404  
**Expected Response:**
```json
{
  "timestamp": "2024-05-03T10:30:00",
  "status": 404,
  "error": "Not Found",
  "message": "Job not found with ID: 9999"
}
```

#### Test 4.4.4: Get Applications - Invalid Job ID
**Method:** GET  
**URL:** `http://localhost:8080/jobs/abc/applications`  
**Expected Response Status:** 400  
**Expected Response:** Bad request - invalid ID format

---

## 5. INTEGRATION TEST SCENARIOS

### 5.1 Complete User Journey - Registration to Job Application

#### Scenario 5.1.1: New User Registration and Job Application
**Steps:**
1. Register new user
2. Login to get token
3. Update user profile
4. View available jobs
5. Apply for a job

**Test Requests:**

**Step 1: Register**
```
POST http://localhost:8080/auth/register
Content-Type: application/json

{
  "email": "newuser@example.com",
  "password": "SecurePass123"
}
```
Expected: 200, user registered

**Step 2: Login**
```
POST http://localhost:8080/auth/login
Content-Type: application/json

{
  "email": "newuser@example.com",
  "password": "SecurePass123"
}
```
Expected: 200, receive JWT token

**Step 3: Update Profile**
```
PUT http://localhost:8080/users/me
Content-Type: application/json
X-User-Email: newuser@example.com

{
  "name": "New User"
}
```
Expected: 200, profile updated

**Step 4: Get Available Jobs**
```
GET http://localhost:8080/jobs
```
Expected: 200, list of jobs

**Step 5: Apply for Job**
```
POST http://localhost:8080/jobs/1/apply
X-User-Email: newuser@example.com
```
Expected: 200, application created

---

### 5.2 Complete User Journey - Registration to Post and Comment

#### Scenario 5.2.1: New User Registration and Social Engagement
**Steps:**
1. Register new user
2. Login
3. Create a post
4. View all posts
5. Like a post
6. Add comment to post
7. View comments

**Test Requests:**

**Step 1: Register**
```
POST http://localhost:8080/auth/register
Content-Type: application/json

{
  "email": "socialuser@example.com",
  "password": "SecurePass123"
}
```

**Step 2: Login**
```
POST http://localhost:8080/auth/login
Content-Type: application/json

{
  "email": "socialuser@example.com",
  "password": "SecurePass123"
}
```

**Step 3: Create Post**
```
POST http://localhost:8080/feed/posts
Content-Type: application/json
X-User-Email: socialuser@example.com

{
  "content": "I am excited to join this professional network!"
}
```

**Step 4: Get All Posts**
```
GET http://localhost:8080/feed/posts?page=0&size=10
```

**Step 5: Like a Post**
```
POST http://localhost:8080/feed/posts/1/like
```

**Step 6: Add Comment**
```
POST http://localhost:8080/feed/posts/1/comments
Content-Type: application/json
X-User-Email: socialuser@example.com

{
  "content": "Great post by someone else!"
}
```

**Step 7: View Comments**
```
GET http://localhost:8080/feed/posts/1/comments
```

---

### 5.3 Admin Scenario - Role Assignment

#### Scenario 5.3.1: Admin Creates Job and Assigns Roles
**Steps:**
1. Login as existing admin
2. Assign new admin role to user
3. Create job posting
4. View applications

**Test Requests:**

**Step 1: Login**
```
POST http://localhost:8080/auth/login
Content-Type: application/json

{
  "email": "admin@company.com",
  "password": "AdminPass123"
}
```

**Step 2: Assign Admin Role**
```
PUT http://localhost:8080/auth/admin/role
Content-Type: application/json
Authorization: Bearer {ADMIN_TOKEN}

{
  "email": "newadmin@company.com",
  "role": "ADMIN"
}
```

**Step 3: Create Job (as new admin)**
```
POST http://localhost:8080/jobs
Content-Type: application/json
X-User-Email: newadmin@company.com

{
  "title": "Product Manager",
  "description": "Looking for an experienced Product Manager to lead our product strategy."
}
```

**Step 4: View Job Applications**
```
GET http://localhost:8080/jobs/1/applications
```

---

## 6. ERROR HANDLING TEST CASES

### 6.1 Common Error Scenarios

#### Test 6.1.1: Empty Request Body
**Method:** POST  
**URL:** `http://localhost:8080/auth/register`  
**Headers:**
```
Content-Type: application/json
```
**Request Body:**
```json
{}
```
**Expected Response Status:** 400  
**Expected Response:** Validation error

#### Test 6.1.2: Invalid JSON Format
**Method:** POST  
**URL:** `http://localhost:8080/auth/login`  
**Headers:**
```
Content-Type: application/json
```
**Request Body:**
```
{
  "email": "user@example.com",
  "password": "pass123"
  INVALID JSON
}
```
**Expected Response Status:** 400  
**Expected Response:** JSON parsing error

#### Test 6.1.3: Unsupported Media Type
**Method:** POST  
**URL:** `http://localhost:8080/auth/register`  
**Headers:**
```
Content-Type: application/xml
```
**Request Body:**
```xml
<user><email>test@example.com</email></user>
```
**Expected Response Status:** 415  
**Expected Response:** Unsupported media type error

#### Test 6.1.4: Method Not Allowed
**Method:** PUT  
**URL:** `http://localhost:8080/auth/register`  
**Expected Response Status:** 405  
**Expected Response:** Method not allowed

#### Test 6.1.5: Not Found Endpoint
**Method:** GET  
**URL:** `http://localhost:8080/api/nonexistent`  
**Expected Response Status:** 404  
**Expected Response:** Endpoint not found

#### Test 6.1.6: Missing Required Header
**Method:** POST  
**URL:** `http://localhost:8080/feed/posts`  
**Headers:**
```
Content-Type: application/json
```
**Request Body:**
```json
{
  "content": "Test post"
}
```
**Expected Response Status:** 400 or 500  
**Expected Response:** Missing X-User-Email header error

---

### 6.2 Database Constraint Violations

#### Test 6.2.1: Duplicate Email Registration
**Method:** POST  
**URL:** `http://localhost:8080/auth/register`  
**Headers:**
```
Content-Type: application/json
```
**Request Body:**
```json
{
  "email": "existing@example.com",
  "password": "password123"
}
```
**Expected Response Status:** 400  
**Expected Response:** Email already exists error

---

## 7. PERFORMANCE TEST CASES

### 7.1 Load Testing Endpoints

#### Test 7.1.1: Get Posts - Large Dataset
**Method:** GET  
**URL:** `http://localhost:8080/feed/posts?page=0&size=100`  
**Expected Response Status:** 200  
**Expected Response:** 100 posts or available count  
**Performance Metric:** Response time should be < 2 seconds

#### Test 7.1.2: Get Jobs - Large Dataset
**Method:** GET  
**URL:** `http://localhost:8080/jobs?page=0&size=100`  
**Expected Response Status:** 200  
**Expected Response:** 100 jobs or available count  
**Performance Metric:** Response time should be < 2 seconds

---

## 8. SECURITY TEST CASES

### 8.1 Authentication and Authorization

#### Test 8.1.1: Access Protected Resource Without Token
**Method:** GET  
**URL:** `http://localhost:8080/users/me`  
**Expected Response Status:** 400 or 500  
**Expected Response:** Error due to missing header

#### Test 8.1.2: Access Protected Resource With Expired Token
**Method:** GET  
**URL:** `http://localhost:8080/users/me`  
**Headers:**
```
Authorization: Bearer expired_token_xyz
```
**Expected Response Status:** 401  
**Expected Response:** Token validation error

#### Test 8.1.3: SQL Injection Attempt in Query
**Method:** GET  
**URL:** `http://localhost:8080/users/1' OR '1'='1`  
**Expected Response Status:** 400  
**Expected Response:** Invalid ID format

#### Test 8.1.4: XSS Attempt in Post Content
**Method:** POST  
**URL:** `http://localhost:8080/feed/posts`  
**Headers:**
```
Content-Type: application/json
X-User-Email: user@example.com
```
**Request Body:**
```json
{
  "content": "<script>alert('XSS')</script>"
}
```
**Expected Response Status:** 200  
**Expected Response:** Content should be stored safely, escaped on output

---

## 9. DATA VALIDATION TEST CASES

### 9.1 Input Validation

#### Test 9.1.1: Very Long Email
**Method:** POST  
**URL:** `http://localhost:8080/auth/register`  
**Headers:**
```
Content-Type: application/json
```
**Request Body:**
```json
{
  "email": "verylongemailaddresswithmanycharactersthatmightexceeaddressverylongemailaddresswithmanycharacters@example.com",
  "password": "password123"
}
```
**Expected Response Status:** 200 or 400  
**Expected Response:** Depends on email validation rules

#### Test 9.1.2: Invalid Email Format
**Method:** POST  
**URL:** `http://localhost:8080/auth/register`  
**Headers:**
```
Content-Type: application/json
```
**Request Body:**
```json
{
  "email": "notanemailaddress",
  "password": "password123"
}
```
**Expected Response Status:** 400  
**Expected Response:** Invalid email format error

#### Test 9.1.3: Weak Password
**Method:** POST  
**URL:** `http://localhost:8080/auth/register`  
**Headers:**
```
Content-Type: application/json
```
**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "123"
}
```
**Expected Response Status:** 200 or 400  
**Expected Response:** Depends on password strength validation

---

## 10. TESTING CHECKLIST

Use this checklist to verify all test scenarios have been executed:

### Authentication Service
- [ ] Test 1.1.1 - Register new user success
- [ ] Test 1.1.2 - Register duplicate email
- [ ] Test 1.1.3 - Register missing email
- [ ] Test 1.1.4 - Register missing password
- [ ] Test 1.2.1 - Login success
- [ ] Test 1.2.2 - Login wrong password
- [ ] Test 1.2.3 - Login user not found
- [ ] Test 1.3.1 - Assign role success
- [ ] Test 1.3.2 - Assign role missing auth header
- [ ] Test 1.3.3 - Assign role invalid token
- [ ] Test 1.3.4 - Assign role non-admin user
- [ ] Test 1.4.1 - Test protected endpoint success
- [ ] Test 1.4.2 - Test protected endpoint no token

### User Service
- [ ] Test 2.1.1 - Get current user profile success
- [ ] Test 2.1.2 - Get current user profile missing header
- [ ] Test 2.1.3 - Get user by ID success
- [ ] Test 2.1.4 - Get user by ID not found
- [ ] Test 2.2.1 - Update profile success
- [ ] Test 2.2.2 - Update profile missing header
- [ ] Test 2.2.3 - Update profile empty name

### Feed Service
- [ ] Test 3.1.1 - Create post success
- [ ] Test 3.1.2 - Create post empty content
- [ ] Test 3.1.3 - Create post missing email header
- [ ] Test 3.1.4 - Create post long content
- [ ] Test 3.2.1 - Get all posts default pagination
- [ ] Test 3.2.2 - Get all posts custom pagination
- [ ] Test 3.2.3 - Get all posts page out of range
- [ ] Test 3.2.4 - Get all posts custom sorting
- [ ] Test 3.3.1 - Like post success
- [ ] Test 3.3.2 - Like post multiple times
- [ ] Test 3.3.3 - Like post not found
- [ ] Test 3.3.4 - Like post invalid ID
- [ ] Test 3.4.1 - Add comment success
- [ ] Test 3.4.2 - Add comment empty content
- [ ] Test 3.4.3 - Add comment post not found
- [ ] Test 3.4.4 - Add comment missing email header
- [ ] Test 3.4.5 - Add comment long content
- [ ] Test 3.5.1 - Get comments success
- [ ] Test 3.5.2 - Get comments no comments
- [ ] Test 3.5.3 - Get comments post not found

### Job Service
- [ ] Test 4.1.1 - Create job success
- [ ] Test 4.1.2 - Create job missing title
- [ ] Test 4.1.3 - Create job missing description
- [ ] Test 4.1.4 - Create job missing email header
- [ ] Test 4.1.5 - Create job empty fields
- [ ] Test 4.1.6 - Create job very long title
- [ ] Test 4.2.1 - Get all jobs default pagination
- [ ] Test 4.2.2 - Get all jobs custom pagination
- [ ] Test 4.2.3 - Get all jobs page out of range
- [ ] Test 4.2.4 - Get all jobs custom sorting
- [ ] Test 4.2.5 - Get all jobs no jobs available
- [ ] Test 4.3.1 - Apply for job success
- [ ] Test 4.3.2 - Apply for job not found
- [ ] Test 4.3.3 - Apply for job missing email header
- [ ] Test 4.3.4 - Apply for job duplicate application
- [ ] Test 4.3.5 - Apply for job invalid ID
- [ ] Test 4.3.6 - Apply for multiple jobs
- [ ] Test 4.4.1 - Get applications success
- [ ] Test 4.4.2 - Get applications no applications
- [ ] Test 4.4.3 - Get applications not found
- [ ] Test 4.4.4 - Get applications invalid ID

### Integration Scenarios
- [ ] Scenario 5.1.1 - Complete user job application journey
- [ ] Scenario 5.2.1 - Complete social engagement journey
- [ ] Scenario 5.3.1 - Admin role assignment scenario

### Error Handling
- [ ] Test 6.1.1 - Empty request body
- [ ] Test 6.1.2 - Invalid JSON format
- [ ] Test 6.1.3 - Unsupported media type
- [ ] Test 6.1.4 - Method not allowed
- [ ] Test 6.1.5 - Not found endpoint
- [ ] Test 6.1.6 - Missing required header
- [ ] Test 6.2.1 - Duplicate email registration

### Performance
- [ ] Test 7.1.1 - Get posts large dataset
- [ ] Test 7.1.2 - Get jobs large dataset

### Security
- [ ] Test 8.1.1 - Access without token
- [ ] Test 8.1.2 - Access with expired token
- [ ] Test 8.1.3 - SQL injection attempt
- [ ] Test 8.1.4 - XSS attempt

### Data Validation
- [ ] Test 9.1.1 - Very long email
- [ ] Test 9.1.2 - Invalid email format
- [ ] Test 9.1.3 - Weak password

---

## Notes for Testing

1. **Token Management**: Save the JWT token obtained from login endpoint to use in subsequent tests that require authentication.

2. **Test Data**: Create consistent test data by following the registration and creation flows sequentially.

3. **Pagination**: Default page size is usually 20. Adjust the `page` and `size` parameters as needed for testing.

4. **Timestamps**: Response timestamps will vary based on actual test execution time.

5. **IDs**: Auto-generated IDs will increment. Use the actual IDs returned from creation endpoints in subsequent tests.

6. **Headers**: The `X-User-Email` header simulates user context. This is typically extracted from JWT tokens in production.

7. **Base URL**: Tests use `http://localhost:8080` as the base URL (API Gateway). Ensure all services are running and accessible.

8. **Error Responses**: Error responses follow the standard format: `{ timestamp, status, error, message }`

---

**Document Version**: 1.0  
**Last Updated**: May 3, 2026  
**Platform**: DECP Platform v1.0
