# Getting Started with EduCreds API

**Official API Onboarding Guide**

- **Version:** 1.0.0
- **Last updated:** March 17, 2026
- **Base URL:** `https://api.educreds.xyz`
- **See also:** `api-documentation.md`

## Table of contents
1. [Overview](#overview)
2. [Choose your API](#choose-your-api)
3. [Platform API (JWT)](#platform-api-jwt)
4. [Standard API (X-Institution-ID)](#standard-api-x-institution-id)
5. [Verification API](#verification-api)
6. [Best practices](#best-practices)

## Overview
EduCreds provides three public API surfaces:
- **Platform API** for first-party workflows used by the EduCreds UI
- **Standard API** for LMS and third-party integrations with stable contracts
- **Verification API** for verification-only use cases

## Choose your API

### Use the Platform API when you need
- Institution onboarding and profile management
- Template issuance, marketplace flows, and governance
- Full platform features with JWT authentication

### Use the Standard API when you need
- A stable integration surface for external systems
- Certificate issuance, verification, and bulk operations
- Institution-scoped usage limits enforced via `X-Institution-ID`

### Use the Verification API when you need
- Verify credentials at scale without issuing
- API key or verifier JWT-based access

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
  "completionDate": "2026-03-17",
  "certificateType": "completion",
  "grade": "A+",
  "additionalData": {
    "courseName": "Advanced JavaScript"
  }
}
```

## Standard API (X-Institution-ID)

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
X-Institution-ID: <institution_id>
```

### 3) Issue a certificate
```http
POST /api/v1/standard/certificates/issue
X-Institution-ID: <institution_id>
Content-Type: application/json

{
  "student": { "id": "student_001", "name": "Jane Smith" },
  "course": { "name": "Data Science", "code": "DS101" },
  "achievement": {
    "grade": "A",
    "completionDate": "2026-03-17",
    "certificateType": "CERTIFICATE"
  }
}
```

## Verification API

### Option A: Use API key directly
```http
GET /api/v1/verify/{certificateId}
x-api-key: <clientId:secret>
```

### Option B: Exchange API key for verifier JWT
```http
POST /auth/verifier/login
Content-Type: application/json

{
  "apiKey": "<clientId:secret>"
}
```

Then call verification endpoints with:
```http
GET /api/v1/verify/{certificateId}
Authorization: Bearer <verifier_jwt>
```

### Verify in batch
```http
POST /api/v1/verify/batch
x-api-key: <clientId:secret>
Content-Type: application/json

{
  "certificateIds": ["cert-1", "cert-2"]
}
```

## Best practices
- Keep JWTs and API keys on server-side services only
- Use HTTPS in production
- Rotate keys periodically and revoke compromised keys
- Expect global rate limits (see `api-documentation.md`)
