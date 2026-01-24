import { Router, Response } from 'express';
import { quizResultRepository } from '../repositories/quizResultRepository';
import { statsRepository } from '../repositories/userRepository';
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

        // Increment stats based on quiz type
        if (quizType === 'quiz') {
            statsRepository.incrementStats(userId, { quizzesTaken: 1 });
        } else if (quizType === 'challenge') {
            const currentStats = statsRepository.get(userId);
            statsRepository.incrementStats(userId, { challengesCompleted: 1 });
            // Update best challenge score if this is higher
            if (currentStats && pointsEarned > currentStats.best_challenge_score) {
                statsRepository.update(userId, { bestChallengeScore: pointsEarned });
            }
        }

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
