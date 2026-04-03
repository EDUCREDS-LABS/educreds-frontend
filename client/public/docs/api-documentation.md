# API Documentation

**Official Public API Reference**

- **Version:** 1.0.0
- **Last updated:** March 17, 2026
- **Base URL (production):** `https://api.educreds.xyz`
- **Base URL (sandbox):** `https://sandbox-api.educreds.xyz`

## Table of contents
1. [Getting started](#getting-started)
2. [Authentication and headers](#authentication-and-headers)
3. [Auth decision tree](#auth-decision-tree)
4. [Current API map](#current-api-map)
5. [Platform API (JWT)](#platform-api-jwt)
6. [Verification API](#verification-api)
7. [Standard API](#standard-api)
8. [Issuance API (batch/single)](#issuance-api-batchsingle)
9. [Unified issuance API](#unified-issuance-api)
10. [Marketplace API](#marketplace-api)
11. [Institutions](#institutions)
12. [Governance](#governance)
13. [Response formats](#response-formats)
14. [Error handling](#error-handling)
15. [Rate limiting](#rate-limiting)
16. [Internal-only endpoints](#internal-only-endpoints)

## Getting started

### Prerequisites
- Platform API: JWT from `/auth/login` or `/auth/institution/login`
- Verification API: `x-api-key` header or a verifier JWT from `/auth/verifier/login`
- Standard API: `X-Institution-ID` header (required)
- For file uploads: supported formats include PDF, PNG, JPG

### Quick start (Platform API)
```bash
# 1. Authenticate
curl -X POST https://api.educreds.xyz/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "your_password"
  }'

# Response includes: token, user info
# Use token in Authorization header: Bearer <token>
```

## Authentication and headers

### Platform API (JWT)
- **Header:** `Authorization: Bearer <jwt_token>`
- Used by `/auth/*`, `/api/certificates/*`, `/api/institutions/*`, `/marketplace/*`, `/governance/*`

### Verification API (API key or verifier JWT)
- **Option A:** `x-api-key: <clientId:secret>`
- **Option B:** `Authorization: Bearer <verifier_jwt>` from `POST /auth/verifier/login`

### Standard and Unified APIs
- **Required:** `X-Institution-ID: <institution_id>`
- Used by `/api/v1/standard/*` and `/api/v1/unified/*`

## Auth decision tree

Use this quick decision tree to choose the correct auth method:

1. Are you issuing certificates or using marketplace/governance?
- Yes: use Platform API with JWT.
- No: continue.

2. Are you integrating an LMS/SIS and need a stable contract?
- Yes: use Standard API with `X-Institution-ID`.
- No: continue.

3. Are you only verifying credentials?
- Yes: use Verification API with `x-api-key` or verifier JWT.

## Current API map

This is the current public surface aligned to backend controllers.

| Area | Base path | Auth | Notes |
| --- | --- | --- | --- |
| Platform Auth | `/auth` | JWT | User auth, verifier login, session verify |
| Institution Auth | `/auth/institution` | Institution auth | OTP onboarding and login |
| Certificates | `/api/certificates` | JWT | Issuance, revoke, diagnostics |
| Verification | `/api/v1/verify` | API key or verifier JWT | Verification only |
| Standard API | `/api/v1/standard` | `X-Institution-ID` | Stable LMS contract |
| Issuance API | `/api/v1/issue` | `X-Institution-ID` | Simple issuance endpoints |
| Unified API | `/api/v1/unified` | `X-Institution-ID` | Unified issuance flow |
| Marketplace | `/marketplace` | JWT | Templates, purchases, analytics |
| Institutions | `/api/institutions` | JWT | Register, profile, verification |
| Governance | `/governance` and `/api/governance` | JWT | Proposals, voting, analytics |
| Developer Portal | `/api/developer-portal` | Public | API key registration |

## Platform API (JWT)

### User registration
**Endpoint:** `POST /auth/register`

### User login
**Endpoint:** `POST /auth/login`

### Verifier login (returns verifier JWT)
**Endpoint:** `POST /auth/verifier/login`

**Request:**
```json
{ "apiKey": "<clientId:secret>" }
```

### Get profile
**Endpoint:** `GET /auth/profile`

### Logout
**Endpoint:** `POST /auth/logout`

### Verify session
**Endpoint:** `GET /auth/verify-session`

### Institution auth (OTP flow)
- `POST /auth/institution/register/step1`
- `POST /auth/institution/register/step2`
- `POST /auth/institution/register/step3`
- `POST /auth/institution/login`
- `GET /auth/institution/profile`
- `POST /auth/institution/change-password`

### Issue certificate from template
**Endpoint:** `POST /api/certificates/issue-from-template`

### Issue certificate with PDF upload (legacy)
**Endpoint:** `POST /api/certificates/issue`

### Bulk issue from template
**Endpoint:** `POST /api/certificates/bulk-issue-template`

### Bulk issue with legacy PDF
**Endpoint:** `POST /api/certificates/bulk-issue-legacy-pdf`

### Wallet-direct issuance
- `POST /api/certificates/issue/wallet-direct/prepare`
- `POST /api/certificates/issue/wallet-direct/confirm`

### Certificate verification (platform endpoints)
- `GET /api/certificates/verify/:id`
- `GET /api/certificates/verify/ipfs/:ipfsHash`
- `GET /api/certificates/verify/token/:tokenId`

### Certificate management
- `POST /api/certificates/:certificateId/revoke`
- `POST /api/certificates/bulk-revoke`
- `GET /api/certificates/wallet/:walletAddress`
- `GET /api/certificates/institution/:institutionId`
- `GET /api/certificates/institution` (uses JWT or query)
- `GET /api/certificates/diagnostics/issuance`
- `POST /api/certificates/issuance-diagnostics`

## Verification API
Base path: `/api/v1/verify`

**Headers:**
- `x-api-key: <clientId:secret>`
- or `Authorization: Bearer <verifier_jwt>`

### Verify certificate
**Endpoint:** `GET /api/v1/verify/:certificateId`

### Verify by wallet address
**Endpoint:** `GET /api/v1/verify/wallet/:walletAddress`

### Batch verification
**Endpoint:** `POST /api/v1/verify/batch`

### Example: Verify a certificate (API key)
```http
GET /api/v1/verify/cert-uuid-123
x-api-key: <clientId:secret>
```

### Example: Batch verification (verifier JWT)
```http
POST /api/v1/verify/batch
Authorization: Bearer <verifier_jwt>
Content-Type: application/json

{
  "certificateIds": ["cert-1", "cert-2"]
}
```

## Standard API
Base path: `/api/v1/standard`

**Headers:**
- `X-Institution-ID: <institution_id>`
- `Content-Type: application/json`

### Health
**Endpoint:** `GET /api/v1/standard/health`

### Issue certificate
**Endpoint:** `POST /api/v1/standard/certificates/issue`

### Verify certificate
**Endpoint:** `POST /api/v1/standard/certificates/verify`

### Institution certificates
**Endpoint:** `GET /api/v1/standard/institutions/:institutionId/certificates`

### Bulk issue
**Endpoint:** `POST /api/v1/standard/certificates/issue/bulk`

### PDF upload and issue
- `POST /api/v1/standard/certificates/upload-pdf`
- `POST /api/v1/standard/certificates/issue-with-pdf`

### Example: Issue certificate (Standard API)
```http
POST /api/v1/standard/certificates/issue
X-Institution-ID: inst_123
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

### Example: Verify certificate (Standard API)
```http
POST /api/v1/standard/certificates/verify
X-Institution-ID: inst_123
Content-Type: application/json

{
  "credentialId": "cert-uuid"
}
```

## Issuance API (batch/single)
Base path: `/api/v1/issue`

**Headers:**
- `X-Institution-ID: <institution_id>`

### Issue single certificate
**Endpoint:** `POST /api/v1/issue/certificate`

### Issue batch
**Endpoint:** `POST /api/v1/issue/batch`

## Unified issuance API
Base path: `/api/v1/unified`

**Headers:**
- `X-Institution-ID: <institution_id>`

### Issue certificate
**Endpoint:** `POST /api/v1/unified/certificates/issue`

### List issuance methods
**Endpoint:** `GET /api/v1/unified/methods`

## Marketplace API
Base path: `/marketplace`

### Templates
- `GET /marketplace/templates`
- `GET /marketplace/templates/:id`
- `POST /marketplace/templates/:id/purchase`

### Institution templates and analytics
- `GET /marketplace/institutions/:institutionId/templates`
- `GET /marketplace/institutions/:institutionId/analytics`
- `POST /marketplace/institutions/:institutionId/templates/:templateId/use`

### Bulk issuance (marketplace)
- `POST /marketplace/bulk/issue`
- `GET /marketplace/bulk/status/:jobId`
- `POST /marketplace/bulk/certificate/single`

### Designer endpoints
- `POST /marketplace/designer/templates`
- `PUT /marketplace/designer/templates/:id`
- `GET /marketplace/designer/:designerId/templates`

## Institutions
Base path: `/api/institutions`

- `POST /api/institutions/register`
- `POST /api/institutions/login`
- `GET /api/institutions/profile`
- `GET /api/institutions/verification-status`
- `POST /api/institutions/verification-documents` (multipart field name: `documents`)
- `GET /api/institutions/:institutionId/blockchain-status`

## Governance
Base path: `/governance` and `/api/governance`

### Legacy proposal flow
- `POST /governance/proposal`
- `GET /governance/proposal/:id`
- `POST /governance/proposal/:id/execute`
- `GET /governance/proposals`

### Phase 2 governance APIs
- `GET /governance/proposals/list`
- `GET /governance/proposals/:id/detail`
- `POST /governance/proposals/create`
- `POST /governance/proposals/:id/vote`
- `GET /governance/proposals/:id/voting-power`
- `GET /governance/proposals/:id/votes`
- `GET /governance/proposals/states/summary`

### Public governance
- `GET /governance/public/proposals`
- `GET /governance/public/proposals/:id/detail`
- `GET /governance/public/proposals/:id/vote/tx-data`
- `GET /governance/public/proposals/:id/voting-power`
- `POST /governance/public/proposals/:id/vote/wallet`

### Governance analytics
- `GET /governance/analytics/active-proposals`
- `GET /governance/analytics/governance-summary`
- `GET /governance/analytics/institution-metrics/:id`
- `GET /governance/analytics/poic-scores`
- `GET /governance/analytics/poic-statistics`

## Response formats

### Platform API
Platform endpoints return direct JSON objects that vary by endpoint. Do not rely on a universal wrapper.

### Verification API
Returns a verification object with at least `certificateId` and `isValid`. Some fields are optional.

### Standard API
Returns a standardized envelope:
```json
{
  "success": true,
  "data": {},
  "error": null,
  "meta": {
    "timestamp": "2026-03-17T10:30:00Z",
    "version": "1.0.0",
    "requestId": "req_..."
  }
}
```

## Error handling

### Standard error response
```json
{
  "statusCode": 400,
  "message": "Error description",
  "error": "Bad Request",
  "timestamp": "2026-03-17T10:30:00Z"
}
```

### HTTP status codes
| Code | Meaning | Description |
| --- | --- | --- |
| 200 | Success | Request completed successfully |
| 201 | Created | Resource created successfully |
| 202 | Accepted | Request accepted for processing |
| 400 | Bad Request | Invalid request parameters |
| 401 | Unauthorized | Missing or invalid token |
| 403 | Forbidden | Permission denied |
| 404 | Not Found | Resource not found |
| 409 | Conflict | Resource already exists |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Server Error | Internal server error |

## Rate limiting
Requests are rate limited globally at **300 requests per 15 minutes per IP** in production.

When rate limited (`429 Too Many Requests`):
```json
{
  "error": "Too many requests"
}
```

Check the `Retry-After` header for seconds until reset.

## Internal-only endpoints
The following endpoints exist but are **not** part of the public API surface and are intentionally omitted from public integration guides:
- `/dev/*`
- `/api/admin/*`
- `/api/students/*`
- `/api/payments/*`
- `/api/subscription/*`
- `/api/w3c-credentials/*`
- `/api/hybrid-verification/*`
