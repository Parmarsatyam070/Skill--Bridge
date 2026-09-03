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

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: (origin, callback) => {
    const allowedOrigins = [
      'http://localhost:3000',
      'http://127.0.0.1:3000',
    ];

    if (
      !origin ||
      allowedOrigins.includes(origin) ||
      process.env.FRONTEND_URL === origin ||
      (process.env.FRONTEND_URL && process.env.FRONTEND_URL.split(',').map(u => u.trim()).includes(origin))
    ) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
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

// Health check endpoint
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'SkillBridge Backend API',
    timestamp: new Date().toISOString(),
  });
});

// Serve frontend static build in production (from client/dist or fallback dist)
const clientDistPath = path.resolve(process.cwd(), 'client/dist');
const rootDistPath = path.resolve(process.cwd(), 'dist');
const staticDir = fs.existsSync(path.join(clientDistPath, 'index.html'))
  ? clientDistPath
  : rootDistPath;

if (fs.existsSync(staticDir)) {
  app.use(express.static(staticDir));
}

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

  const indexPath = path.join(staticDir, 'index.html');
  if (fs.existsSync(indexPath)) {
    return res.sendFile(indexPath);
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

app.listen(PORT, () => {
  console.log(`🚀 SkillBridge Backend API server running on http://localhost:${PORT}`);
});
