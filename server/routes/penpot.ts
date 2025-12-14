import { Router } from 'express';
import { penpotService } from '../services/PenpotIntegrationService';
import { templatesService } from '../services/TemplatesService';
import { authMiddleware } from '../middleware/auth';

const router = Router();

/**
 * Get all Penpot projects
 */
router.get('/projects', authMiddleware, async (req, res) => {
  try {
    const projects = await penpotService.getProjects();
    res.json({ success: true, data: projects });
  } catch (error) {
    console.error('Error fetching Penpot projects:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch projects from Penpot' 
    });
  }
});

/**
 * Get files from a specific project
 */
router.get('/projects/:projectId/files', authMiddleware, async (req, res) => {
  try {
    const { projectId } = req.params;
    const files = await penpotService.getProjectFiles(projectId);
    res.json({ success: true, data: files });
  } catch (error) {
    console.error('Error fetching project files:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch project files' 
    });
  }
});

/**
 * Get a specific file
 */
router.get('/files/:fileId', authMiddleware, async (req, res) => {
  try {
    const { fileId } = req.params;
    const file = await penpotService.getFile(fileId);
    res.json({ success: true, data: file });
  } catch (error) {
    console.error('Error fetching file:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch file' 
    });
  }
});

/**
 * Convert Penpot file to EduCreds template
 */
router.post('/files/:fileId/convert', authMiddleware, async (req, res) => {
  try {
    const { fileId } = req.params;
    const { category, description, price } = req.body;
    
    // Get Penpot file
    const penpotFile = await penpotService.getFile(fileId);
    
    // Convert to template
    const templateData = await penpotService.convertToTemplate(penpotFile);
    
    // Add marketplace metadata
    if (category) templateData.metadata!.category = category;
    if (description) templateData.metadata!.description = description;
    
    // Save to EduCreds database
    const template = await templatesService.create({
      ...templateData,
      price: price || 0,
      creatorId: req.user.id,
      isPublished: false,
      penpotFileId: fileId,
      penpotProjectId: penpotFile.projectId
    });

    res.json({ success: true, data: template });
  } catch (error) {
    console.error('Error converting file to template:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to convert file to template' 
    });
  }
});

/**
 * Sync templates from Penpot project
 */
router.post('/projects/:projectId/sync', authMiddleware, async (req, res) => {
  try {
    const { projectId } = req.params;
    const templates = await penpotService.syncTemplatesFromProject(projectId);
    
    const savedTemplates = [];
    for (const templateData of templates) {
      try {
        const template = await templatesService.create({
          ...templateData,
          creatorId: req.user.id,
          isPublished: false
        });
        savedTemplates.push(template);
      } catch (error) {
        console.error('Error saving template:', error);
        // Continue with other templates
      }
    }

    res.json({ 
      success: true, 
      data: savedTemplates,
      message: `Synced ${savedTemplates.length} templates from project`
    });
  } catch (error) {
    console.error('Error syncing project:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to sync project templates' 
    });
  }
});

/**
 * Export template with certificate data
 */
router.post('/templates/:templateId/export', authMiddleware, async (req, res) => {
  try {
    const { templateId } = req.params;
    const { certificateData, format = 'svg' } = req.body;
    
    // Get template
    const template = await templatesService.getById(templateId);
    if (!template || !template.penpotFileId) {
      return res.status(404).json({ 
        success: false, 
        error: 'Template not found or not linked to Penpot' 
      });
    }

    // Export from Penpot
    const svg = await penpotService.exportFileAsSvg(template.penpotFileId, certificateData);
    
    if (format === 'svg') {
      res.setHeader('Content-Type', 'image/svg+xml');
      res.send(svg);
    } else if (format === 'pdf') {
      // Convert SVG to PDF (you'll need to implement this)
      // const pdf = await pdfService.convertSvgToPdf(svg);
      // res.setHeader('Content-Type', 'application/pdf');
      // res.send(pdf);
      res.status(501).json({ 
        success: false, 
        error: 'PDF export not yet implemented' 
      });
    } else {
      res.status(400).json({ 
        success: false, 
        error: 'Unsupported export format' 
      });
    }
  } catch (error) {
    console.error('Error exporting template:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to export template' 
    });
  }
});

/**
 * Create SSO token for Penpot access
 */
router.post('/sso-token', authMiddleware, async (req, res) => {
  try {
    const token = await penpotService.createSSOToken(req.user.id, req.user.email);
    res.json({ success: true, data: { token } });
  } catch (error) {
    console.error('Error creating SSO token:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to create SSO token' 
    });
  }
});

/**
 * Get file thumbnail
 */
router.get('/files/:fileId/thumbnail', async (req, res) => {
  try {
    const { fileId } = req.params;
    const thumbnailUrl = await penpotService.getFileThumbnail(fileId);
    res.json({ success: true, data: { thumbnailUrl } });
  } catch (error) {
    console.error('Error fetching thumbnail:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch thumbnail' 
    });
  }
});

/**
 * Webhook endpoint for Penpot file updates
 */
router.post('/webhooks/file-updated', async (req, res) => {
  try {
    const { fileId, projectId, changes } = req.body;
    
    // Find templates linked to this Penpot file
    const templates = await templatesService.findByPenpotFileId(fileId);
    
    for (const template of templates) {
      try {
        // Update template from Penpot
        const penpotFile = await penpotService.getFile(fileId);
        const updatedTemplate = await penpotService.convertToTemplate(penpotFile);
        
        // Update in database
        await templatesService.update(template.id, {
          design: updatedTemplate.design,
          metadata: {
            ...template.metadata,
            ...updatedTemplate.metadata,
            updatedAt: new Date()
          }
        });
        
        console.log(`Updated template ${template.id} from Penpot file ${fileId}`);
      } catch (error) {
        console.error(`Failed to update template ${template.id}:`, error);
      }
    }
    
    res.json({ success: true, message: 'Templates updated successfully' });
  } catch (error) {
    console.error('Error handling Penpot webhook:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to process webhook' 
    });
  }
});

/**
 * Health check endpoint
 */
router.get('/health', async (req, res) => {
  try {
    const isHealthy = await penpotService.healthCheck();
    res.json({ 
      success: true, 
      data: { 
        penpotConnected: isHealthy,
        timestamp: new Date().toISOString()
      } 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: 'Health check failed' 
    });
  }
});

export default router;