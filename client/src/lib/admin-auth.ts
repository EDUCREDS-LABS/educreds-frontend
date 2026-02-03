import CryptoJS from 'crypto-js';

// Admin authentication utilities
export class AdminAuth {
  private static readonly ADMIN_EMAIL = 'admin@educreds.xyz';
  private static readonly ADMIN_PASSWORD_HASH = 'd5875d0e0e4eef32053228a8329c7ffb58c683d97412458d524f1995f01fa895'; // SHA256 of 'password' + educreds_admin_2024
  private static readonly SALT = 'educreds_admin_2024';
  private static readonly MAX_ATTEMPTS = 5;
  private static readonly LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes

  // Hash password with salt
  private static hashPassword(password: string): string {
    return CryptoJS.SHA256(password + this.SALT).toString();
  }

  // Check if user is locked out
  private static isLockedOut(): boolean {
    const lockoutUntil = localStorage.getItem('admin_lockout_until');
    if (!lockoutUntil) return false;
    
    const lockoutTime = parseInt(lockoutUntil);
    if (Date.now() < lockoutTime) {
      return true;
    } else {
      // Lockout expired, clear it
      localStorage.removeItem('admin_lockout_until');
      localStorage.removeItem('admin_attempts');
      return false;
    }
  }

  // Get remaining lockout time in minutes
  static getRemainingLockoutTime(): number {
    const lockoutUntil = localStorage.getItem('admin_lockout_until');
    if (!lockoutUntil) return 0;
    
    const lockoutTime = parseInt(lockoutUntil);
    const remaining = lockoutTime - Date.now();
    return Math.max(0, Math.ceil(remaining / (60 * 1000)));
  }

  // Record failed attempts
  private static recordFailedAttempt(): void {
    const attempts = parseInt(localStorage.getItem('admin_attempts') || '0') + 1;
    localStorage.setItem('admin_attempts', attempts.toString());
    
    if (attempts >= this.MAX_ATTEMPTS) {
      const lockoutUntil = Date.now() + this.LOCKOUT_DURATION;
      localStorage.setItem('admin_lockout_until', lockoutUntil.toString());
    }
  }

  // Clear failed attempts on successful login
  private static clearFailedAttempts(): void {
    localStorage.removeItem('admin_attempts');
    localStorage.removeItem('admin_lockout_until');
  }

  // Authenticate admin
  static authenticate(email: string, password: string): { success: boolean; message: string; remainingAttempts?: number } {
    // Check if locked out
    if (this.isLockedOut()) {
      const remainingTime = this.getRemainingLockoutTime();
      return {
        success: false,
        message: `Account locked due to too many failed attempts. Try again in ${remainingTime} minutes.`
      };
    }

    // Validate email (normalize to lowercase)
    const emailNormalized = (email || '').trim().toLowerCase();
    const adminCanonical = this.ADMIN_EMAIL.toLowerCase();
    if (emailNormalized !== adminCanonical) {
      this.recordFailedAttempt();
      const attempts = parseInt(localStorage.getItem('admin_attempts') || '0');
      const remaining = this.MAX_ATTEMPTS - attempts;
      
      return {
        success: false,
        message: 'Invalid admin credentials',
        remainingAttempts: remaining
      };
    }

    // Validate password
    const hashedPassword = this.hashPassword(password);
    if (hashedPassword !== this.ADMIN_PASSWORD_HASH) {
      this.recordFailedAttempt();
      const attempts = parseInt(localStorage.getItem('admin_attempts') || '0');
      const remaining = this.MAX_ATTEMPTS - attempts;
      
      return {
        success: false,
        message: 'Invalid admin credentials',
        remainingAttempts: remaining
      };
    }

    // Successful authentication
    this.clearFailedAttempts();
    localStorage.setItem('isAdmin', 'true');
    // Force-store canonical admin email to avoid header mismatches
    localStorage.setItem('adminEmail', this.ADMIN_EMAIL);
    // Store a simple admin token for dashboard checks
    localStorage.setItem('adminToken', 'admin-session');
    localStorage.setItem('adminLoginTime', Date.now().toString());
    
    return {
      success: true,
      message: 'Authentication successful'
    };
  }

  // Check if admin is logged in
  static isLoggedIn(): boolean {
    const isAdmin = localStorage.getItem('isAdmin') === 'true';
    const adminEmail = localStorage.getItem('adminEmail');
    const loginTime = localStorage.getItem('adminLoginTime');
    
    if (!isAdmin || !adminEmail || !loginTime) {
      return false;
    }

    // Check if session is expired (24 hours)
    const sessionDuration = 24 * 60 * 60 * 1000; // 24 hours
    const timeSinceLogin = Date.now() - parseInt(loginTime);
    
    if (timeSinceLogin > sessionDuration) {
      this.logout();
      return false;
    }

    return true;
  }

  // Logout admin
  static logout(): void {
    localStorage.removeItem('isAdmin');
    localStorage.removeItem('adminEmail');
    localStorage.removeItem('adminLoginTime');
    localStorage.removeItem('admin_attempts');
    localStorage.removeItem('admin_lockout_until');
  }

  // Get admin email for API calls
  static getAdminEmail(): string {
    return localStorage.getItem('adminEmail') || '';
  }

  // Get session info
  static getSessionInfo(): { email: string; loginTime: number; timeRemaining: number } | null {
    if (!this.isLoggedIn()) return null;
    
    const email = localStorage.getItem('adminEmail') || '';
    const loginTime = parseInt(localStorage.getItem('adminLoginTime') || '0');
    const sessionDuration = 24 * 60 * 60 * 1000; // 24 hours
    const timeRemaining = Math.max(0, sessionDuration - (Date.now() - loginTime));
    
    return { email, loginTime, timeRemaining };
  }
}

