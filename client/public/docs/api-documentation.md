# API Documentation

**Official Public API Reference**

- **Version:** 1.0.0
- **Last updated:** January 28, 2026
- **Base URL:** `https://api.educreds.xyz`

## Table of contents
1. [Getting started](#getting-started)
2. [Authentication](#authentication)
3. [Certificate issuance](#certificate-issuance)
4. [Bulk operations](#bulk-operations)
5. [Verification](#verification)
6. [Marketplace](#marketplace)
7. [Institutions](#institutions)
8. [Governance](#governance)
9. [Standard API](#standard-api)
10. [Error handling](#error-handling)
11. [Rate limiting](#rate-limiting)

## Getting started

### Prerequisites
- Valid API credentials (email and password or wallet address)
- Authorization token (JWT) for platform APIs
- API key and institution ID for the Standard and Verification APIs
- For file uploads: supported file formats include PDF, PNG, JPG

### Quick start
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

### API response format
All endpoints return JSON. Some examples show raw payloads for readability.

If your implementation wraps responses, use this structure:

```json
{
  "data": { "/* Response payload */": true },
  "status": "success|error",
  "timestamp": "2026-01-28T10:30:00Z",
  "statusCode": 200
}
```

## Authentication

### User registration
**Endpoint:** `POST /auth/register`

**Request:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123",
  "name": "John Doe"
}
```

**Response:**
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "John Doe"
  },
  "token": "eyJhbGc..."
}
```

### User login
**Endpoint:** `POST /auth/login`

**Request:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

**Response:**
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "John Doe"
  },
  "token": "eyJhbGc..."
}
```

### Get profile
**Endpoint:** `GET /auth/profile`

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "name": "John Doe"
}
```

### Logout
**Endpoint:** `POST /auth/logout`

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "message": "Logged out successfully"
}
```

### Institution auth (unified flow)
These endpoints support OTP-first onboarding with optional wallet linking.

- `POST /auth/institution/register/step1`
- `POST /auth/institution/register/step2`
- `POST /auth/institution/register/step3`
- `POST /auth/institution/login`
- `GET /auth/institution/profile`

## Certificate issuance

### Issue certificate from template (recommended)
**Endpoint:** `POST /api/certificates/issue-from-template`

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request:**
```json
{
  "templateId": "template-uuid",
  "recipientWallet": "0x742d35Cc6634C0532925a3b844Bc869Ee94C6e54",
  "recipientName": "Jane Smith",
  "completionDate": "2026-01-28",
  "certificateType": "completion",
  "grade": "A+",
  "additionalData": {
    "courseName": "Advanced JavaScript",
    "instructorName": "John Instructor"
  }
}
```

**Response:** `201 Created`
```json
{
  "id": "cert-uuid",
  "recipientWallet": "0x742d35Cc6634C0532925a3b844Bc869Ee94C6e54",
  "recipientName": "Jane Smith",
  "templateId": "template-uuid",
  "ipfsHash": "QmXxxx...",
  "status": "ISSUED",
  "verificationUrl": "https://educreds.xyz/verify/cert-uuid",
  "createdAt": "2026-01-28T10:30:00Z"
}
```

- **Performance:** approximately 300 to 500 ms
- **Recommended for:** individual certificates and immediate issuance

### Issue certificate with PDF upload (legacy)
**Endpoint:** `POST /api/certificates/issue`

**Headers:**
```
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**Form data:**
```
studentWalletAddress: 0x742d35Cc6634C0532925a3b844Bc869Ee94C6e54
studentName: Jane Smith
courseName: Advanced JavaScript
grade: A+
completionDate: 2026-01-28
certificateType: completion
certificateFile: <binary PDF file>
```

**Response:** `201 Created`
```json
{
  "id": "cert-uuid",
  "studentAddress": "0x742d35Cc6634C0532925a3b844Bc869Ee94C6e54",
  "studentName": "Jane Smith",
  "ipfsHash": "QmXxxx...",
  "status": "ISSUED",
  "createdAt": "2026-01-28T10:30:00Z"
}
```

- **Performance:** approximately 500 to 800 ms
- **Note:** use template-based issuance for better performance

## Bulk operations

### Bulk issue certificates from template
**Endpoint:** `POST /api/certificates/bulk-issue-template`

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request:**
```json
{
  "templateId": "template-uuid",
  "certificates": [
    {
      "studentName": "Jane Smith",
      "studentEmail": "jane@example.xyz",
      "walletAddress": "0x1111...",
      "completionDate": "2026-01-28",
      "grade": "A+",
      "courseName": "JavaScript"
    },
    {
      "studentName": "John Doe",
      "studentEmail": "john@example.com",
      "walletAddress": "0x2222...",
      "completionDate": "2026-01-28",
      "grade": "A",
      "courseName": "JavaScript"
    }
  ]
}
```

**Response:** `202 Accepted`
```json
{
  "jobId": "bulk-job-uuid",
  "status": "PROCESSING",
  "totalRecipients": 2,
  "processedCount": 0,
  "successCount": 0,
  "failedCount": 0,
  "createdAt": "2026-01-28T10:30:00Z"
}
```

### Check bulk operation status
**Endpoint:** `GET /marketplace/bulk/status/:jobId`

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "jobId": "bulk-job-uuid",
  "status": "PROCESSING|COMPLETED|FAILED",
  "totalRecipients": 100,
  "processedCount": 75,
  "successCount": 72,
  "failedCount": 3,
  "progress": "75%"
}
```

### Bulk issue via marketplace
**Endpoint:** `POST /marketplace/bulk/issue`

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request:**
```json
{
  "institutionId": "inst-uuid",
  "templateId": "template-uuid",
  "recipients": [
    {
      "name": "Jane Smith",
      "email": "jane@example.com",
      "walletAddress": "0x...",
      "customData": {
        "grade": "A+",
        "completionDate": "2026-01-28"
      }
    }
  ]
}
```

**Response:** `202 Accepted`
```json
{
  "jobId": "bulk-job-uuid",
  "status": "QUEUED",
  "totalRecipients": 1,
  "createdAt": "2026-01-28T10:30:00Z"
}
```

## Verification

### Verify certificate
**Endpoint:** `GET /api/v1/verify/:certificateId`

**Headers:** `Authorization: Bearer <api_key>`

**Example:** `GET /api/v1/verify/cert-uuid-123`

**Response:**
```json
{
  "certificateId": "cert-uuid-123",
  "isValid": true,
  "issuedBy": "University of Example",
  "recipientName": "Jane Smith",
  "courseName": "Advanced JavaScript",
  "grade": "A+",
  "issuedAt": "2026-01-28T10:30:00Z",
  "completionDate": "2026-01-28",
  "blockchainTxHash": "minted:1234",
  "tokenId": 1234,
  "ipfsHash": "QmXxxx...",
  "isMinted": true,
  "status": "ISSUED"
}
```

### Verify by wallet address
**Endpoint:** `GET /api/v1/verify/wallet/:walletAddress`

**Response:**
```json
{
  "walletAddress": "0x742d35Cc6634C0532925a3b844Bc869Ee94C6e54",
  "certificates": [
    {
      "certificateId": "cert-uuid-1",
      "courseName": "JavaScript",
      "institutionName": "University of Example",
      "isValid": true,
      "isMinted": true,
      "tokenId": 1234
    }
  ]
}
```

### Batch verification
**Endpoint:** `POST /api/v1/verify/batch`

**Request:**
```json
{
  "certificateIds": ["cert-1", "cert-2", "cert-3"]
}
```

**Response:**
```json
{
  "results": [
    {
      "certificateId": "cert-1",
      "isValid": true,
      "status": "ISSUED",
      "verifiedAt": "2026-01-28T10:30:00Z"
    }
  ]
}
```

## Marketplace

### Get available templates
**Endpoint:** `GET /marketplace/templates`

**Query parameters:**
- `page` optional, default `1`
- `limit` optional, default `10`
- `category` optional
- `search` optional

**Response:**
```json
{
  "templates": [
    {
      "id": "template-uuid",
      "name": "Modern Completion Certificate",
      "category": "completion",
      "description": "Professional certificate design",
      "designerId": "designer-uuid",
      "price": 29.99,
      "currency": "USD",
      "previewUrl": "https://...",
      "rating": 4.8,
      "downloads": 150,
      "status": "active"
    }
  ],
  "pagination": {
    "page": 1,
    "perPage": 20,
    "total": 250,
    "pages": 13
  }
}
```

### Get template details
**Endpoint:** `GET /marketplace/templates/:id`

**Response:**
```json
{
  "id": "template-uuid",
  "name": "Modern Completion Certificate",
  "category": "completion",
  "description": "Professional certificate design",
  "designer": {
    "id": "designer-uuid",
    "name": "Design Studio",
    "rating": 4.8
  },
  "price": 29.99,
  "currency": "USD",
  "previewUrl": "https://...",
  "templateFields": ["name", "course", "date", "grade"],
  "rating": 4.5,
  "downloads": 150,
  "createdAt": "2025-12-23T09:00:00Z"
}
```

### Purchase template
**Endpoint:** `POST /marketplace/templates/:templateId/purchase`

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request:**
```json
{
  "institutionId": "inst-uuid"
}
```

**Response:** `200 OK`
```json
{
  "purchaseId": "purchase-uuid",
  "templateId": "template-uuid",
  "institutionId": "inst-uuid",
  "status": "COMPLETED",
  "price": 29.99,
  "purchasedAt": "2026-01-28T10:30:00Z"
}
```

### Get institution templates
**Endpoint:** `GET /marketplace/institutions/:institutionId/templates`

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "templates": [
    {
      "id": "template-uuid",
      "name": "Modern Completion Certificate",
      "category": "completion",
      "purchasedAt": "2026-01-28T10:30:00Z"
    }
  ],
  "totalCount": 5
}
```

### Get institution analytics
**Endpoint:** `GET /marketplace/institutions/:institutionId/analytics`

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "institutionId": "inst-uuid",
  "totalTemplatesUsed": 5,
  "totalCertificatesIssued": 450,
  "totalRevenue": 2500
}
```

## Institutions

### Register institution
**Endpoint:** `POST /api/institutions/register`

**Request:**
```json
{
  "name": "University of Example",
  "email": "admin@university.edu",
  "password": "securePassword123",
  "walletAddress": "0x...",
  "registrationNumber": "REG-001",
  "contactInfo": {
    "phone": "+1234567890",
    "address": "123 Main St",
    "city": "Example City",
    "country": "Country"
  }
}
```

**Response:**
```json
{
  "id": "inst-uuid",
  "name": "University of Example",
  "email": "admin@university.edu",
  "walletAddress": "0x...",
  "verificationStatus": "PENDING"
}
```

### Institution login
**Endpoint:** `POST /api/institutions/login`

**Request:**
```json
{
  "walletAddress": "0x...",
  "signature": "0x...",
  "message": "..."
}
```

**Response:**
```json
{
  "id": "inst-uuid",
  "name": "University of Example",
  "token": "eyJhbGc...",
  "verificationStatus": "VERIFIED"
}
```

### Get institution profile
**Endpoint:** `GET /api/institutions/profile`

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "id": "inst-uuid",
  "name": "University of Example",
  "email": "admin@university.edu",
  "walletAddress": "0x...",
  "registrationNumber": "REG-001",
  "verificationStatus": "VERIFIED",
  "contactInfo": {
    "phone": "+1234567890",
    "address": "123 Main St"
  },
  "createdAt": "2026-01-28T09:00:00Z"
}
```

### Get verification status
**Endpoint:** `GET /api/institutions/verification-status`

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "institutionId": "inst-uuid",
  "verificationStatus": "VERIFIED|PROVISIONAL|PENDING",
  "documentsSubmitted": true,
  "documentsVerified": true,
  "verificationDate": "2026-01-28T09:00:00Z"
}
```

### Submit verification documents
**Endpoint:** `POST /api/institutions/verification-documents`

**Headers:**
```
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**Form data:**
```
institutionId: inst-uuid
files: [document1.pdf, document2.pdf, ...]
```

**Response:**
```json
{
  "institutionId": "inst-uuid",
  "documentsSubmitted": [
    {
      "fileName": "accreditation.pdf",
      "uploadedAt": "2026-01-28T09:00:00Z",
      "status": "PENDING_REVIEW"
    }
  ],
  "totalDocuments": 3,
  "status": "SUBMITTED_FOR_REVIEW"
}
```

## Governance

### Create proposal
**Endpoint:** `POST /governance/proposal`

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request:**
```json
{
  "institutionId": "inst-uuid",
  "institution_name": "University of Example",
  "wallet_address": "0x...",
  "description": "Institution verification and risk assessment",
  "representative_wallets": ["0x..."]
}
```

**Response:**
```json
{
  "proposal_id": "prop-uuid",
  "institution_name": "University of Example",
  "legitimacy_score": 95,
  "recommended_action": "AUTO_APPROVE",
  "suggested_issuance_limit": 10000,
  "risk_flags": [],
  "createdAt": "2026-01-28T10:30:00Z"
}
```

### Get proposal
**Endpoint:** `GET /governance/proposal/:proposalId`

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "proposal_id": "prop-uuid",
  "status": "PENDING|APPROVED|REJECTED|EXECUTED",
  "institution_name": "University of Example",
  "legitimacy_score": 95,
  "createdAt": "2026-01-28T10:30:00Z"
}
```

### Execute proposal
**Endpoint:** `POST /governance/proposal/:proposalId/execute`

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true,
  "message": "Proposal executed successfully",
  "executionTime": "2026-01-28T10:35:00Z"
}
```

### List proposals
**Endpoint:** `GET /governance/proposals`

**Headers:** `Authorization: Bearer <token>`

**Query parameters:**
- `status` optional
- `page` optional
- `limit` optional
- `sortBy` optional
- `sortOrder` optional

**Response:**
```json
{
  "proposals": [
    {
      "proposal_id": "prop-uuid",
      "institution_name": "University of Example",
      "status": "PENDING",
      "legitimacy_score": 95,
      "createdAt": "2026-01-28T10:30:00Z"
    }
  ]
}
```

## Standard API
Base path: `/api/v1/standard`

**Headers:**
```
Authorization: Bearer <api_key>
X-Institution-ID: <institution_id>
Content-Type: application/json
```

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

## Error handling

### Standard error response
```json
{
  "statusCode": 400,
  "message": "Error description",
  "error": "Bad Request",
  "timestamp": "2026-01-28T10:30:00Z"
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
Rate limits are enforced by API keys and subscription plans. Limits are returned by the developer portal pricing endpoint.

### Current plan limits
- Starter: 20 requests per minute
- Pro: 100 requests per minute
- Enterprise: 1000 requests per minute

When rate limited (`429 Too Many Requests`):
```json
{
  "statusCode": 429,
  "message": "Rate limit exceeded",
  "retryAfter": 60
}
```
