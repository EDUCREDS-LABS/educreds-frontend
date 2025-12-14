import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';

// JWT configuration
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
    institutionId?: string;
  };
}

// Enhanced JWT token generation with refresh tokens
export const generateTokens = (payload: any) => {
  const accessToken = jwt.sign(payload, JWT_SECRET, { 
    expiresIn: JWT_EXPIRES_IN,
    issuer: 'educreds',
    audience: 'educreds-users'
  });
  
  const refreshToken = jwt.sign(
    { userId: payload.sub, type: 'refresh' }, 
    JWT_SECRET, 
    { 
      expiresIn: JWT_REFRESH_EXPIRES_IN,
      issuer: 'educreds',
      audience: 'educreds-users'
    }
  );
  
  return { accessToken, refreshToken };
};

// Verify JWT token middleware
export const verifyToken = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({
      error: 'Access denied',
      message: 'No token provided'
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET, {
      issuer: 'educreds',
      audience: 'educreds-users'
    }) as any;
    
    // Check if token is expired
    if (decoded.exp && decoded.exp < Date.now() / 1000) {
      return res.status(401).json({
        error: 'Token expired',
        message: 'Please login again'
      });
    }
    
    req.user = {
      id: decoded.sub,
      email: decoded.email,
      role: decoded.role,
      institutionId: decoded.institutionId
    };
    
    next();
  } catch (error) {
    return res.status(403).json({
      error: 'Invalid token',
      message: 'Token verification failed'
    });
  }
};

// Role-based access control
export const requireRole = (roles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Authentication required',
        message: 'Please login to access this resource'
      });
    }
    
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        error: 'Insufficient permissions',
        message: `Required role: ${roles.join(' or ')}`
      });
    }
    
    next();
  };
};

// Password hashing utilities
export const hashPassword = async (password: string): Promise<string> => {
  const saltRounds = 12;
  return bcrypt.hash(password, saltRounds);
};

export const comparePassword = async (password: string, hash: string): Promise<boolean> => {
  return bcrypt.compare(password, hash);
};

// Password strength validation
export const validatePasswordStrength = (password: string): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  
  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }
  
  // Check for common passwords
  const commonPasswords = ['password', '123456', 'qwerty', 'admin', 'letmein'];
  if (commonPasswords.includes(password.toLowerCase())) {
    errors.push('Password is too common, please choose a stronger password');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// Session security
export const sessionConfig = {
  secret: process.env.SESSION_SECRET || 'your-session-secret-change-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production', // HTTPS only in production
    httpOnly: true, // Prevent XSS
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    sameSite: 'strict' as const // CSRF protection
  },
  name: 'educreds.sid' // Custom session name
};

// Refresh token validation
export const refreshTokens = (req: Request, res: Response, next: NextFunction) => {
  const { refreshToken } = req.body;
  
  if (!refreshToken) {
    return res.status(401).json({
      error: 'Refresh token required',
      message: 'Please provide a valid refresh token'
    });
  }
  
  try {
    const decoded = jwt.verify(refreshToken, JWT_SECRET, {
      issuer: 'educreds',
      audience: 'educreds-users'
    }) as any;
    
    if (decoded.type !== 'refresh') {
      throw new Error('Invalid token type');
    }
    
    // Generate new tokens
    const newTokens = generateTokens({
      sub: decoded.userId,
      // You'll need to fetch user details from database here
    });
    
    res.json({
      success: true,
      tokens: newTokens
    });
    
  } catch (error) {
    return res.status(403).json({
      error: 'Invalid refresh token',
      message: 'Please login again'
    });
  }
};

// Brute force protection - More lenient
const loginAttempts = new Map<string, { count: number; lastAttempt: number }>();

export const bruteForceProtection = (req: Request, res: Response, next: NextFunction) => {
  const ip = req.ip || req.connection.remoteAddress || 'unknown';
  const now = Date.now();
  const attempts = loginAttempts.get(ip);
  
  if (attempts) {
    // Reset counter if last attempt was more than 30 minutes ago
    if (now - attempts.lastAttempt > 30 * 60 * 1000) {
      loginAttempts.delete(ip);
    } else if (attempts.count >= 10) {
      // Block only after 10 failed attempts in 30 minutes
      return res.status(429).json({
        error: 'Too many login attempts',
        message: 'Please try again in 30 minutes',
        retryAfter: Math.ceil((30 * 60 * 1000 - (now - attempts.lastAttempt)) / 1000)
      });
    }
  }
  
  next();
};

export const recordLoginAttempt = (ip: string, success: boolean) => {
  if (success) {
    // Clear attempts on successful login
    loginAttempts.delete(ip);
  } else {
    // Increment failed attempts
    const attempts = loginAttempts.get(ip) || { count: 0, lastAttempt: 0 };
    attempts.count++;
    attempts.lastAttempt = Date.now();
    loginAttempts.set(ip, attempts);
  }
};