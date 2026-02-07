import type { Express } from "express";
import { createServer, type Server } from "http";
import multer from 'multer';
import { rateLimits, requireSecureContext, validateBlockchainOperation } from './lib/security';
import { verifyToken, requireRole, bruteForceProtection, recordLoginAttempt, AuthenticatedRequest } from './lib/auth-security';
import { certificateValidation, authValidation, handleValidationErrors } from './lib/validation';
import marketplaceRouter from './routes/marketplace';
import developerPortalRouter from './routes/developer-portal';

// Secure multer setup for file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 5 // Maximum 5 files
  },
  fileFilter: (req, file, cb) => {
    // Allow only specific file types
    const allowedMimes = [
      'image/jpeg',
      'image/png',
      'image/webp',
      'application/pdf'
    ];

    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, WebP, and PDF files are allowed.'));
    }
  }
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Marketplace routes
  app.use('/api/marketplace', marketplaceRouter);

  // Developer Portal routes
  app.use('/api/developer-portal', developerPortalRouter);

  // Health check endpoint for this frontend server
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      message: 'Educreds Frontend Server'
    });
  });

  // Configuration endpoint to provide frontend with deployment info
  app.get('/api/config', (req, res) => {
    res.json({
      backendUrl: process.env.VITE_API_URL || '',
      contractAddress: process.env.VITE_CONTRACT_ADDRESS || '',
      rpcUrl: process.env.VITE_ETHEREUM_RPC_URL || '',
      hasConfiguration: !!(process.env.VITE_API_URL && process.env.VITE_CONTRACT_ADDRESS)
    });
  });

  // In-memory storage for certificates (in production, use a database)
  const certificates: any[] = [];

  // Proxy issuance to Template Service (NestJS)
  const templateServiceBase = process.env.TEMPLATE_SERVICE_URL || 'http://localhost:4000';

  // Secure certificate issuance endpoint
  app.post('/api/certificates/issue',
    rateLimits.certificates,
    verifyToken,
    requireRole(['institution', 'admin']),
    upload.single('certificateFile'),
    certificateValidation.issue,
    requireSecureContext,
    validateBlockchainOperation,
    async (req: AuthenticatedRequest, res) => {
      try {
        const { studentName, studentEmail, studentWalletAddress, templateId, placeholders } = req.body;
        const response = await fetch(`${templateServiceBase}/issuance/single`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            recipientName: studentName,
            recipientEmail: studentEmail,
            recipientWalletAddress: studentWalletAddress,
            templateId,
            placeholders: placeholders ? JSON.parse(placeholders) : {},
          }),
        });
        const data = await response.json();
        return res.status(response.status).json(data);
      } catch (error) {
        console.error('Proxy single issuance error:', error);
        return res.status(500).json({ error: 'Failed to proxy issuance request' });
      }
    });

  // Secure bulk certificate issuance
  app.post('/api/certificates/issue-bulk',
    rateLimits.certificates,
    verifyToken,
    requireRole(['institution', 'admin']),
    certificateValidation.bulkIssue,
    requireSecureContext,
    async (req: AuthenticatedRequest, res) => {
      try {
        const entries = req.body?.entries || [];
        const response = await fetch(`${templateServiceBase}/issuance/bulk`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(entries),
        });
        const data = await response.json();
        return res.status(response.status).json(data);
      } catch (error) {
        console.error('Proxy bulk issuance error:', error);
        return res.status(500).json({ error: 'Failed to proxy bulk issuance' });
      }
    });

  app.get('/api/certificates/issuance-jobs/:id', async (req, res) => {
    try {
      const response = await fetch(`${templateServiceBase}/issuance/jobs/${req.params.id}`);
      const data = await response.json();
      return res.status(response.status).json(data);
    } catch (error) {
      console.error('Proxy get job error:', error);
      return res.status(500).json({ error: 'Failed to fetch job status' });
    }
  });

  app.get('/api/verify',
    async (req, res) => {
      try {
        const certId = req.query.certId;
        const response = await fetch(`${templateServiceBase}/verification/${certId}`);
        const data = await response.json();
        return res.status(response.status).json(data);
      } catch (error) {
        console.error('Proxy verify error:', error);
        return res.status(500).json({ error: 'Failed to proxy verification request' });
      }
    });

  // Secure institution certificates endpoint
  app.get('/api/certificates/institution',
    verifyToken,
    requireRole(['institution', 'admin']),
    async (req: AuthenticatedRequest, res) => {
      try {
        console.log('=== Fetching Institution Certificates ===');
        console.log('Total certificates in memory:', certificates.length);
        console.log('Certificates:', certificates);
        res.json({ certificates });
      } catch (error) {
        console.error('Get certificates error:', error);
        res.status(500).json({
          error: 'Internal server error while fetching certificates'
        });
      }
    });

  // Get dashboard stats endpoint
  app.get('/api/stats', async (req, res) => {
    try {
      console.log('Fetching dashboard stats');
      const stats = {
        totalCertificates: certificates.length,
        activeCertificates: certificates.filter(c => c.isValid).length,
        revokedCertificates: certificates.filter(c => !c.isValid).length,
        certificatesByType: [
          { _id: 'Academic', count: certificates.filter(c => c.certificateType === 'Academic').length },
          { _id: 'Professional', count: certificates.filter(c => c.certificateType === 'Professional').length },
          { _id: 'Training', count: certificates.filter(c => c.certificateType === 'Training').length }
        ]
      };
      res.json(stats);
    } catch (error) {
      console.error('Get stats error:', error);
      res.status(500).json({
        error: 'Internal server error while fetching stats'
      });
    }
  });

  // Get current subscription endpoint
  app.get('/api/subscription/current', async (req, res) => {
    try {
      console.log('Fetching current subscription');
      res.json({
        subscription: {
          planId: 'basic',
          status: 'active',
          currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        },
        usage: {
          certificatesThisMonth: certificates.length,
          storageUsed: 0.5,
          apiCallsThisMonth: 234
        }
      });
    } catch (error) {
      console.error('Get subscription error:', error);
      res.status(500).json({
        error: 'Internal server error while fetching subscription'
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
