# Admin Authentication Security

## Overview
This document outlines the security measures implemented for admin authentication in the EduCreds frontend application.

## Security Features Implemented

### 1. Password Hashing
- **Technology**: SHA-256 with salt
- **Salt**: `educreds_admin_2024`
- **Default Password**: `password` (hashed: `4d0bc59a8032785ce80e118b47d82438b6a7e2c051175d8ccdd4b53ad0d3bcd4`)
- **Location**: `client/src/lib/admin-auth.ts`

### 2. Rate Limiting & Account Lockout
- **Max Attempts**: 5 failed login attempts
- **Lockout Duration**: 15 minutes
- **Storage**: LocalStorage (client-side tracking)
- **Features**:
  - Progressive lockout warnings
  - Automatic lockout expiration
  - Failed attempt counter reset on successful login

### 3. Session Management
- **Session Duration**: 24 hours
- **Auto-logout**: Sessions expire automatically
- **Session Tracking**: Login time stored in LocalStorage
- **Session Validation**: Real-time session status checking

### 4. Secure Admin Guard
- **Component**: `AdminGuard.tsx`
- **Features**:
  - Authentication verification on page load
  - Session timeout warnings
  - Automatic redirect to login on session expiry
  - Admin header with session info

## Default Credentials

### Production Setup
**Email**: `admin@educreds.xyz`  
**Password**: `password`

⚠️ **IMPORTANT**: Change the default password before deploying to production!

### How to Change Admin Password
node -e "const crypto = require('crypto'); console.log('New hash for password + educreds_admin_2024:', crypto.createHash('sha256').update('password' + 'educreds_admin_2024').digest('hex'));"
1. Generate a new password hash:
```javascript
import CryptoJS from 'crypto-js';
const newPassword = 'your_new_password';
const salt = 'educreds_admin_2024';
const hash = CryptoJS.SHA256(newPassword + salt).toString();
console.log(hash);
```

2. Update the hash in `client/src/lib/admin-auth.ts`:
```typescript
private static readonly ADMIN_PASSWORD_HASH = 'your_new_hash_here';
```

3. Update the salt if needed:
```typescript
private static readonly SALT = 'your_new_salt_here';
```

## Security Considerations

### Current Limitations
1. **Client-side Security**: All authentication logic runs in the browser
2. **LocalStorage**: Credentials stored in browser storage (vulnerable to XSS)
3. **No Server Validation**: Backend doesn't validate admin credentials

### Recommended Improvements for Production

1. **Server-side Authentication**:
   - Implement proper JWT-based admin authentication
   - Store admin credentials securely on the server
   - Add database-based session management

2. **Enhanced Security**:
   - Implement 2FA (Two-Factor Authentication)
   - Add IP whitelisting for admin access
   - Use HTTPS-only cookies for session storage
   - Implement CSRF protection

3. **Monitoring & Logging**:
   - Log all admin login attempts
   - Monitor for suspicious activity
   - Implement alerting for failed login attempts

## Usage

### Admin Login
1. Navigate to `/admin/login`
2. Enter admin credentials
3. System validates with rate limiting and hashing
4. On success, redirects to admin dashboard

### Admin Dashboard Access
- All admin routes are protected by `AdminGuard`
- Session automatically expires after 24 hours
- Failed attempts are tracked and can lock the account

### Logout
- Manual logout via admin header button
- Automatic logout on session expiry
- Clears all admin-related LocalStorage data

## File Structure
```
client/src/
├── lib/
│   ├── admin-auth.ts          # Core authentication logic
│   └── api.ts                 # API calls with admin headers
├── components/admin/
│   └── AdminGuard.tsx         # Route protection component
└── pages/admin/
    └── login.tsx              # Admin login page
```

## Environment Variables (Optional)
For additional security, you can move credentials to environment variables:

```env
VITE_ADMIN_EMAIL=admin@educreds.xyz
VITE_ADMIN_PASSWORD_HASH=your_hash_here
VITE_ADMIN_SALT=your_salt_here
```

Then update `admin-auth.ts` to use:
```typescript
private static readonly ADMIN_EMAIL = import.meta.env.VITE_ADMIN_EMAIL;
private static readonly ADMIN_PASSWORD_HASH = import.meta.env.VITE_ADMIN_PASSWORD_HASH;
private static readonly SALT = import.meta.env.VITE_ADMIN_SALT;
```

## Testing
Test the security features:
1. Try wrong credentials (should show attempt counter)
2. Try 5 wrong attempts (should lock account for 15 minutes)
3. Login successfully (should reset attempt counter)
4. Wait 24 hours (should auto-logout)
5. Try accessing admin routes without login (should redirect to login)

