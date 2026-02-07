import { Router } from 'express';
import { z } from 'zod';
import { storage } from '../storage';
import { AuthenticatedRequest, verifyToken, requireRole } from '../lib/auth-security';
import { generateApiKey, hashApiKey } from '../lib/api-key-generator';
import { insertApiKeySchema } from '@shared/schema';

const router = Router();

// Validation schema for generating keys
const generateKeySchema = z.object({
    name: z.string().min(1, "Name is required").max(50, "Name too long"),
    expiry: z.enum(['12h', '78h', 'never'])
});

/**
 * GET /keys - List all active API keys for the authenticated institution
 */
router.get('/keys', verifyToken, requireRole(['institution', 'admin']), async (req: AuthenticatedRequest, res) => {
    try {
        const institutionId = req.user!.institutionId;
        if (!institutionId) {
            return res.status(400).json({ error: 'User not associated with an institution' });
        }

        const keys = await storage.getApiKeys(institutionId);

        // Return keys without the sensitive hash
        const safeKeys = keys.map(key => ({
            id: key.id,
            name: key.name,
            prefix: key.prefix,
            createdAt: key.createdAt,
            expiresAt: key.expiresAt,
            lastUsedAt: key.lastUsedAt,
            isActive: key.isActive
        }));

        res.json(safeKeys);
    } catch (error) {
        console.error('Error listing API keys:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * POST /keys - Generate a new API key
 */
router.post('/keys', verifyToken, requireRole(['institution', 'admin']), async (req: AuthenticatedRequest, res) => {
    try {
        const institutionId = req.user!.institutionId;
        if (!institutionId) {
            return res.status(400).json({ error: 'User not associated with an institution' });
        }

        // 1. Validate Input
        const validatedData = generateKeySchema.parse(req.body);

        // 2. Check Limits (Max 3 active keys)
        const existingKeys = await storage.getApiKeys(institutionId);
        if (existingKeys.length >= 3) {
            return res.status(400).json({
                error: 'Key limit reached',
                message: 'You can only have a maximum of 3 active API keys.'
            });
        }

        // 3. Generate Key
        const { apiKey, prefix } = generateApiKey();
        const keyHash = await hashApiKey(apiKey);

        // 4. Calculate Expiry
        let expiresAt: Date | undefined;
        const now = new Date();
        if (validatedData.expiry === '12h') {
            expiresAt = new Date(now.getTime() + 12 * 60 * 60 * 1000);
        } else if (validatedData.expiry === '78h') {
            expiresAt = new Date(now.getTime() + 78 * 60 * 60 * 1000);
        }
        // 'never' leaves expiresAt undefined

        // 5. Store Key
        const newKey = await storage.createApiKey({
            institutionId,
            name: validatedData.name,
            keyHash,
            prefix,
            isActive: true,
            createdAt: new Date(),
            expiresAt: expiresAt ? expiresAt.toISOString() : undefined
        } as any); // Type assertion needed due to Zod schema differences in insert vs storage

        // 6. Return Key (Secret is returned ONLY here)
        res.status(201).json({
            id: newKey.id,
            name: newKey.name,
            apiKey: apiKey, // The full secret key
            prefix: newKey.prefix,
            createdAt: newKey.createdAt,
            expiresAt: newKey.expiresAt
        });

    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: 'Validation error', details: error.errors });
        }
        console.error('Error generating API key:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * DELETE /keys/:id - Revoke an API key
 */
router.delete('/keys/:id', verifyToken, requireRole(['institution', 'admin']), async (req: AuthenticatedRequest, res) => {
    try {
        const institutionId = req.user!.institutionId;
        const keyId = req.params.id;

        // Verify ownership
        const key = await storage.getApiKey(keyId);
        if (!key) {
            return res.status(404).json({ error: 'Key not found' });
        }

        if (key.institutionId !== institutionId && req.user!.role !== 'admin') {
            return res.status(403).json({ error: 'Not authorized to revoke this key' });
        }

        await storage.revokeApiKey(keyId);
        res.json({ success: true, message: 'API key revoked successfully' });

    } catch (error) {
        console.error('Error revoking API key:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * GET /subscription-status - Check subscription status
 */
router.get('/subscription-status', verifyToken, requireRole(['institution', 'admin']), async (req: AuthenticatedRequest, res) => {
    try {
        const institutionId = req.user!.institutionId;
        if (!institutionId) {
            return res.status(400).json({ error: 'User not associated with an institution' });
        }

        // For MVP/Demo: Mock subscription status or fetch from institution if available
        // Ideally we fetch from storage.getSubscription(institutionId)
        // Here we'll return a mock valid status to allow functionality

        res.json({
            active: true,
            plan: 'pro', // Default to pro for testing
            features: ['api_access', 'webhooks']
        });

    } catch (error) {
        console.error('Error checking subscription:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;
