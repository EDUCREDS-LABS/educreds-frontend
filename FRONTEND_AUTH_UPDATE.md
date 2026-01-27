# Frontend Authentication Flow - Unified Implementation

## Summary of Changes

Based on the backend's unified authentication architecture, the frontend has been completely refactored to match:

### **Backend Flow (What frontend must match)**

#### **Registration (Signup)**
- **Required**: BOTH email/password AND wallet address
- **Process**: 
  1. Collect institution info (name, email, registration number)
  2. Collect password + wallet connection
  3. Send OTP to email
  4. Backend creates DID with both wrapped inside
  5. Institution can now login with EITHER method

#### **Login**
- **Option 1**: Email/Password + OTP
- **Option 2**: Wallet Signature
- Backend validates against institution record and returns JWT token

---

## Frontend Components Updated

### 1. **ModernRegisterUnified.tsx** (NEW)
**File**: `client/src/components/modern/ModernRegisterUnified.tsx`

**What Changed**:
- ✅ Removed multi-step plan selection (simplified to 2 steps)
- ✅ Step 1: Institution Details (name, email, registration number, phone)
- ✅ Step 2: Security & Blockchain (UNIFIED)
  - Password creation (stored encrypted in DID)
  - Wallet connection (required - blockchain registration)
- ✅ Email OTP verification before registration
- ✅ Direct API call to `/auth/institution/register` endpoint
- ✅ Sends: `{ name, email, walletAddress, registrationNumber, contactInfo, password }`

**Key Features**:
```typescript
// Both are REQUIRED and sent together to backend
{
  name: "University Name",
  email: "admin@university.edu",
  walletAddress: "0x742d35Cc...",
  registrationNumber: "REG-123",
  contactInfo: { phone: "+1-555-..." },
  password: "hashed-in-DID"
}
```

### 2. **ModernAuthUnified.tsx** (NEW)
**File**: `client/src/components/modern/ModernAuthUnified.tsx`

**What Changed**:
- ✅ Tabbed interface showing BOTH login options
- ✅ Tab 1: Email/Password Login
  - Email + password form
  - Sends OTP to email
  - User verifies OTP
  - Backend validates and returns JWT
- ✅ Tab 2: Wallet Login
  - MetaMask connection
  - Signs message: `Sign this message to login to EduCreds: {timestamp}`
  - Backend verifies signature
  - Returns JWT token

**Key Features**:
```typescript
// Email/Password Flow
POST /auth/institution/login
{
  email: "admin@university.edu",
  password: "institution-password",
  otp: "123456",
  otpToken: "token-from-otp-send"
}

// Wallet Flow
POST /auth/institution/login
{
  walletAddress: "0x742d35Cc...",
  signature: "0x...",
  message: "Sign this message to login to EduCreds: 1706367000"
}
```

### 3. **Updated Page Routes**
**Files Changed**:
- `client/src/pages/auth/register.tsx` → imports `ModernRegisterUnified`
- `client/src/pages/auth/login.tsx` → imports `ModernAuthUnified`

---

## Backend Integration Points

### Register Endpoint
```
POST /auth/institution/register
Body: {
  name: string,
  email: string,
  walletAddress: string,
  registrationNumber: string,
  contactInfo?: { phone?, address?, website? },
  password?: string (optional for legacy, new flow sends it)
}

Response: {
  institution: {
    id: string,
    walletAddress: string,
    did: string,
    name: string,
    email: string,
    isVerified: boolean,
    verificationStatus: string
  },
  token: string,
  type: "institution"
}
```

### Login Endpoint (Dual Method)
```
POST /auth/institution/login

Method 1 - Email/Password:
{
  email: string,
  password: string,
  otp: string,
  otpToken: string
}

Method 2 - Wallet:
{
  walletAddress: string,
  signature: string,
  message: string
}

Response: {
  institution: {
    id: string,
    walletAddress: string,
    did: string,
    name: string,
    email: string,
    isVerified: boolean
  },
  token: string,
  type: "institution"
}
```

---

## Privacy-First Architecture Maintained

### Data Storage Pattern:
| Data | Database | DID (IPFS) | Blockchain |
|------|----------|-----------|-----------|
| Name | ❌ | ✅ Encrypted | ❌ |
| Email | ❌ | ✅ Encrypted | ❌ |
| Password | ❌ | ✅ Encrypted | ❌ |
| Wallet Address | ✅ Index | ✅ | ✅ Hash |
| DID | ✅ | ✅ | ❌ |

