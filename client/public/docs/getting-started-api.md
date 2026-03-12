# Getting Started with EduCreds API

**Official API Onboarding Guide**

- **Version:** 1.0.0
- **Last updated:** January 28, 2026
- **Base URL:** `https://api.educreds.xyz`

## Table of contents
1. [Overview](#overview)
2. [Choose your API](#choose-your-api)
3. [Platform API (JWT)](#platform-api-jwt)
4. [Standard API (API key)](#standard-api-api-key)
5. [Verification API](#verification-api)
6. [Best practices](#best-practices)

## Overview
EduCreds provides two API surfaces:
- **Platform API** for first-party workflows used by the EduCreds UI
- **Standard API** for LMS and third-party integrations with stable contracts

## Choose your API

### Use the Platform API when you need
- Institution onboarding and profile management
- Template issuance, marketplace flows, and governance
- Full platform features with JWT authentication

### Use the Standard API when you need
- A stable integration surface for external systems
- API key-based authentication and quota enforcement
- Issuance, verification, and bulk operations for LMS/SIS

## Platform API (JWT)

### 1) Authenticate
```http
POST /auth/login
Content-Type: application/json

{
  "email": "admin@university.edu",
  "password": "your_password"
}
```

### 2) Call a protected endpoint
```http
POST /api/certificates/issue-from-template
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "templateId": "template-uuid",
  "recipientWallet": "0x...",
  "recipientName": "Jane Smith",
  "completionDate": "2026-03-10",
  "certificateType": "completion",
  "grade": "A+",
  "additionalData": {
    "courseName": "Advanced JavaScript"
  }
}
```

## Standard API (API key)

### 1) Register as a developer
```http
POST /api/developer-portal/register
Content-Type: application/json

{
  "companyName": "Example LMS",
  "email": "dev@example.com",
  "website": "https://example.com",
  "useCase": "LMS_INTEGRATION",
  "expectedVolume": "MEDIUM"
}
```

### 2) Health check
```http
GET /api/v1/standard/health
Authorization: Bearer <api_key>
X-Institution-ID: <institution_id>
```

### 3) Issue a certificate
```http
POST /api/v1/standard/certificates/issue
Authorization: Bearer <api_key>
X-Institution-ID: <institution_id>
Content-Type: application/json

{
  "student": { "id": "student_001", "name": "Jane Smith" },
  "course": { "name": "Data Science", "code": "DS101" },
  "achievement": {
    "grade": "A",
    "completionDate": "2026-03-10",
    "certificateType": "CERTIFICATE"
  }
}
```

## Verification API

### Verify a certificate
```http
GET /api/v1/verify/{certificateId}
Authorization: Bearer <api_key>
```

### Verify in batch
```http
POST /api/v1/verify/batch
Authorization: Bearer <api_key>
Content-Type: application/json

{
  "certificateIds": ["cert-1", "cert-2"]
}
```

## Best practices
- Keep API keys and JWTs on server-side services only
- Use HTTPS in production
- Rotate keys periodically and revoke compromised keys
- Expect rate limits on API key endpoints based on plan
