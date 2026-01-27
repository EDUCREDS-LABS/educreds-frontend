# Backend vs Frontend Auth Flow - Quick Reference

## 🎯 Unified Authentication Architecture

### **Registration: Both Required**
```
┌─────────────────────────────────────────┐
│  REGISTRATION (Institution Signup)      │
├─────────────────────────────────────────┤
│ MUST PROVIDE:                           │
│ ✓ Email Address                         │
│ ✓ Password (min 8 chars)                │
│ ✓ Wallet Address                        │
│ ✓ Institution Details                   │
└─────────────────────────────────────────┘

FRONTEND:
  Step 1: Collect institution info
  Step 2: Collect password + connect wallet (BOTH required)
  → OTP verification
  → POST /auth/institution/register

BACKEND:
  POST /auth/institution/register
  Body: {
    name, email, walletAddress,
    registrationNumber, contactInfo,
    password (optional)
  }
  → Creates Institution record
  → Wraps email, password, details in DID
  → Stores DID on IPFS
  → Returns JWT token
```

---

### **Login: Choose ONE Method**

#### **Option A: Email/Password**
```
┌──────────────────────────────────────┐
│ LOGIN via Email/Password             │
├──────────────────────────────────────┤
│ User provides:                       │
│ • Email                              │
│ • Password (stored in DID)           │
├──────────────────────────────────────┤
│ Backend validates:                   │
│ 1. Find institution by email         │
│ 2. Unwrap DID → get password         │
│ 3. Verify password matches           │
│ 4. Return JWT token                  │
└──────────────────────────────────────┘

FRONTEND:
  Email/Password Tab:
    1. User enters email + password
    2. Click "Send OTP & Sign In"
    3. OTP sent to email
    4. User verifies OTP
    5. POST /auth/institution/login
       { email, password, otp, otpToken }

BACKEND:
  POST /auth/institution/login
  Body: { email, password, otp, otpToken }
  → Validates email exists
  → Sends OTP to email (or uses provided token)
  → On OTP verify: checks email + password against DID
  → Returns JWT
```

#### **Option B: Wallet (Signature)**
```
┌──────────────────────────────────────┐
│ LOGIN via Blockchain Wallet          │
├──────────────────────────────────────┤
│ User provides:                       │
│ • Wallet Address                     │
│ • Signature (from MetaMask)          │
│ • Message (to prove ownership)       │
├──────────────────────────────────────┤
│ Backend validates:                   │
│ 1. Find institution by wallet        │
│ 2. Verify signature matches wallet   │
│ 3. Return JWT token                  │
└──────────────────────────────────────┘

FRONTEND:
  Wallet Tab:
    1. User clicks "Connect MetaMask"
    2. MetaMask connection established
    3. User clicks "Sign In with Wallet"
    4. MetaMask prompts to sign message
    5. POST /auth/institution/login
       { walletAddress, signature, message }

BACKEND:
  POST /auth/institution/login
  Body: {
    walletAddress: "0x...",
    signature: "0x...",
    message: "Sign this message to login..."
  }
  → Finds institution by wallet
  → Verifies signature authenticity
  → Returns JWT
```

---

## 🔄 Data Flow Comparison

### Registration Data Journey
```
FRONTEND                          BACKEND
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

User fills form          →  POST /register
  • name                 
  • email                
  • password             →  Create Institution
  • wallet address           (walletAddress, did refs)
  • registration #       
                         →  Create DID Document
                            (wrap: name, email, phone)
                         
                         →  Encrypt & send password
                            to DID (not database)
                         
OTP sent to email    ←  ← Send OTP
                         
User verifies OTP       →  Verify + Register
                         
JWT returned        ←  ← Token issued
                         
Store token             →  localStorage
  & redirect              (institution_token, user)
```

### Login Data Journey

**Email/Password Path:**
```
FRONTEND                          BACKEND
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

User enters:            →  POST /send-login-otp
  • email                 {email}
                         
OTP sent to email    ←  ← Email sent
                         
User verifies OTP       →  POST /login
  • email                 {email, password, otp}
  • password           
  • otp               →  Find institution by email
                         
                         →  Unwrap DID → get password
                         
                         →  Verify password matches
                         
JWT returned        ←  ← Token issued
```

