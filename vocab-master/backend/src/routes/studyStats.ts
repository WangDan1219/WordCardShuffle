import { Router, Response } from 'express';
import { quizResultRepository } from '../repositories/quizResultRepository';
import { authMiddleware } from '../middleware/auth';
import type { AuthRequest } from '../types';

const router = Router();

// Save study session
router.post('/', authMiddleware, (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user!.userId;
        const { wordsReviewed, startTime, endTime } = req.body;

        const sessionId = quizResultRepository.createStudySession({
            userId,
            wordsReviewed,
            startTime: new Date(startTime),
            endTime: new Date(endTime)
        });

        res.status(201).json({
            success: true,
            sessionId,
            message: 'Study session saved successfully'
        });
    } catch (error) {
        console.error('Error saving study session:', error);
        res.status(500).json({ error: 'Failed to save study session' });
    }
});

// Get user's study history
router.get('/history', authMiddleware, (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user!.userId;
        const history = quizResultRepository.getStudySessionsByUserId(userId);
        res.json(history);
    } catch (error) {
        console.error('Error fetching study history:', error);
        res.status(500).json({ error: 'Failed to fetch study history' });
    }
});

export default router;
