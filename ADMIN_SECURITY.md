# Admin Authentication Security

## Overview
Admin authentication is now handled **server-side** in the cert backend. The frontend no longer stores admin credentials or tokens in `localStorage`. Admin access uses a backend-issued JWT stored in an HTTP-only cookie.

## Current Security Model (2026-04-01)

### 1. Server-Side Credentials
- **Storage**: Environment variables on the backend.
- **Password Hashing**: bcrypt (recommended) via `ADMIN_PASSWORD_HASH`.
- **Fallback (dev only)**: `ADMIN_PASSWORD` (plaintext) if a bcrypt hash is not provided.

### 2. Session Management
- **Token**: JWT signed with `JWT_SECRET`.
- **Storage**: `admin_token` HTTP-only cookie.
- **TTL**: 24 hours (aligned with JWT expiry).
- **Transport**: `secure` cookies in production, `sameSite=strict`.

### 3. Route Protection
- **Guard**: `AdminJwtGuard` on all `/api/admin/*` and governance admin endpoints.
- **Frontend**: `AdminGuard` calls `/api/admin/session` to verify access.

## Default Credentials

### Production Setup
**Email**: `ADMIN_EMAIL`  
**Password**: `ADMIN_PASSWORD_HASH` (bcrypt)  

⚠️ **IMPORTANT**: Never use the plaintext `ADMIN_PASSWORD` in production.

## How to Set / Rotate Admin Password

1. Generate a bcrypt hash:
```bash
node cert_backend/scripts/generate-admin-hash.js "YourNewStrongPassword" 12
```

2. Update backend env:
```env
ADMIN_EMAIL=admin@educreds.xyz
ADMIN_PASSWORD_HASH=$2b$12$...
JWT_SECRET=your_jwt_secret
```

3. Restart the backend.

## Security Considerations

### Remaining Risks
- **CSRF**: Admin session uses cookies; add CSRF protection for state-changing routes.
- **Brute Force**: Add server-side rate limiting on `/api/admin/login`.

### Recommended Enhancements
1. **2FA** for admin login.
2. **IP allowlist** for admin routes.
3. **Audit logging** for admin actions and auth attempts.

## Usage

### Admin Login
1. Navigate to `/admin/login`
2. Enter admin credentials
3. Backend sets `admin_token` cookie
4. Redirect to admin dashboard

### Logout
- `/api/admin/logout` clears the admin cookie.

## File Structure
```
cert_backend/src/modules/admin/
├── admin-auth.service.ts      # Admin credential validation + JWT issuance
├── admin-jwt.guard.ts         # Admin guard for protected routes
├── admin.controller.ts        # Login/session/logout endpoints
└── admin.service.ts

educreds-frontend/client/src/
├── lib/admin-auth.ts          # Client helpers for login/session/logout
├── components/admin/AdminGuard.tsx
└── pages/admin/login.tsx
```