**Wallet Path:**
```
FRONTEND                          BACKEND
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

User connects wallet    →  (local - MetaMask)
                         
User signs message      →  (local - MetaMask)
  Message: "Sign this
   message to login..."
                         
MetaMask returns     →  POST /login
  signature             {walletAddress, 
                         signature, message}
                         
                         →  Find institution by wallet
                         
                         →  Verify signature
                            (ecrecover)
                         
JWT returned        ←  ← Token issued
```

---

## 📋 Endpoint Comparison

### Register Endpoint
```
FRONTEND CALL:
  POST {CERT_API_BASE}/auth/institution/register
  Content-Type: application/json
  
  {
    name: "Harvard University",
    email: "admin@harvard.edu",
    walletAddress: "0x742d35Cc...",
    registrationNumber: "REG-12345",
    contactInfo: { phone: "+1-555-..." },
    password: "SecurePass123"  // NEW: now sent
  }

BACKEND PROCESSING:
  ✓ Check wallet not duplicate
  ✓ Create DID with wrapped data
  ✓ Store DID on IPFS
  ✓ Create Institution record
  ✓ Generate JWT
  
  RETURNS:
  {
    institution: {
      id, walletAddress, did,
      name, email, isVerified,
      verificationStatus
    },
    token: "eyJhbGc...",
    type: "institution"
  }
```

### Login Endpoint
```
FRONTEND CALL (Email/Password):
  POST {CERT_API_BASE}/auth/institution/login
  Content-Type: application/json
  
  {
    email: "admin@harvard.edu",
    password: "SecurePass123",
    otp: "123456",
    otpToken: "token-xyz"
  }

FRONTEND CALL (Wallet):
  POST {CERT_API_BASE}/auth/institution/login
  Content-Type: application/json
  
  {
    walletAddress: "0x742d35Cc...",
    signature: "0x...",
    message: "Sign this message to login to EduCreds: 1706367000"
  }

BACKEND PROCESSING (Email):
  ✓ Find institution by email
  ✓ Unwrap DID → get password
  ✓ Verify password matches input
  ✓ Generate JWT

BACKEND PROCESSING (Wallet):
  ✓ Find institution by wallet
  ✓ Verify signature (ecrecover)
  ✓ Generate JWT
  
  RETURNS (both):
  {
    institution: { ... },
    token: "eyJhbGc...",
    type: "institution"
  }
```

---

## 🔐 Privacy-First Guarantees

### Where Personal Data is Stored
```
Data Type               DB    IPFS    Blockchain
─────────────────────────────────────────────
Name                    ✗     ✓✓      ✗
Email                   ✗     ✓✓      ✗
Password (hashed)       ✗     ✓✓      ✗
Phone                   ✗     ✓✓      ✗
Wallet Address          ✓     ✓       ✓ (hash)
DID Document            ✓     ✓       ✗
IPFS Hash              ✓     ✗       ✓
Registration #          ✓     ✓       ✗

✓  = Stored
✓✓ = Encrypted
```

**Key Principle**: All PII encrypted and on IPFS, never in database

---

## ✅ Implementation Checklist

### Backend
- [x] Register endpoint accepts email + password + wallet
- [x] DID creation wraps password securely
- [x] Login accepts both email/password AND wallet signature
- [x] Signature verification working (ecrecover)
- [x] OTP flow working for email
- [x] JWT token generation consistent

### Frontend
- [x] Registration page collects both password + wallet
- [x] Login page has dual tabs (Email & Wallet)
- [x] Email login sends OTP before verification
- [x] Wallet login prompts MetaMask signature
- [x] API calls match backend expectations
- [x] Token storage and redirect working
- [x] UI clearly shows both methods available

---

## 🚀 User Quick Start

### For Institution Admin Registering
1. Go to /register
2. Fill in institution name, email, registration #
3. Create password (8+ chars)
4. **Connect your wallet** (required!)
5. Verify OTP sent to email
6. Done! Account created with both auth methods

### For Institution Admin Logging In
**Choose your preferred method:**

**Option 1: Email/Password** (easiest for non-crypto users)
1. Go to /login
2. Click "Email" tab
3. Enter email + password
4. Click "Send OTP & Sign In"
5. Enter OTP from email
6. Done!

**Option 2: Wallet** (direct blockchain connection)
1. Go to /login
2. Click "Wallet" tab
3. Click "Connect MetaMask"
4. Click "Sign In with Wallet"
5. Sign message in MetaMask
6. Done!

