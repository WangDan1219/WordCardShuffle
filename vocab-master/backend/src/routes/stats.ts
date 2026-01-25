import { Router, Response } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { validate, updateStatsSchema } from '../middleware/validate.js';
import { statsRepository } from '../repositories/userRepository.js';
import db from '../config/database.js';
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

// GET /api/stats/weak-words - Get words the user struggles with
router.get('/weak-words', (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;

    // Get words where user got wrong more than 50% of the time
    const weakWords = db.prepare(`
      SELECT
        word,
        SUM(CASE WHEN is_correct = 0 THEN 1 ELSE 0 END) as incorrect_count,
        SUM(CASE WHEN is_correct = 1 THEN 1 ELSE 0 END) as correct_count,
        COUNT(*) as total_attempts
      FROM quiz_answers qa
      JOIN quiz_results qr ON qa.quiz_result_id = qr.id
      WHERE qr.user_id = ?
      GROUP BY word
      HAVING incorrect_count > 0
      ORDER BY incorrect_count DESC, total_attempts DESC
      LIMIT 50
    `).all(userId) as Array<{
      word: string;
      incorrect_count: number;
      correct_count: number;
      total_attempts: number;
    }>;

    res.json({
      weakWords: weakWords.map(w => ({
        word: w.word,
        incorrectCount: w.incorrect_count,
        correctCount: w.correct_count,
        totalAttempts: w.total_attempts,
        accuracy: Math.round((w.correct_count / w.total_attempts) * 100)
      }))
    });
  } catch (error) {
    res.status(500).json({
      error: 'Internal Server Error',
      message: error instanceof Error ? error.message : 'Failed to get weak words'
    });
  }
});

export default router;
