import { Router } from 'express';
import { db } from '../config/database';
import bcrypt from 'bcryptjs';
import { authMiddleware, requireRole } from '../middleware/auth';

const router = Router();

// Middleware: All admin routes require authentication
router.use(authMiddleware);

// Routes accessible by Admin and Parent
// GET users with stats
router.get('/users', requireRole(['admin', 'parent']), (req: any, res) => {
    try {
        const user = req.user;
        let query = `
      SELECT 
        u.id, u.username, u.display_name, u.role, u.parent_id, u.created_at,
        us.quizzes_taken, us.total_words_studied, us.last_study_date,
        (SELECT AVG(score) FROM quiz_results WHERE user_id = u.id) as avg_score
      FROM users u
      LEFT JOIN user_stats us ON u.id = us.user_id
    `;

        let params: any[] = [];

        // If parent, only show their children
        if (user.role === 'parent') {
            query += ' WHERE u.parent_id = ?';
            params.push(user.userId);
        }

        query += ' ORDER BY u.created_at DESC';

        const users = db.prepare(query).all(...params);
        res.json(users);
    } catch (error) {
        console.error('Fetch users error:', error);
        res.status(500).json({ error: 'Failed to fetch users' });
    }
});

// Get detailed user stats
router.get('/users/:id/details', requireRole(['admin', 'parent']), (req: any, res) => {
    try {
        const userId = Number(req.params.id);
        const requestUser = req.user;

        // If parent, verify they are requesting their own child
        if (requestUser.role === 'parent') {
            const targetUser = db.prepare('SELECT parent_id FROM users WHERE id = ?').get(userId) as { parent_id: number };

            if (!targetUser || targetUser.parent_id !== requestUser.userId) {
                res.status(403).json({ error: 'Forbidden', message: 'You can only view your own students' });
                return;
            }
        }

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

// Create New User
router.post('/users', async (req, res) => {
    try {
        const { username, password, role, parentId } = req.body;

        if (!username || !password || !role) {
            res.status(400).json({ error: 'Missing required fields' });
            return;
        }

        if (!['student', 'parent', 'admin'].includes(role)) {
            res.status(400).json({ error: 'Invalid role' });
            return;
        }

        // Check availability
        const existing = db.prepare('SELECT id FROM users WHERE username = ?').get(username);
        if (existing) {
            res.status(409).json({ error: 'Username already taken' });
            return;
        }

        const hash = bcrypt.hashSync(password, 12);

        const result = db.transaction(() => {
            // Insert user
            const insert = db.prepare(`
                INSERT INTO users (username, password_hash, display_name, role, parent_id)
                VALUES (?, ?, ?, ?, ?)
            `);
            const info = insert.run(username, hash, username, role, parentId || null);
            const newId = info.lastInsertRowid;

            // Initialize stats
            db.prepare('INSERT INTO user_stats (user_id) VALUES (?)').run(newId);

            // Initialize settings
            db.prepare('INSERT INTO user_settings (user_id) VALUES (?)').run(newId);

            return newId;
        })();

        res.status(201).json({ success: true, userId: result, message: 'User created' });

    } catch (error) {
        console.error('Create user error:', error);
        res.status(500).json({ error: 'Failed to create user' });
    }
});

export default router;
