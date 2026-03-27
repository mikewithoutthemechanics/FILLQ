import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

/**
 * GET /api/filliq/settings
 * Get FillIQ settings for studio
 */
router.get('/', async (req, res) => {
  try {
    const { studioId = 'default-studio' } = req.query;

    let settings = await prisma.fillIQSettings.findUnique({
      where: { studioId: studioId as string }
    });

    if (!settings) {
      // Create default settings
      settings = await prisma.fillIQSettings.create({
        data: {
          studioId: studioId as string
        }
      });
    }

    // Remove sensitive data
    const { wabaAccessTokenEncrypted, ...safeSettings } = settings as any;

    res.json({
      success: true,
      data: safeSettings
    });
  } catch (error) {
    console.error('Error fetching settings:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch settings'
    });
  }
});

/**
 * PUT /api/filliq/settings
 * Update FillIQ settings
 */
router.put('/', async (req, res) => {
  try {
    const { studioId = 'default-studio' } = req.query;
    const updateData = req.body;

    // Remove fields that shouldn't be updated directly
    delete updateData.id;
    delete updateData.studioId;
    delete updateData.createdAt;
    delete updateData.updatedAt;

    const settings = await prisma.fillIQSettings.upsert({
      where: { studioId: studioId as string },
      update: updateData,
      create: {
        studioId: studioId as string,
        ...updateData
      }
    });

    // Remove sensitive data from response
    const { wabaAccessTokenEncrypted, ...safeSettings } = settings as any;

    res.json({
      success: true,
      data: safeSettings
    });
  } catch (error) {
    console.error('Error updating settings:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update settings'
    });
  }
});

/**
 * PUT /api/filliq/settings/whatsapp
 * Update WhatsApp configuration
 */
router.put('/whatsapp', async (req, res) => {
  try {
    const { studioId = 'default-studio' } = req.query;
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
    
    // In production, encrypt the access token
    if (wabaAccessToken) {
      updateData.wabaAccessTokenEncrypted = wabaAccessToken; // TODO: encrypt
    }

    const settings = await prisma.fillIQSettings.upsert({
      where: { studioId: studioId as string },
      update: updateData,
      create: {
        studioId: studioId as string,
        ...updateData
      }
    });

    // Remove sensitive data from response
    const { wabaAccessTokenEncrypted, ...safeSettings } = settings as any;

    res.json({
      success: true,
      message: 'WhatsApp settings updated',
      data: safeSettings
    });
  } catch (error) {
    console.error('Error updating WhatsApp settings:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update WhatsApp settings'
    });
  }
});

export default router;
