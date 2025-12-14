import { Router } from 'express';
import { z } from 'zod';
import { validateRequest } from '../lib/validation';
import { marketplaceApi } from '../../client/src/lib/marketplaceApi';

const router = Router();

// Proxy marketplace API calls to cert_backend
router.get('/templates', async (req, res) => {
  try {
    const templates = await marketplaceApi.getTemplates(req.query as any);
    res.json(templates);
  } catch (error) {
    console.error('Error fetching templates:', error);
    res.status(500).json({ error: 'Failed to fetch templates' });
  }
});

router.get('/templates/:id', async (req, res) => {
  try {
    const template = await marketplaceApi.getTemplate(req.params.id);
    res.json(template);
  } catch (error) {
    console.error('Error fetching template:', error);
    res.status(500).json({ error: 'Failed to fetch template' });
  }
});

router.post('/templates/:id/purchase', async (req, res) => {
  try {
    const { institutionId } = req.body;
    const purchase = await marketplaceApi.purchaseTemplate(req.params.id, institutionId);
    res.json(purchase);
  } catch (error) {
    console.error('Error purchasing template:', error);
    res.status(500).json({ error: 'Failed to purchase template' });
  }
});

router.get('/institutions/:institutionId/templates', async (req, res) => {
  try {
    const templates = await marketplaceApi.getInstitutionTemplates(req.params.institutionId);
    res.json(templates);
  } catch (error) {
    console.error('Error fetching institution templates:', error);
    res.status(500).json({ error: 'Failed to fetch institution templates' });
  }
});

router.post('/institutions/:institutionId/templates/:templateId/use', async (req, res) => {
  try {
    const usage = await marketplaceApi.useTemplate(
      req.params.institutionId,
      req.params.templateId,
      req.body
    );
    res.json(usage);
  } catch (error) {
    console.error('Error using template:', error);
    res.status(500).json({ error: 'Failed to use template' });
  }
});

router.get('/institutions/:institutionId/analytics', async (req, res) => {
  try {
    const analytics = await marketplaceApi.getUsageAnalytics(req.params.institutionId);
    res.json(analytics);
  } catch (error) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

export default router;