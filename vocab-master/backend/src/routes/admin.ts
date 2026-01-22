import { Router } from 'express';
import { db } from '../config/database';
import { authMiddleware, requireRole } from '../middleware/auth';

const router = Router();

// Middleware: All admin routes require authentication and 'admin' role
router.use(authMiddleware);
router.use(requireRole(['admin']));

// Get all users with stats
router.get('/users', (req, res) => {
    try {
        const users = db.prepare(`
      SELECT 
        u.id, u.username, u.display_name, u.role, u.parent_id, u.created_at,
        us.quizzes_taken, us.total_words_studied, us.last_study_date,
        (SELECT AVG(score) FROM quiz_results WHERE user_id = u.id) as avg_score
      FROM users u
      LEFT JOIN user_stats us ON u.id = us.user_id
      ORDER BY u.created_at DESC
    `).all();
        res.json(users);
    } catch (error) {
        console.error('Fetch users error:', error);
        res.status(500).json({ error: 'Failed to fetch users' });
    }
});

// Get detailed user stats
router.get('/users/:id/details', (req, res) => {
    try {
        const userId = req.params.id;

        // Quiz History
        const quizHistory = db.prepare(`
      SELECT * FROM quiz_results WHERE user_id = ? ORDER BY completed_at DESC LIMIT 50
    `).all(userId);

        // Study History
        const studyHistory = db.prepare(`
      SELECT * FROM study_sessions WHERE user_id = ? ORDER BY start_time DESC LIMIT 50
    `).all(userId);

        // Weak Words (wrong more than correct)
        const weakWords = db.prepare(`
      SELECT word, 
        SUM(CASE WHEN is_correct = 0 THEN 1 ELSE 0 END) as incorrect_count,
        COUNT(*) as total_attempts
      FROM quiz_answers qa
      JOIN quiz_results qr ON qa.quiz_result_id = qr.id
      WHERE qr.user_id = ?
      GROUP BY word
      HAVING incorrect_count > total_attempts * 0.5
      ORDER BY incorrect_count DESC
      LIMIT 20
    `).all(userId);

        res.json({ quizHistory, studyHistory, weakWords });
    } catch (error) {
        console.error('Fetch user details error:', error);
        res.status(500).json({ error: 'Failed to fetch user details' });
    }
});

// Update User Role
router.patch('/users/:id/role', (req, res) => {
    try {
        const { role } = req.body;
        const userId = req.params.id;

        if (!['student', 'parent', 'admin'].includes(role)) {
            res.status(400).json({ error: 'Invalid role' });
            return;
        }

        const stmt = db.prepare('UPDATE users SET role = ? WHERE id = ?');
        const result = stmt.run(role, userId);

        if (result.changes === 0) {
            res.status(404).json({ error: 'User not found' });
            return;
        }

        res.json({ success: true, message: 'Role updated' });
    } catch (error) {
        console.error('Update role error:', error);
        res.status(500).json({ error: 'Failed to update role' });
    }
});

// Link Student to Parent
router.patch('/users/:id/parent', (req, res) => {
    try {
        const { parentId } = req.body; // Can be null to unlink
        const userId = req.params.id;

        // Verify parent exists and is actually a parent (optional, but good for integrity)
        if (parentId) {
            const parent = db.prepare('SELECT role FROM users WHERE id = ?').get(parentId) as { role: string };
            if (!parent || parent.role !== 'parent') {
                res.status(400).json({ error: 'Invalid parent ID provided' });
                return;
            }
        }

        const stmt = db.prepare('UPDATE users SET parent_id = ? WHERE id = ?');
        const result = stmt.run(parentId, userId);

        if (result.changes === 0) {
            res.status(404).json({ error: 'User not found' });
            return;
        }

        res.json({ success: true, message: 'Parent link updated' });
    } catch (error) {
        console.error('Update parent link error:', error);
        res.status(500).json({ error: 'Failed to update parent link' });
    }
});

export default router;