---

## User Experience Flows

### Registration Flow
```
User lands on /register
    ↓
Step 1: Enters institution info
    ↓
Step 2: Creates password + connects wallet (BOTH required)
    ↓
Submit form
    ↓
OTP sent to email
    ↓
User verifies OTP
    ↓
Backend creates:
  - Institution record (wallet, DID reference)
  - DID Document (name, email, password, phone wrapped)
  - IPFS hash stored
    ↓
JWT token issued
    ↓
Redirect to /dashboard
```

### Login Flow - Email Option
```
User lands on /login
    ↓
Selects "Email" tab
    ↓
Enters email + password
    ↓
Clicks "Send OTP & Sign In"
    ↓
OTP sent to email
    ↓
User enters OTP
    ↓
Backend validates email + password + OTP
    ↓
JWT token issued
    ↓
Redirect to /dashboard
```

### Login Flow - Wallet Option
```
User lands on /login
    ↓
Selects "Wallet" tab
    ↓
Clicks "Connect MetaMask"
    ↓
MetaMask connection established
    ↓
Shows wallet address (truncated)
    ↓
Clicks "Sign In with Wallet"
    ↓
MetaMask prompts to sign message
    ↓
Backend verifies signature against institution wallet
    ↓
JWT token issued
    ↓
Redirect to /dashboard
```

---

## No Breaking Changes to Existing Features

- ✅ JWT token storage and validation unchanged
- ✅ Auth guard and protected routes still work
- ✅ localStorage keys unchanged:
  - `institution_token` (JWT)
  - `institution_user` (user data)
  - `auth_type` ("institution")
- ✅ `authStateChange` event still dispatched
- ✅ Dashboard redirect on successful auth maintained

---

## Testing Checklist

### Registration
- [ ] Step 1: Can enter institution info
- [ ] Step 1 → Step 2: Validation works
- [ ] Step 2: Password validation (match, 8+ chars)
- [ ] Step 2: Wallet connection works
- [ ] Step 2: Both password AND wallet required
- [ ] Submit: OTP sent to email
- [ ] OTP: Can verify and complete registration
- [ ] Backend: Check DID contains name, email, password
- [ ] Auth: Token stored, redirects to dashboard

### Login - Email Option
- [ ] Tab switch works
- [ ] Email/password form renders
- [ ] Submit: OTP sent
- [ ] OTP: Can verify
- [ ] Backend: Validates password against DID
- [ ] Auth: Token stored, redirects to dashboard

### Login - Wallet Option
- [ ] Tab switch works
- [ ] Wallet connect button available
- [ ] MetaMask integration works
- [ ] Shows wallet address when connected
- [ ] Sign In button calls signature flow
- [ ] Backend: Validates signature
- [ ] Auth: Token stored, redirects to dashboard

### Cross-Registration/Login
- [ ] Register with email + wallet
- [ ] Login with email/password (should work)
- [ ] Login with same wallet (should work)

---

## Migration Notes

### For Existing Institutions
- Old registrations only had wallet, need migration to add password to DID
- Old logins with OTP still work (API backward compatible)
- Recommend prompting on next login to add password option

### For New Institutions
- Both email/password AND wallet required at registration
- Can choose either method at login
- No separate registration for each method

---

## API Configuration

**No changes needed to existing config**, both components use:
```typescript
CERT_API_BASE = (import.meta.env.VITE_CERT_API_BASE ?? "http://localhost:3001").replace(/\/$/, "");

// Register: POST {CERT_API_BASE}/auth/institution/register
// Login: POST {CERT_API_BASE}/auth/institution/login
// Send OTP: POST {CERT_API_BASE}/auth/institution/send-login-otp
```

---

## Files Created/Modified

### Created
- ✅ `client/src/components/modern/ModernRegisterUnified.tsx`
- ✅ `client/src/components/modern/ModernAuthUnified.tsx`

### Modified
- ✅ `client/src/pages/auth/register.tsx`
- ✅ `client/src/pages/auth/login.tsx`

### Unchanged
- ✅ `lib/api.ts` (endpoints already correct)
- ✅ `lib/auth.ts` (storage and validation unchanged)
- ✅ All other components and pages

---

## Next Steps

1. **Test both registration and login flows** thoroughly
2. **Verify OTP email delivery** is working
3. **Test wallet signature flow** with MetaMask
4. **Check token storage** and dashboard access
5. **Monitor backend logs** for any DID creation issues
6. **Consider migration** for existing institutions

