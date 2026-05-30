# API Documentation

Complete API reference for Lead Finder SaaS Backend.

## Base URL

```
http://localhost:5000/api
```

## Authentication

All protected endpoints require a Bearer token in the Authorization header:

```
Authorization: Bearer <access_token>
```

## Response Format

All responses follow this format:

```json
{
  "success": true,
  "message": "Operation successful",
  "data": {}
}
```

Error responses:

```json
{
  "success": false,
  "message": "Error description",
  "error": "Details"
}
```

---

## Authentication Endpoints

### Register User

**POST** `/auth/register`

Create a new user account.

**Request Body:**
```json
{
  "email": "user@example.com",
  "name": "John Doe",
  "password": "SecurePassword123"
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "name": "John Doe",
      "role": "USER"
    },
    "accessToken": "jwt_token",
    "refreshToken": "refresh_jwt_token"
  }
}
```

---

### Login

**POST** `/auth/login`

Authenticate user and get tokens.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "name": "John Doe",
      "role": "USER"
    },
    "accessToken": "jwt_token",
    "refreshToken": "refresh_jwt_token"
  }
}
```

---

### Get Profile

**GET** `/auth/profile`

Get authenticated user's profile.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response (200):**
```json
{
  "success": true,
  "message": "Profile retrieved successfully",
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "USER",
    "createdAt": "2024-01-01T00:00:00Z"
  }
}
```

---

### Refresh Token

**POST** `/auth/refresh`

Generate new access token using refresh token.

**Headers:**
```
Authorization: Bearer <refresh_token>
```

**Response (200):**
```json
{
  "success": true,
  "message": "Token refreshed successfully",
  "data": {
    "accessToken": "new_jwt_token"
  }
}
```

---

## Scan Endpoints

### Start Scan

**POST** `/scan/start`

Start a new business search scan.

**Headers:**
```
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "query": "dentists in doha",
  "reviewLimit": 10,
  "checkWhatsapp": true,
  "scanMode": "both"
}
```

**Parameters:**
- `query` (string, required): Search query
- `reviewLimit` (number, default: 60): Limit of reviews to analyze per business
- `checkWhatsapp` (boolean, default: true): Validate WhatsApp numbers
- `scanMode` (string, default: "both"): Scan mode - "google_maps", "website", or "both"

**Response (201):**
```json
{
  "success": true,
  "message": "Scan job created successfully",
  "data": {
    "jobId": "scan-uuid",
    "status": "PENDING",
    "query": "dentists in doha"
  }
}
```

---

### Get Scan Status

**GET** `/scan/:jobId/status`

Get current status and progress of a scan.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Path Parameters:**
- `jobId` (string): Scan job ID

**Response (200):**
```json
{
  "success": true,
  "message": "Scan status retrieved",
  "data": {
    "id": "scan-uuid",
    "status": "RUNNING",
    "progress": 45,
    "processed": 120,
    "total": 350,
    "query": "dentists in doha",
    "createdAt": "2024-01-01T00:00:00Z",
    "completedAt": null
  }
}
```

**Status Values:**
- `PENDING`: Scan is queued
- `RUNNING`: Scan is in progress
- `COMPLETED`: Scan finished successfully
- `FAILED`: Scan encountered an error
- `CANCELLED`: Scan was cancelled

---

### Get Scan Results

**GET** `/scan/:jobId/results`

Get leads from completed scan with pagination and filtering.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Query Parameters:**
- `page` (number, default: 1): Page number
- `limit` (number, default: 10): Items per page (max: 100)
- `hasPhone` (boolean): Filter by phone availability
- `hasEmail` (boolean): Filter by email availability
- `hasWebsite` (boolean): Filter by website availability
- `hasSocialMedia` (boolean): Filter by social media presence
- `leadType` (string): Filter by lead type (CATEGORY_A, CATEGORY_B, NORMAL)
- `minRating` (number): Filter by minimum rating
- `sortBy` (string): Sort field (rating, reviewCount, createdAt)
- `sortOrder` (string): Sort order (asc, desc)

**Response (200):**
```json
{
  "success": true,
  "message": "Scan results retrieved",
  "data": {
    "scanJob": {
      "id": "scan-uuid",
      "query": "dentists in doha",
      "status": "COMPLETED",
      "progress": 100,
      "totalBusinesses": 350
    },
    "leads": [
      {
        "id": "lead-uuid",
        "businessName": "ABC Dental Clinic",
        "category": "Dentist",
        "address": "123 Main St, Doha",
        "phone": "+974123456789",
        "email": "contact@abcdental.com",
        "website": "https://abcdental.com",
        "rating": 4.5,
        "reviewCount": 87,
        "whatsappNumber": "+974123456789",
        "whatsappValid": true,
        "facebook": "https://facebook.com/abcdental",
        "instagram": "https://instagram.com/abcdental",
        "linkedin": null,
        "youtube": null,
        "tiktok": null,
        "mapsUrl": "https://maps.google.com/...",
        "leadType": "NORMAL",
        "suggestion": "Premium Lead - High quality business",
        "leadQuality": 85,
        "createdAt": "2024-01-01T00:00:00Z"
      }
    ],
    "statistics": {
      "total": 350,
      "withPhone": 280,
      "withEmail": 245,
      "withWebsite": 198,
      "categoryA": 45,
      "categoryB": 89
    },
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 350,
      "pages": 35
    }
  }
}
```

---

### Cancel Scan

**DELETE** `/scan/:jobId`

Cancel a scan job.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Path Parameters:**
- `jobId` (string): Scan job ID

**Response (200):**
```json
{
  "success": true,
  "message": "Scan job cancelled successfully"
}
```

---

### Get User Scans

**GET** `/scan/user/jobs`

Get all scan jobs for authenticated user.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Query Parameters:**
- `page` (number, default: 1): Page number
- `limit` (number, default: 10): Items per page

**Response (200):**
```json
{
  "success": true,
  "message": "User scans retrieved",
  "data": {
    "scanJobs": [
      {
        "id": "scan-uuid",
        "query": "dentists in doha",
        "status": "COMPLETED",
        "progress": 100,
        "totalBusinesses": 350,
        "processedBusinesses": 350,
        "createdAt": "2024-01-01T00:00:00Z",
        "completedAt": "2024-01-01T01:30:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 5,
      "pages": 1
    }
  }
}
```

---

## Export Endpoints

### Export to Excel

**GET** `/export/excel/:jobId`

Download scan results as XLSX file.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Path Parameters:**
- `jobId` (string): Scan job ID

**Response:**
- File download with mime type: `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`
- Filename: `leads-<jobId>.xlsx`

**Excel Sheets:**
1. **Leads**: All leads with all details
2. **Summary**: Statistics overview

---

### Export to CSV

**GET** `/export/csv/:jobId`

Download scan results as CSV file.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Path Parameters:**
- `jobId` (string): Scan job ID

**Response:**
- File download with mime type: `text/csv`
- Filename: `leads-<jobId>.csv`

---

## Health & Status

### Health Check

**GET** `/health`

Check API health status.

**Response (200):**
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00Z"
}
```

---

## Error Responses

### 400 Bad Request
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": {
    "body": "query is required"
  }
}
```

### 401 Unauthorized
```json
{
  "success": false,
  "message": "Unauthorized",
  "error": "Invalid token"
}
```

### 403 Forbidden
```json
{
  "success": false,
  "message": "Forbidden - Admin access required"
}
```

### 404 Not Found
```json
{
  "success": false,
  "message": "Route /api/invalid not found"
}
```

### 409 Conflict
```json
{
  "success": false,
  "message": "User already exists"
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "message": "Internal server error"
}
```

---

## Rate Limiting

All endpoints are rate limited to prevent abuse.

**Default Limits:**
- Window: 15 minutes (900,000 ms)
- Max Requests: 100 per window

**Rate Limit Headers:**
```
RateLimit-Limit: 100
RateLimit-Remaining: 95
RateLimit-Reset: 1609459200
```

---

## Pagination

Results are paginated to improve performance.

**Query Parameters:**
- `page` (number): Page number (default: 1, min: 1)
- `limit` (number): Items per page (default: 10, min: 1, max: 100)

**Response Format:**
```json
{
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 350,
    "pages": 35
  }
}
```

---

## Filtering

Filters can be combined to narrow results.

**Common Filters:**
- `hasPhone`: true/false
- `hasEmail`: true/false
- `hasWebsite`: true/false
- `hasSocialMedia`: true/false
- `leadType`: CATEGORY_A, CATEGORY_B, NORMAL
- `minRating`: 0-5

---

## Sorting

Results can be sorted by different fields.

**Sort Fields:**
- `rating`: Business rating
- `reviewCount`: Number of reviews
- `createdAt`: Creation date

**Sort Order:**
- `asc`: Ascending
- `desc`: Descending (default)

---

## Testing with cURL

### Register
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "name": "Test User",
    "password": "TestPassword123"
  }'
```

### Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPassword123"
  }'
```

### Start Scan
```bash
curl -X POST http://localhost:5000/api/scan/start \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "restaurants in new york",
    "reviewLimit": 10,
    "checkWhatsapp": true,
    "scanMode": "both"
  }'
```

### Get Results
```bash
curl -X GET "http://localhost:5000/api/scan/<jobId>/results?page=1&limit=10" \
  -H "Authorization: Bearer <access_token>"
```

### Export Excel
```bash
curl -X GET http://localhost:5000/api/export/excel/<jobId> \
  -H "Authorization: Bearer <access_token>" \
  -o leads.xlsx
```
