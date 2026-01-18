import { Router, Response } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { validate, updateSettingsSchema } from '../middleware/validate.js';
import { settingsRepository } from '../repositories/userRepository.js';
import type { AuthRequest, UserSettings, UpdateSettingsRequest } from '../types/index.js';

const router = Router();

// All settings routes require authentication
router.use(authMiddleware);

// GET /api/settings
router.get('/', (req: AuthRequest, res: Response) => {
  try {
    const settings = settingsRepository.get(req.user!.userId);

    if (!settings) {
      res.status(404).json({
        error: 'Not Found',
        message: 'Settings not found'
      });
      return;
    }

    const response: UserSettings = {
      soundEnabled: settings.sound_enabled === 1,
      autoAdvance: settings.auto_advance === 1
    };

    res.json(response);
  } catch (error) {
    res.status(500).json({
      error: 'Internal Server Error',
      message: error instanceof Error ? error.message : 'Failed to get settings'
    });
  }
});

// PUT /api/settings
router.put('/', validate(updateSettingsSchema), (req: AuthRequest, res: Response) => {
  try {
    const { soundEnabled, autoAdvance } = req.body as UpdateSettingsRequest;

    const settings = settingsRepository.update(
      req.user!.userId,
      soundEnabled,
      autoAdvance
    );

    const response: UserSettings = {
      soundEnabled: settings.sound_enabled === 1,
      autoAdvance: settings.auto_advance === 1
    };

    res.json(response);
  } catch (error) {
    res.status(500).json({
      error: 'Internal Server Error',
      message: error instanceof Error ? error.message : 'Failed to update settings'
    });
  }
});

export default router;
