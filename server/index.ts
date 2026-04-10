import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
import { config } from './config.js';
import { authMiddleware, adminMiddleware } from './middleware/auth.js';
import { errorHandler } from './middleware/error.js';
import { ensureAdmin } from './services/auth.service.js';
import { seedDefaults } from './services/skill.service.js';

// Routes
import authRoutes from './routes/auth.routes.js';
import meetingsRoutes from './routes/meetings.routes.js';
import skillsRoutes from './routes/skills.routes.js';
import adminRoutes from './routes/admin.routes.js';

const app = express();

// ── Security ────────────────────────────────────────────
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors());
app.use(express.json({ limit: '2mb' }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api', limiter);

// ── API Routes ──────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/meetings', authMiddleware, meetingsRoutes);
app.use('/api/skills', authMiddleware, skillsRoutes);
app.use('/api/admin', authMiddleware, adminMiddleware, adminRoutes);

// ── Health check ────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ── Serve frontend (production) ─────────────────────────
const distPath = path.join(__dirname, '..', 'dist');
app.use(express.static(distPath));
app.get('/{*path}', (_req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

// ── Error handler ───────────────────────────────────────
app.use(errorHandler);

// ── Start ───────────────────────────────────────────────
async function bootstrap() {
  // Seed defaults and admin
  await seedDefaults();
  await ensureAdmin();

  app.listen(config.port, () => {
    console.log(`[Server] Running on http://localhost:${config.port}`);
    console.log(`[Server] Environment: ${config.nodeEnv}`);
    if (!config.geminiApiKey) {
      console.warn('[Server] ⚠️  GEMINI_API_KEY is not set — discussions will fail');
    }
  });
}

bootstrap().catch(console.error);
