import { Router } from 'express';
import { query, body } from 'express-validator';
import { prisma } from '../lib/supabase.js';
import { optionalAuthMiddleware } from '../middleware/supabaseAuth.js';
import { validateRequest } from '../middleware/validation.js';
import { encryptText } from '../lib/crypto.js';
import { logger } from '../lib/logger.js';

const router = Router();

router.use(optionalAuthMiddleware);

/**
 * GET /api/filliq/settings
 * Get FillIQ settings for studio
 */
router.get(
  '/',
  [query('studioId').optional().isString().trim()],
  validateRequest,
  async (req: any, res: any) => {
    try {
      const studioId = (req.query.studioId as string) || req.user?.studioId || 'default-studio';

      let settings = await prisma.fillIQSettings.findUnique({
        where: { studioId }
      });

      if (!settings) {
        settings = await prisma.fillIQSettings.create({
          data: {
            studioId
          }
        });
      }

      const { wabaAccessTokenEncrypted, ...safeSettings } = settings as any;

      res.json({
        success: true,
        data: safeSettings
      });
    } catch (error) {
      logger.error('Error fetching settings:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch settings'
      });
    }
  }
);

/**
 * PUT /api/filliq/settings
 * Update FillIQ settings
 */
router.put(
  '/',
  [query('studioId').optional().isString().trim()],
  validateRequest,
  async (req: any, res: any) => {
    try {
      const studioId = (req.query.studioId as string) || req.user?.studioId || 'default-studio';
      const updateData = { ...req.body };

      delete updateData.id;
      delete updateData.studioId;
      delete updateData.createdAt;
      delete updateData.updatedAt;

      const settings = await prisma.fillIQSettings.upsert({
        where: { studioId },
        update: updateData,
        create: {
          studioId,
          ...updateData
        }
      });

      const { wabaAccessTokenEncrypted, ...safeSettings } = settings as any;

      res.json({
        success: true,
        data: safeSettings
      });
    } catch (error) {
      logger.error('Error updating settings:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update settings'
      });
    }
  }
);

/**
 * PUT /api/filliq/settings/whatsapp
 * Update WhatsApp configuration securely
 */
router.put(
  '/whatsapp',
  [
    query('studioId').optional().isString().trim(),
    body('wabaProvider').optional().isString().trim().isIn(['360dialog', 'vonage']),
    body('wabaPhoneNumberId').optional().isString().trim(),
    body('wabaAccessToken').optional().isString().trim().isLength({ min: 10 }).withMessage('wabaAccessToken must be at least 10 characters'),
    body('studioWhatsAppNumber').optional().isString().trim()
  ],
  validateRequest,
  async (req: any, res: any) => {
    try {
      const studioId = (req.query.studioId as string) || req.user?.studioId || 'default-studio';
      const {
        wabaProvider,
        wabaPhoneNumberId,
        wabaAccessToken,
        studioWhatsAppNumber
      } = req.body;

      const updateData: any = {};
      if (wabaProvider) updateData.wabaProvider = wabaProvider;
      if (wabaPhoneNumberId) updateData.wabaPhoneNumberId = wabaPhoneNumberId;
      if (studioWhatsAppNumber) updateData.studioWhatsAppNumber = studioWhatsAppNumber;

      if (wabaAccessToken) {
        updateData.wabaAccessTokenEncrypted = encryptText(wabaAccessToken);
      }

      const settings = await prisma.fillIQSettings.upsert({
        where: { studioId },
        update: updateData,
        create: {
          studioId,
          ...updateData
        }
      });

      const { wabaAccessTokenEncrypted, ...safeSettings } = settings as any;

      res.json({
        success: true,
        message: 'WhatsApp settings updated',
        data: safeSettings
      });
    } catch (error) {
      logger.error('Error updating WhatsApp settings:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update WhatsApp settings'
      });
    }
  }
);

export default router;
