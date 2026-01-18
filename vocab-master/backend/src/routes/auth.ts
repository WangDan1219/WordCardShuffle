import { Router, Response } from 'express';
import { authService } from '../services/authService.js';
import { authMiddleware } from '../middleware/auth.js';
import { validate, registerSchema, loginSchema, refreshSchema } from '../middleware/validate.js';
import type { AuthRequest, RegisterRequest, LoginRequest } from '../types/index.js';

const router = Router();

// POST /api/auth/register
router.post('/register', validate(registerSchema), async (req: AuthRequest, res: Response) => {
  try {
    const { username, password, displayName } = req.body as RegisterRequest;
    const result = await authService.register(username, password, displayName);

    res.status(201).json({
      user: result.user,
      tokens: result.tokens
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Registration failed';

    if (message === 'Username already taken') {
      res.status(409).json({ error: 'Conflict', message });
    } else {
      res.status(400).json({ error: 'Bad Request', message });
    }
  }
});

// POST /api/auth/login
router.post('/login', validate(loginSchema), async (req: AuthRequest, res: Response) => {
  try {
    const { username, password } = req.body as LoginRequest;
    const result = await authService.login(username, password);

    res.json({
      user: result.user,
      tokens: result.tokens
    });
  } catch (error) {
    res.status(401).json({
      error: 'Unauthorized',
      message: error instanceof Error ? error.message : 'Login failed'
    });
  }
});

// POST /api/auth/logout
router.post('/logout', (req: AuthRequest, res: Response) => {
  try {
    const { refreshToken } = req.body;

    if (refreshToken) {
      authService.logout(refreshToken);
    }

    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    res.status(500).json({
      error: 'Internal Server Error',
      message: error instanceof Error ? error.message : 'Logout failed'
    });
  }
});

// POST /api/auth/refresh
router.post('/refresh', validate(refreshSchema), async (req: AuthRequest, res: Response) => {
  try {
    const { refreshToken } = req.body;
    const tokens = await authService.refresh(refreshToken);

    res.json({ tokens });
  } catch (error) {
    res.status(401).json({
      error: 'Unauthorized',
      message: error instanceof Error ? error.message : 'Token refresh failed'
    });
  }
});

// GET /api/auth/me
router.get('/me', authMiddleware, (req: AuthRequest, res: Response) => {
  try {
    const user = authService.getUser(req.user!.userId);

    if (!user) {
      res.status(404).json({
        error: 'Not Found',
        message: 'User not found'
      });
      return;
    }

    res.json({ user });
  } catch (error) {
    res.status(500).json({
      error: 'Internal Server Error',
      message: error instanceof Error ? error.message : 'Failed to get user'
    });
  }
});

export default router;
