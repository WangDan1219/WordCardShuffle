import { Router, Response } from 'express';
import { quizResultRepository } from '../repositories/quizResultRepository';
import { authMiddleware } from '../middleware/auth';
import type { AuthRequest } from '../types';

const router = Router();

// Save quiz result
router.post('/', authMiddleware, (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user!.userId;
        const {
            quizType,
            totalQuestions,
            correctAnswers,
            score,
            timePerQuestion,
            totalTimeSpent,
            pointsEarned,
            answers
        } = req.body;

        const resultId = quizResultRepository.create({
            userId,
            quizType,
            totalQuestions,
            correctAnswers,
            score,
            timePerQuestion,
            totalTimeSpent,
            pointsEarned,
            answers
        });

        res.status(201).json({
            success: true,
            resultId,
            message: 'Quiz result saved successfully'
        });
    } catch (error) {
        console.error('Error saving quiz result:', error);
        res.status(500).json({ error: 'Failed to save quiz result' });
    }
});

// Get user's quiz history
router.get('/history', authMiddleware, (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user!.userId;
        const history = quizResultRepository.getByUserId(userId);
        res.json(history);
    } catch (error) {
        console.error('Error fetching quiz history:', error);
        res.status(500).json({ error: 'Failed to fetch quiz history' });
    }
});

export default router;
