import { Router, Response } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { validate, updateStatsSchema } from '../middleware/validate.js';
import { statsRepository } from '../repositories/userRepository.js';
import type { AuthRequest, UserStats, UpdateStatsRequest } from '../types/index.js';

const router = Router();

// All stats routes require authentication
router.use(authMiddleware);

// GET /api/stats
router.get('/', (req: AuthRequest, res: Response) => {
  try {
    let stats = statsRepository.get(req.user!.userId);

    // Auto-create stats if they don't exist
    if (!stats) {
      stats = statsRepository.createDefault(req.user!.userId);
    }

    const response: UserStats = {
      totalWordsStudied: stats.total_words_studied,
      quizzesTaken: stats.quizzes_taken,
      challengesCompleted: stats.challenges_completed,
      bestChallengeScore: stats.best_challenge_score,
      lastStudyDate: stats.last_study_date
    };

    res.json(response);
  } catch (error) {
    res.status(500).json({
      error: 'Internal Server Error',
      message: error instanceof Error ? error.message : 'Failed to get stats'
    });
  }
});

// PATCH /api/stats
router.patch('/', validate(updateStatsSchema), (req: AuthRequest, res: Response) => {
  try {
    const updates = req.body as UpdateStatsRequest;

    const stats = statsRepository.update(req.user!.userId, {
      totalWordsStudied: updates.totalWordsStudied,
      quizzesTaken: updates.quizzesTaken,
      challengesCompleted: updates.challengesCompleted,
      bestChallengeScore: updates.bestChallengeScore,
      lastStudyDate: updates.lastStudyDate
    });

    const response: UserStats = {
      totalWordsStudied: stats.total_words_studied,
      quizzesTaken: stats.quizzes_taken,
      challengesCompleted: stats.challenges_completed,
      bestChallengeScore: stats.best_challenge_score,
      lastStudyDate: stats.last_study_date
    };

    res.json(response);
  } catch (error) {
    res.status(500).json({
      error: 'Internal Server Error',
      message: error instanceof Error ? error.message : 'Failed to update stats'
    });
  }
});

// POST /api/stats/increment
router.post('/increment', (req: AuthRequest, res: Response) => {
  try {
    const { totalWordsStudied, quizzesTaken, challengesCompleted } = req.body;

    const stats = statsRepository.incrementStats(req.user!.userId, {
      totalWordsStudied,
      quizzesTaken,
      challengesCompleted
    });

    const response: UserStats = {
      totalWordsStudied: stats.total_words_studied,
      quizzesTaken: stats.quizzes_taken,
      challengesCompleted: stats.challenges_completed,
      bestChallengeScore: stats.best_challenge_score,
      lastStudyDate: stats.last_study_date
    };

    res.json(response);
  } catch (error) {
    res.status(500).json({
      error: 'Internal Server Error',
      message: error instanceof Error ? error.message : 'Failed to increment stats'
    });
  }
});

export default router;
