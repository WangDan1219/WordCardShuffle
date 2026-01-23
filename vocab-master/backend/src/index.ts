import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from parent directory if available
dotenv.config({ path: path.join(process.cwd(), '../.env') });
// Also try loading from current directory (will not overwrite existing keys)
dotenv.config();
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { initializeDatabase, closeDatabase } from './config/database.js';
import { authRoutes, settingsRoutes, statsRoutes, challengesRoutes, migrateRoutes, quizResultsRoutes, studyStatsRoutes, adminRoutes } from './routes/index.js';
import { authService } from './services/authService.js';

const app = express();
app.set('trust proxy', 1); // Trust first main proxy (likely Nginx/Docker)
const PORT = process.env.PORT || 9876;

// Initialize database
initializeDatabase();

// Cleanup expired tokens periodically (every hour)
setInterval(() => {
  authService.cleanupExpiredTokens();
}, 60 * 60 * 1000);

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || ['http://localhost:5173', 'http://localhost:5174'],
  credentials: true
}));
app.use(express.json());

// Rate limiting for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // 20 requests per window
  message: { error: 'Too Many Requests', message: 'Too many login attempts, please try again later' },
  standardHeaders: true,
  legacyHeaders: false
});

// General rate limiter
const generalLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // 100 requests per minute
  message: { error: 'Too Many Requests', message: 'Please slow down your requests' },
  standardHeaders: true,
  legacyHeaders: false
});

app.use('/api/auth', authLimiter);
app.use('/api', generalLimiter);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/challenges', challengesRoutes);
app.use('/api/migrate', migrateRoutes);
app.use('/api/quiz-results', quizResultsRoutes);
app.use('/api/study-stats', studyStatsRoutes);
app.use('/api/admin', adminRoutes);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ error: 'Not Found', message: 'Endpoint not found' });
});

// Error handler
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'production' ? 'An unexpected error occurred' : err.message
  });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down...');
  closeDatabase();
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down...');
  closeDatabase();
  process.exit(0);
});

const HOST = process.env.HOST || '127.0.0.1';

app.listen(Number(PORT), HOST, () => {
  console.log(`Server running on http://${HOST}:${PORT}`);
  console.log(`Health check: http://${HOST}:${PORT}/api/health`);
});

export default app;
