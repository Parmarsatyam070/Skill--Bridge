import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

import authRoutes from './routes/auth.js';
import studentsRoutes from './routes/students.js';
import coursesRoutes from './routes/courses.js';
import internshipsRoutes from './routes/internships.js';
import applicationsRoutes from './routes/applications.js';
import resumesRoutes from './routes/resumes.js';
import academicRoutes from './routes/academic.js';
import institutionsRoutes from './routes/institutions.js';
import aiRoutes from './routes/ai.js';
import portfoliosRoutes from './routes/portfolios.js';
import assessmentsRoutes from './routes/assessments.js';
import resourcesRoutes from './routes/resources.js';
import notificationsRoutes from './routes/notifications.js';
import dsaRoutes from './routes/dsa.js';

const app = express();
const PORT = process.env.PORT || 5000;

// Trust reverse proxy (e.g. Render, Cloudflare) for accurate client IP and rate limiting
app.set('trust proxy', 1);

// Serve static frontend assets from client/dist and fallback dist
const clientDistPath = path.resolve(process.cwd(), 'client/dist');
const rootDistPath = path.resolve(process.cwd(), 'dist');

app.use('/assets', express.static(path.join(clientDistPath, 'assets'), {
  maxAge: '1y',
  immutable: true,
}));
app.use(express.static(clientDistPath));
app.use(express.static(rootDistPath));

// Middleware
app.use(cors({
  origin: (origin, callback) => {
    const allowedOrigins = [
      'http://localhost:3000',
      'http://127.0.0.1:3000',
      'http://localhost:5000',
      'http://127.0.0.1:5000',
    ];

    if (
      !origin ||
      allowedOrigins.includes(origin) ||
      (process.env.FRONTEND_URL && (process.env.FRONTEND_URL === origin || process.env.FRONTEND_URL.split(',').map(u => u.trim()).includes(origin))) ||
      (origin && (origin.endsWith('.onrender.com') || origin.endsWith('.vercel.app') || origin.includes('localhost') || origin.includes('127.0.0.1')))
    ) {
      callback(null, true);
    } else {
      callback(null, false);
    }
  },
  credentials: true,
}));
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static uploads
const uploadsDir = path.join(process.cwd(), 'uploads');
app.use('/uploads', express.static(uploadsDir));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/students', studentsRoutes);
app.use('/api/courses', coursesRoutes);
app.use('/api/internships', internshipsRoutes);
app.use('/api/applications', applicationsRoutes);
app.use('/api/resumes', resumesRoutes);
app.use('/api/academic-opportunities', academicRoutes);
app.use('/api/institutions', institutionsRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/portfolios', portfoliosRoutes);
app.use('/api/assessments', assessmentsRoutes);
app.use('/api/resources', resourcesRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/dsa', dsaRoutes);

// Health check endpoint
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'SkillBridge Backend API',
    timestamp: new Date().toISOString(),
  });
});

// SPA fallback for frontend client routing (e.g. /, /login, /dashboard)
app.get('*', (req: Request, res: Response, next: NextFunction) => {
  // Do not intercept API or uploads routes
  if (req.path.startsWith('/api') || req.path.startsWith('/uploads')) {
    return res.status(404).json({
      error: {
        code: 'NOT_FOUND',
        message: `API endpoint ${req.method} ${req.path} not found.`,
      },
    });
  }

  const clientIndexPath = path.join(clientDistPath, 'index.html');
  if (fs.existsSync(clientIndexPath)) {
    return res.sendFile(clientIndexPath);
  }

  const rootIndexPath = path.join(rootDistPath, 'index.html');
  if (fs.existsSync(rootIndexPath)) {
    return res.sendFile(rootIndexPath);
  }

  return next();
});

// Global Error Handler
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Unhandled server error:', err);
  const status = err.status || 500;
  res.status(status).json({
    error: {
      code: err.code || 'INTERNAL_SERVER_ERROR',
      message: err.message || 'An unexpected error occurred.',
    }
  });
});

import { prisma } from './config/prisma.js';
import { seedCatalog, seedDemoUsers } from './services/seedService.js';

/**
 * Startup Database Health Verification & Auto-Seed Safety Guard:
 * Validates that reference tables (Domain, PracticeSet, Course, Skill) are seeded.
 * If reference tables are missing and User.count() === 0, automatically seeds catalog.
 * If users already exist (User.count() > 0), strictly logs a warning without mutating data.
 */
async function verifyDatabaseHealth() {
  try {
    const [domainCount, skillCount, practiceSetCount, courseCount, questionCount, userCount] = await Promise.all([
      prisma.domain.count(),
      prisma.skill.count(),
      prisma.practiceSet.count(),
      prisma.course.count(),
      prisma.question.count(),
      prisma.user.count(),
    ]);

    console.log(`[DB HEALTH CHECK] Status:`);
    console.log(`  • Domains: ${domainCount} (Min: 5)`);
    console.log(`  • Skills: ${skillCount} (Min: 25)`);
    console.log(`  • Practice Sets: ${practiceSetCount} (Min: 8)`);
    console.log(`  • Courses: ${courseCount} (Min: 4)`);
    console.log(`  • Questions: ${questionCount} (Min: 20)`);
    console.log(`  • Users: ${userCount}`);

    if (domainCount < 5 || practiceSetCount < 8 || courseCount < 4 || questionCount < 20) {
      if (userCount === 0) {
        console.log(`\n🌱 [DB AUTO-SEED] Empty database detected (0 users, incomplete reference catalog). Automatically seeding core catalog...`);
        await seedCatalog(prisma);
        await seedDemoUsers(prisma);
        console.log(`✅ [DB AUTO-SEED] Startup initialization completed successfully.\n`);
      } else {
        console.warn(`\n⚠️ [DB HEALTH WARNING] Production database appears incompletely seeded or missing reference records!`);
        console.warn(`   Current row counts: Domains=${domainCount}/5, PracticeSets=${practiceSetCount}/8, Courses=${courseCount}/4, Questions=${questionCount}/20`);
        console.warn(`   ⚠️ [SAFETY GUARD] Auto-seed skipped because ${userCount} user record(s) already exist in database.`);
        console.warn(`   Action required: Run 'npm run db:seed' against DATABASE_URL if you wish to re-populate reference tables manually.\n`);
      }
    } else {
      console.log(`✅ [DB HEALTH CHECK] Core reference catalog is healthy and fully seeded.\n`);
    }
  } catch (err: any) {
    console.error('❌ [DB HEALTH CHECK] Error connecting to database on startup:', err.message);
  }
}

app.listen(PORT, async () => {
  console.log(`🚀 SkillBridge Backend API server running on http://localhost:${PORT}`);
  await verifyDatabaseHealth();
});

