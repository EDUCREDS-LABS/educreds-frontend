# Integrating with EduCreds

**Official Integration Guide**

- **Version:** 1.0.0
- **Last updated:** January 28, 2026
- **Base URL:** `https://api.educreds.xyz`

## Table of contents
1. [Integration options](#integration-options)
2. [Recommended architecture](#recommended-architecture)
3. [Platform integration (JWT)](#platform-integration-jwt)
4. [Standard integration (API key)](#standard-integration-api-key)
5. [Verification-only integration](#verification-only-integration)
6. [Trust Agent integration](#trust-agent-integration)
7. [Security checklist](#security-checklist)

## Integration options

### 1) Platform integration (JWT)
Use when you want the full EduCreds experience and workflows (institution onboarding, governance, templates, marketplace).

### 2) Standard integration (API key)
Use when you need a stable contract for external LMS or partner systems.

### 3) Verification-only integration
Use when you only need to validate credentials at scale.

## Recommended architecture
- **Frontend** calls your backend
- **Backend** calls EduCreds APIs
- Store JWTs and API keys only on your backend

## Platform integration (JWT)

### 1) Onboard institution
```http
POST /auth/institution/register/step1
Content-Type: application/json

{
  "name": "University of Example",
  "email": "admin@university.edu",
  "password": "securePassword123"
}
```

### 2) Complete OTP verification
```http
POST /auth/institution/register/step2
Content-Type: application/json

{
  "email": "admin@university.edu",
  "otp": "123456",
  "otpToken": "otp-token"
}
```

### 3) Link wallet (optional)
```http
POST /auth/institution/register/step3
Content-Type: application/json

{
  "email": "admin@university.edu",
  "walletAddress": "0x...",
  "otpToken": "otp-token"
}
```

### 4) Log in
```http
POST /auth/institution/login
Content-Type: application/json

{
  "email": "admin@university.edu",
  "password": "securePassword123"
}
```

### 5) Issue certificate
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
  "grade": "A+"
}
```

## Standard integration (API key)

### 1) Register for credentials
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

### 2) Call Standard API
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

### 3) Verify issued credentials
```http
POST /api/v1/standard/certificates/verify
Authorization: Bearer <api_key>
X-Institution-ID: <institution_id>
Content-Type: application/json

{
  "credentialId": "cert-uuid"
}
```

## Verification-only integration
Use the verification API to validate credentials without issuing.

- `GET /api/v1/verify/:certificateId`
- `POST /api/v1/verify/batch`
- `GET /api/v1/verify/wallet/:walletAddress`

## Trust Agent integration
Use the Trust Agent for governance analysis and credential risk assessments.

### Health check
```http
GET /api/trust-agent/health
```

### Analyze
```http
POST /api/trust-agent/analyze
Content-Type: application/json

{
  "queryType": "GOVERNANCE_ADVICE",
  "question": "Assess the risk of issuing a cross-border micro-credential",
  "governanceContext": {
    "institutionId": "inst-uuid",
    "actorRole": "GOVERNANCE_COUNCIL",
    "jurisdiction": "US",
    "riskAppetite": "low"
  }
}
```

## Security checklist
- Keep API keys and JWTs on server-side services only
- Use HTTPS in production
- Rotate keys periodically
- Validate and sanitize input before calling APIs
- Monitor rate limits and apply backoff
