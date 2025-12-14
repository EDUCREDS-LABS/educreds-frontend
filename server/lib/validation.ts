import { body, param, query, validationResult } from 'express-validator';
import { Request, Response, NextFunction } from 'express';

// Validation error handler
export const handleValidationErrors = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      message: 'Invalid input data',
      details: errors.array().map(err => ({
        field: err.type === 'field' ? err.path : 'unknown',
        message: err.msg,
        value: err.type === 'field' ? err.value : undefined
      }))
    });
  }
  next();
};

// Common validation rules
export const commonValidations = {
  email: body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Must be a valid email address'),
    
  password: body('password')
    .isLength({ min: 8, max: 128 })
    .withMessage('Password must be between 8 and 128 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>])/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),
    
  walletAddress: body('walletAddress')
    .matches(/^0x[a-fA-F0-9]{40}$/)
    .withMessage('Must be a valid Ethereum wallet address'),
    
  name: body('name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .matches(/^[a-zA-Z\s\-'\.]+$/)
    .withMessage('Name must be 2-100 characters and contain only letters, spaces, hyphens, apostrophes, and periods'),
    
  institutionName: body('institutionName')
    .trim()
    .isLength({ min: 2, max: 200 })
    .withMessage('Institution name must be between 2 and 200 characters'),
    
  mongoId: param('id')
    .isMongoId()
    .withMessage('Must be a valid ID'),
    
  uuid: param('id')
    .isUUID()
    .withMessage('Must be a valid UUID'),
    
  ipfsHash: param('hash')
    .matches(/^Qm[1-9A-HJ-NP-Za-km-z]{44}$/)
    .withMessage('Must be a valid IPFS hash'),
    
  tokenId: param('tokenId')
    .isInt({ min: 0 })
    .withMessage('Token ID must be a non-negative integer'),
    
  pagination: [
    query('page')
      .optional()
      .isInt({ min: 1, max: 1000 })
      .withMessage('Page must be between 1 and 1000'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100')
  ]
};

// Authentication validation schemas
export const authValidation = {
  register: [
    commonValidations.email,
    commonValidations.password,
    commonValidations.name,
    commonValidations.institutionName,
    body('institutionType')
      .isIn(['university', 'college', 'school', 'training_center', 'certification_body'])
      .withMessage('Invalid institution type'),
    body('country')
      .isLength({ min: 2, max: 2 })
      .isAlpha()
      .withMessage('Country must be a valid 2-letter country code'),
    body('phone')
      .optional()
      .isMobilePhone('any')
      .withMessage('Must be a valid phone number'),
    handleValidationErrors
  ],
  
  login: [
    commonValidations.email,
    body('password')
      .notEmpty()
      .withMessage('Password is required'),
    handleValidationErrors
  ],
  
  changePassword: [
    body('currentPassword')
      .notEmpty()
      .withMessage('Current password is required'),
    commonValidations.password,
    body('confirmPassword')
      .custom((value, { req }) => {
        if (value !== req.body.password) {
          throw new Error('Password confirmation does not match');
        }
        return true;
      }),
    handleValidationErrors
  ]
};

// Certificate validation schemas
export const certificateValidation = {
  issue: [
    body('studentName')
      .trim()
      .isLength({ min: 2, max: 100 })
      .matches(/^[a-zA-Z\s\-'\.]+$/)
      .withMessage('Student name must be 2-100 characters and contain only letters, spaces, hyphens, apostrophes, and periods'),
    body('studentEmail')
      .isEmail()
      .normalizeEmail()
      .withMessage('Must be a valid student email'),
    commonValidations.walletAddress,
    body('courseName')
      .trim()
      .isLength({ min: 2, max: 200 })
      .withMessage('Course name must be between 2 and 200 characters'),
    body('grade')
      .optional()
      .matches(/^[A-F][+-]?$|^[0-9]{1,3}(\.[0-9]{1,2})?%?$/)
      .withMessage('Grade must be a valid format (A-F with optional +/-, or percentage)'),
    body('completionDate')
      .isISO8601()
      .toDate()
      .withMessage('Completion date must be a valid date'),
    body('certificateType')
      .isIn(['Academic', 'Professional', 'Training', 'Certification'])
      .withMessage('Invalid certificate type'),
    handleValidationErrors
  ],
  
  bulkIssue: [
    body('certificates')
      .isArray({ min: 1, max: 100 })
      .withMessage('Certificates must be an array with 1-100 items'),
    body('certificates.*.studentName')
      .trim()
      .isLength({ min: 2, max: 100 })
      .matches(/^[a-zA-Z\s\-'\.]+$/)
      .withMessage('Each student name must be valid'),
    body('certificates.*.studentEmail')
      .isEmail()
      .normalizeEmail()
      .withMessage('Each student email must be valid'),
    body('certificates.*.walletAddress')
      .matches(/^0x[a-fA-F0-9]{40}$/)
      .withMessage('Each wallet address must be valid'),
    handleValidationErrors
  ],
  
  verify: [
    param('id')
      .notEmpty()
      .withMessage('Certificate ID is required'),
    handleValidationErrors
  ]
};

// Template validation schemas
export const templateValidation = {
  create: [
    body('name')
      .trim()
      .isLength({ min: 3, max: 100 })
      .withMessage('Template name must be between 3 and 100 characters'),
    body('description')
      .trim()
      .isLength({ min: 10, max: 500 })
      .withMessage('Description must be between 10 and 500 characters'),
    body('category')
      .isIn(['academic', 'professional', 'training', 'achievement'])
      .withMessage('Invalid template category'),
    body('price')
      .isFloat({ min: 0, max: 10000 })
      .withMessage('Price must be between 0 and 10000'),
    body('tags')
      .optional()
      .isArray({ max: 10 })
      .withMessage('Tags must be an array with maximum 10 items'),
    body('tags.*')
      .optional()
      .trim()
      .isLength({ min: 2, max: 30 })
      .matches(/^[a-zA-Z0-9\s\-]+$/)
      .withMessage('Each tag must be 2-30 characters and contain only letters, numbers, spaces, and hyphens'),
    handleValidationErrors
  ],
  
  update: [
    commonValidations.uuid,
    body('name')
      .optional()
      .trim()
      .isLength({ min: 3, max: 100 })
      .withMessage('Template name must be between 3 and 100 characters'),
    body('description')
      .optional()
      .trim()
      .isLength({ min: 10, max: 500 })
      .withMessage('Description must be between 10 and 500 characters'),
    handleValidationErrors
  ]
};

// File upload validation
export const fileValidation = {
  certificateImage: [
    body('file')
      .custom((value, { req }) => {
        if (!req.file) {
          throw new Error('Certificate image is required');
        }
        
        const allowedMimes = ['image/jpeg', 'image/png', 'image/webp'];
        if (!allowedMimes.includes(req.file.mimetype)) {
          throw new Error('Only JPEG, PNG, and WebP images are allowed');
        }
        
        const maxSize = 5 * 1024 * 1024; // 5MB
        if (req.file.size > maxSize) {
          throw new Error('File size must be less than 5MB');
        }
        
        return true;
      }),
    handleValidationErrors
  ],
  
  documents: [
    body('files')
      .custom((value, { req }) => {
        if (!req.files || req.files.length === 0) {
          throw new Error('At least one document is required');
        }
        
        const allowedMimes = ['application/pdf', 'image/jpeg', 'image/png'];
        const maxSize = 10 * 1024 * 1024; // 10MB per file
        const maxFiles = 5;
        
        if (req.files.length > maxFiles) {
          throw new Error(`Maximum ${maxFiles} files allowed`);
        }
        
        for (const file of req.files) {
          if (!allowedMimes.includes(file.mimetype)) {
            throw new Error('Only PDF, JPEG, and PNG files are allowed');
          }
          
          if (file.size > maxSize) {
            throw new Error('Each file must be less than 10MB');
          }
        }
        
        return true;
      }),
    handleValidationErrors
  ]
};

// Admin validation schemas
export const adminValidation = {
  approveInstitution: [
    commonValidations.mongoId,
    body('approved')
      .isBoolean()
      .withMessage('Approved status must be boolean'),
    body('notes')
      .optional()
      .trim()
      .isLength({ max: 500 })
      .withMessage('Notes must be less than 500 characters'),
    handleValidationErrors
  ]
};