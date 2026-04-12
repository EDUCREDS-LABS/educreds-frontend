import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import cors from 'cors';
import { Request, Response, NextFunction } from 'express';

// Rate limiting configurations
export const createRateLimit = (windowMs: number, max: number, message?: string) => {
  return rateLimit({
    windowMs,
    max,
    message: message || 'Too many requests from this IP, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req: Request, res: Response) => {
      res.status(429).json({
        error: 'Rate limit exceeded',
        message: 'Too many requests from this IP, please try again later.',
        retryAfter: Math.round(windowMs / 1000)
      });
    }
  });
};

// User-friendly rate limits - Only block obvious abuse
export const rateLimits = {
  // General API rate limit - Very lenient for normal browsing
  general: createRateLimit(15 * 60 * 1000, 2000), // 2000 requests per 15 minutes

  // Authentication endpoints - Allow reasonable failed attempts
  auth: createRateLimit(30 * 60 * 1000, 15), // 15 login attempts per 30 minutes

  // Certificate issuance - Reasonable for institutions
  certificates: createRateLimit(60 * 1000, 100), // 100 certificates per minute

  // File uploads - Allow multiple uploads
  uploads: createRateLimit(60 * 1000, 25), // 25 uploads per minute

  // Verification endpoints - Very lenient for public use
  verification: createRateLimit(60 * 1000, 500), // 500 verifications per minute
};

// Security headers configuration
export const securityHeaders = helmet({
  contentSecurityPolicy: (process.env.NODE_ENV === 'development' || process.env.DISABLE_CSP === 'true') ? false : {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "data:", "https://fonts.gstatic.com", "https://fonts.reown.com"],
      imgSrc: ["'self'", "data:", "https:", "blob:"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://js.stripe.com", "https://consent.cookiebot.com", "https://www.googletagmanager.com", "https://static.cloudflareinsights.com", "https://unpkg.com"],
      connectSrc: ["'self'", "https:", "wss:", "ws:", "http://localhost:*", "https://api.stripe.com", "https://m.stripe.network", "https://consentcdn.cookiebot.com", "https://Educreds-backend-"],
      frameSrc: ["'self'", "https://js.stripe.com", "https://hooks.stripe.com", "https://consentcdn.cookiebot.com"],
      objectSrc: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'self'"],
    },
  },
  crossOriginEmbedderPolicy: false, // Disable for blockchain wallet compatibility
  crossOriginOpenerPolicy: { policy: "unsafe-none" }, // Required for WalletConnect
  hsts: process.env.NODE_ENV === 'production' ? {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  } : false
});

// CORS configuration
export const corsOptions = {
  origin: function (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) {
    // Accept requests that don't provide an Origin header (curl, server-to-server, mobile apps, etc.)
    if (!origin) {
      return callback(null, true);
    }

    // Build allowed origins from environment variables
    const allowedOrigins: string[] = [];

    // Add frontend URL (required in production)
    if (process.env.FRONTEND_URL) {
      allowedOrigins.push(process.env.FRONTEND_URL);
    }

    // Add admin URL if configured
    if (process.env.ADMIN_URL) {
      allowedOrigins.push(process.env.ADMIN_URL);
    }

    // Add development localhost URLs only in development
    if (process.env.NODE_ENV === 'development') {
      allowedOrigins.push(
        'http://localhost:3000',
        'http://localhost:5002',
        'http://localhost:5173'
      );
    }

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`CORS blocked origin: ${origin}. Allowed origins: ${allowedOrigins.join(', ')}`);
      callback(new Error('Not allowed by CORS'), false);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'admin-email', 'X-Requested-With'],
  exposedHeaders: ['X-Total-Count', 'X-Rate-Limit-Remaining']
};

// Input validation middleware
export const validateInput = (req: Request, res: Response, next: NextFunction) => {
  // Remove any potential XSS attempts
  const sanitizeString = (str: string): string => {
    return str.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+\s*=/gi, '');
  };

  const sanitizeObject = (obj: any): any => {
    if (typeof obj === 'string') {
      return sanitizeString(obj);
    }
    if (Array.isArray(obj)) {
      return obj.map(sanitizeObject);
    }
    if (obj && typeof obj === 'object') {
      const sanitized: any = {};
      for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
          sanitized[key] = sanitizeObject(obj[key]);
        }
      }
      return sanitized;
    }
    return obj;
  };

  if (req.body) {
    req.body = sanitizeObject(req.body);
  }

  if (req.query) {
    req.query = sanitizeObject(req.query);
  }

  next();
};

// Request size limits
export const requestSizeLimits = {
  json: { limit: '10mb' }, // For certificate data
  urlencoded: { limit: '10mb', extended: true },
  raw: { limit: '50mb' }, // For file uploads
};

// Security middleware for sensitive operations
export const requireSecureContext = (req: Request, res: Response, next: NextFunction) => {
  // In production, require HTTPS
  if (process.env.NODE_ENV === 'production' && !req.secure && req.get('x-forwarded-proto') !== 'https') {
    return res.status(403).json({
      error: 'HTTPS required',
      message: 'This operation requires a secure connection'
    });
  }
  next();
};

// API key validation for admin operations
export const validateApiKey = (req: Request, res: Response, next: NextFunction) => {
  const apiKey = req.headers['x-api-key'] as string;
  const validApiKey = process.env.ADMIN_API_KEY;

  if (!validApiKey) {
    return res.status(500).json({
      error: 'Server configuration error',
      message: 'Admin API key not configured'
    });
  }

  if (!apiKey || apiKey !== validApiKey) {
    return res.status(401).json({
      error: 'Invalid API key',
      message: 'Valid API key required for this operation'
    });
  }

  next();
};

// Blockchain operation security
export const validateBlockchainOperation = (req: Request, res: Response, next: NextFunction) => {
  const { walletAddress, signature } = req.body;

  // Basic wallet address validation
  if (walletAddress && !/^0x[a-fA-F0-9]{40}$/.test(walletAddress)) {
    return res.status(400).json({
      error: 'Invalid wallet address',
      message: 'Wallet address must be a valid Ethereum address'
    });
  }

  // Add signature validation here if needed
  next();
};
