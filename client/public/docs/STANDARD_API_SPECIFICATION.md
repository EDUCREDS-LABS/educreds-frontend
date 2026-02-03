# EduCreds Standard Education API v1.0

The EduCreds Standard API lets LMSs, student systems, and trusted integrators
issue and verify educational credentials against EduCreds’ decentralized
issuance infrastructure.

At a high level:
- **PoIC & DAO governance (on‑chain)** determine whether an institution is trusted.
- **This API (off‑chain)** exposes standardized REST endpoints guarded by API keys,
  institution identity, and subscription quotas.

---

## Base URL
```text
https://api.educreds.xyz/api/v1/standard
```

---

## Authentication & Headers

All requests must include:

```http
Authorization: Bearer <api_key>
X-Institution-ID: <institution_id>
Content-Type: application/json
```

- **`Authorization`**: API key issued via the EduCreds developer portal.
- **`X-Institution-ID`**: The institution identifier mapped to your EduCreds account.
- **Quotas & subscriptions**:
  - API keys are rate‑limited and subject to per‑plan quotas (certificates/month, API calls/month).
  - When a subscription or usage limit is exceeded, the API returns **HTTP 429** with a
    structured error (see Error Format).

> PoIC and governance scores are **never exposed as secrets** in this API and are not
> influenced by which commercial plan you use. Billing and quotas are off‑chain;
> trust and consensus remain on‑chain.

---

## Standard Endpoints

### 1. Health Check
```http
GET /health
```
**Response:**
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "services": ["certificates", "verification", "w3c-credentials"]
  },
  "meta": {
    "timestamp": "2024-01-15T10:30:00Z",
    "version": "1.0.0",
    "requestId": "req_1705312200_abc123"
  }
}
```

### 2. Issue Certificate
```http
POST /certificates/issue
Content-Type: application/json
X-Institution-ID: inst_123
```
**Request:**
```json
{
  "student": {
    "id": "student_456",
    "name": "John Doe"
  },
  "course": {
    "name": "Computer Science Degree",
    "code": "CS101"
  },
  "achievement": {
    "grade": "First Class",
    "completionDate": "2024-06-15",
    "certificateType": "DIPLOMA"
  }
}
```
**Response:**
```json
{
  "success": true,
  "data": {
    "certificateId": "cert_789",
    "verificationUrl": "https://verify.educreds.xyz/credential/cert_789",
    "formats": {
      "w3c": { /* W3C VC Object */ },
      "legacy": {
        "ipfsHash": "QmX7Y8Z9...",
        "certificateNumber": "cert_789"
      }
    }
  }
}
```

### 3. Verify Certificate
```http
POST /certificates/verify
Content-Type: application/json
```
**Request (W3C VC):**
```json
{
  "w3cCredential": { /* W3C VC Object */ }
}
```
**Request (Legacy):**
```json
{
  "credentialId": "cert_789"
}
```
**Response:**
```json
{
  "success": true,
  "data": {
    "valid": true,
    "certificate": {
      "student": { "name": "John Doe" },
      "course": { "name": "Computer Science Degree" },
      "achievement": { "grade": "First Class" },
      "institution": { "name": "University Example" }
    }
  }
}
```

### 4. Get Institution Certificates
```http
GET /institutions/{institutionId}/certificates?page=1&limit=50
```
**Response:**
```json
{
  "success": true,
  "data": {
    "certificates": [
      {
        "id": "cert_789",
        "student": { "name": "John Doe" },
        "course": { "name": "Computer Science" },
        "achievement": { "grade": "First Class" },
        "verificationUrl": "https://verify.educreds.xyz/credential/cert_789"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 50,
      "total": 150
    }
  }
}
```

---

## Error Format
```json
{
  "success": false,
  "error": {
    "code": "INVALID_REQUEST",
    "message": "Missing required field: student.name"
  },
  "meta": {
    "timestamp": "2024-01-15T10:30:00Z",
    "version": "1.0.0",
    "requestId": "req_1705312200_abc123"
  }
}
```

### Common Error Codes

- `400` – Invalid or missing fields in the request body.
- `401` – Missing or invalid API key.
- `403` – Institution is not allowed to perform this action.
- `404` – Resource not found (e.g. certificate).
- `429` – Usage or subscription limit exceeded.
- `500` – Unexpected server error.

#### Example: Usage / Subscription Limit Exceeded

```json
{
  "success": false,
  "error": {
    "code": "USAGE_LIMIT_EXCEEDED",
    "message": "Monthly certificates limit exceeded"
  },
  "meta": {
    "timestamp": "2024-01-15T10:30:00Z",
    "version": "1.0.0",
    "requestId": "req_1705312200_def456"
  }
}
```

---

## Integration Examples

### Canvas LMS Integration
```javascript
const educreds = {
  apiKey: 'your_api_key',
  institutionId: 'your_institution_id',
  
  async issueCertificate(studentData, courseData, gradeData) {
    const response = await fetch('https://api.educreds.xyz/api/v1/standard/certificates/issue', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'X-Institution-ID': this.institutionId,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        student: { id: studentData.id, name: studentData.name },
        course: { name: courseData.name, code: courseData.code },
        achievement: {
          grade: gradeData.grade,
          completionDate: gradeData.date,
          certificateType: 'CERTIFICATE'
        }
      })
    });
    return response.json();
  }
};
```

### Moodle Integration
```php
class EduCredsAPI {
    private $apiKey;
    private $institutionId;
    
    public function issueCertificate($student, $course, $achievement) {
        $data = [
            'student' => ['id' => $student->id, 'name' => $student->name],
            'course' => ['name' => $course->name],
            'achievement' => [
                'grade' => $achievement->grade,
                'completionDate' => $achievement->date,
                'certificateType' => 'CERTIFICATE'
            ]
        ];
        
        return $this->makeRequest('POST', '/certificates/issue', $data);
    }
}
```

---

## AWS API Gateway Integration

### Serverless Configuration
```yaml
# serverless.yml
service: educreds-standard-api

provider:
  name: aws
  runtime: nodejs18.x
  
functions:
  standardApi:
    handler: handler.standardApi
    events:
      - http:
          path: /api/v1/standard/{proxy+}
          method: ANY
          cors: true
          
resources:
  Resources:
    ApiGatewayRestApi:
      Type: AWS::ApiGateway::RestApi
      Properties:
        Name: EduCreds-Standard-API
        EndpointConfiguration:
          Types:
            - REGIONAL
```

This standardized API provides:
- **Consistent Response Format** - All responses follow same structure
- **Standard Education Schema** - Common fields across all education platforms
- **Multiple Format Support** - W3C VC + Legacy formats
- **Easy Integration** - Simple REST endpoints
- **AWS Compatible** - Works with API Gateway, Lambda, etc.