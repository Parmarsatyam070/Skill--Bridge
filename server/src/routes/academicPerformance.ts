import { Router, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { prisma } from '../config/prisma.js';
import { authenticate, AuthRequest } from '../middleware/auth.js';
import {
  extractMarksheetData,
  normalizeSubjectName,
  classifySubjectForStudent,
  runFullAcademicAnalysis,
  getPracticeSubjectsAndTopics,
  getPracticeQuestionsByTopic,
  gradePracticeSubmission,
  isAiMarksheetExtractionConfigured,
  getDemoDatasetStats,
  getDemoStudentsList,
  getDemoStudentDetails,
  runDemoStudentAcademicAnalysis,
} from '../services/academicPerformanceService.js';
import { resolveGeminiModel } from '../services/llmService.js';
import {
  UpdateMarksheetSubjectsSchema,
  SubmitPracticeAnswersSchema,
} from '../../../shared/validation.js';

const router = Router();

/* ─── DEMO DATASET ENDPOINTS ──────────────────────────────────────────────── */

/**
 * GET /api/academic-performance/demo/stats
 * Dynamic aggregate statistics of the 150-record demo dataset
 */
router.get('/demo/stats', authenticate, async (_req: AuthRequest, res: Response) => {
  try {
    const stats = await getDemoDatasetStats();
    return res.json({ success: true, stats });
  } catch (err: any) {
    return res.status(500).json({ error: { code: 'FETCH_FAILED', message: err.message } });
  }
});

/**
 * GET /api/academic-performance/demo/students
 * List demo students with search and filters (branch, domain, category)
 */
router.get('/demo/students', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const search = req.query.search as string | undefined;
    const branch = req.query.branch as string | undefined;
    const domain = req.query.domain as string | undefined;
    const skillCategory = req.query.skillCategory as string | undefined;

    const students = await getDemoStudentsList({ search, branch, domain, skillCategory });
    return res.json({ success: true, students, totalStudents: students.length });
  } catch (err: any) {
    return res.status(500).json({ error: { code: 'FETCH_FAILED', message: err.message } });
  }
});

/**
 * GET /api/academic-performance/demo/students/:studentId
 * Get raw skill records for a specific demo student
 */
router.get('/demo/students/:studentId', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const studentId = req.params.studentId;
    const student = await getDemoStudentDetails(studentId);
    if (!student) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: `Demo student '${studentId}' not found.` } });
    }
    return res.json({ success: true, student });
  } catch (err: any) {
    return res.status(500).json({ error: { code: 'FETCH_FAILED', message: err.message } });
  }
});

/**
 * GET /api/academic-performance/demo/students/:studentId/analysis
 * Run full academic analysis engine for a demo student using normalized dataset records
 */
router.get('/demo/students/:studentId/analysis', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const studentId = req.params.studentId;
    const analysis = await runDemoStudentAcademicAnalysis(studentId);
    return res.json({
      success: true,
      message: `Demo academic analysis for ${analysis.demoStudentName} (${analysis.externalStudentId}) generated successfully.`,
      analysis,
    });
  } catch (err: any) {
    return res.status(500).json({ error: { code: 'ANALYSIS_FAILED', message: err.message } });
  }
});


// Configure private local file upload storage for marksheets
// NOTE: This directory is NOT served via express.static to ensure total privacy
const marksheetsDir = path.join(process.cwd(), 'uploads', 'marksheets');
if (!fs.existsSync(marksheetsDir)) {
  fs.mkdirSync(marksheetsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, marksheetsDir),
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, 'marksheet-' + uniqueSuffix + path.extname(file.originalname).toLowerCase());
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (_req, file, cb) => {
    const allowed = ['.pdf', '.jpg', '.jpeg', '.png'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF, JPG, JPEG, and PNG files up to 10MB are supported.'));
    }
  },
});

/**
 * Helper to ensure student profile exists for the authenticated user
 */
async function getStudentProfileOrReject(req: AuthRequest, res: Response) {
  const userId = req.user?.id;
  if (!userId) {
    res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Authentication required' } });
    return null;
  }

  let student = await prisma.studentProfile.findUnique({
    where: { userId },
  });

  if (!student) {
    // If user has STUDENT role but profile record is not yet initialized
    if (req.user?.role === 'STUDENT') {
      student = await prisma.studentProfile.create({
        data: {
          userId,
          institution: 'SkillBridge University',
          targetDomain: 'Full-Stack Web',
        },
      });
    } else {
      res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Student profile access required' } });
      return null;
    }
  }

  return student;
}

/**
 * POST /api/academic-performance/marksheets/upload
 * Upload semester marksheet, trigger OCR/extraction, store draft records
 */
router.post('/marksheets/upload', authenticate, upload.single('file'), async (req: AuthRequest, res: Response) => {
  try {
    const student = await getStudentProfileOrReject(req, res);
    if (!student) return;

    if (!req.file) {
      return res.status(400).json({ error: { code: 'FILE_REQUIRED', message: 'Please select a marksheet file to upload (PDF, JPG, PNG)' } });
    }

    const semester = parseInt(req.body.semester, 10) || 1;
    const academicYear = req.body.academicYear?.trim() || `${new Date().getFullYear() - 1}-${new Date().getFullYear()}`;

    const studentContext = {
      targetDomain: student.targetDomain,
      degree: (student as any).degree || 'B.Tech',
      branch: (student as any).branch || 'Computer Science and Engineering',
    };

    // Extract marksheet subjects & grades
    const extraction = await extractMarksheetData(
      req.file.path,
      req.file.mimetype,
      semester,
      academicYear,
      studentContext
    );

    // Check if a marksheet already exists for this student and semester
    const existing = await prisma.uploadedMarksheet.findUnique({
      where: {
        studentProfileId_semester: {
          studentProfileId: student.id,
          semester,
        },
      },
    });

    let marksheet;
    if (existing) {
      // Delete old file if present
      if (fs.existsSync(existing.filePath)) {
        try { fs.unlinkSync(existing.filePath); } catch {}
      }
      // Delete previous subjects
      await prisma.marksheetSubject.deleteMany({
        where: { marksheetId: existing.id },
      });

      marksheet = await prisma.uploadedMarksheet.update({
        where: { id: existing.id },
        data: {
          fileName: req.file.originalname,
          filePath: req.file.path,
          fileType: req.file.mimetype,
          fileSize: req.file.size,
          academicYear,
          status: 'DRAFT',
          sgpa: extraction.sgpa,
          totalCredits: extraction.totalCredits,
          extractionNotes: extraction.extractionNotes,
          subjects: {
            create: extraction.subjects.map(s => ({
              subjectCode: s.subjectCode,
              subjectName: s.subjectName,
              normalizedSubject: s.normalizedSubject,
              marksObtained: s.marksObtained,
              maxMarks: s.maxMarks || 100,
              percentage: s.percentage,
              grade: s.grade,
              credits: s.credits,
              classification: s.classification,
              isBacklog: s.isBacklog,
              isPassed: s.isPassed,
            })),
          },
        },
        include: { subjects: true },
      });
    } else {
      marksheet = await prisma.uploadedMarksheet.create({
        data: {
          studentProfileId: student.id,
          semester,
          academicYear,
          fileName: req.file.originalname,
          filePath: req.file.path,
          fileType: req.file.mimetype,
          fileSize: req.file.size,
          status: 'DRAFT',
          sgpa: extraction.sgpa,
          totalCredits: extraction.totalCredits,
          extractionNotes: extraction.extractionNotes,
          subjects: {
            create: extraction.subjects.map(s => ({
              subjectCode: s.subjectCode,
              subjectName: s.subjectName,
              normalizedSubject: s.normalizedSubject,
              marksObtained: s.marksObtained,
              maxMarks: s.maxMarks || 100,
              percentage: s.percentage,
              grade: s.grade,
              credits: s.credits,
              classification: s.classification,
              isBacklog: s.isBacklog,
              isPassed: s.isPassed,
            })),
          },
        },
        include: { subjects: true },
      });
    }

    return res.status(201).json({
      success: true,
      message: `Marksheet for Semester ${semester} extracted successfully. Please review and verify the academic data.`,
      marksheet,
    });
  } catch (err: any) {
    console.error('[AcademicPerformance] Upload error:', err);
    return res.status(500).json({ error: { code: 'UPLOAD_FAILED', message: err.message || 'Failed to process marksheet' } });
  }
});

/**
 * GET /api/academic-performance/provider-status
 * Safe check of marksheet extraction AI provider status (no API keys exposed)
 */
router.get('/provider-status', authenticate, async (_req: AuthRequest, res: Response) => {
  const isConfigured = isAiMarksheetExtractionConfigured();
  return res.json({
    isAiConfigured: isConfigured,
    provider: isConfigured ? 'Google Gemini Multimodal Vision' : 'Structured Fallback Heuristic Engine',
    model: isConfigured ? resolveGeminiModel(process.env.GEMINI_MODEL) : null,
    statusMessage: isConfigured
      ? 'AI-powered multimodal marksheet extraction is active.'
      : 'AI extraction provider is not configured; structured fallback extraction is being used.',
  });
});

/**
 * GET /api/academic-performance/marksheets
 * List all uploaded marksheets for the authenticated student
 */
router.get('/marksheets', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const student = await getStudentProfileOrReject(req, res);
    if (!student) return;

    const marksheets = await prisma.uploadedMarksheet.findMany({
      where: { studentProfileId: student.id },
      include: {
        subjects: {
          orderBy: { subjectName: 'asc' },
        },
      },
      orderBy: { semester: 'asc' },
    });

    return res.json({ marksheets });
  } catch (err: any) {
    return res.status(500).json({ error: { code: 'FETCH_FAILED', message: err.message } });
  }
});

/**
 * GET /api/academic-performance/marksheets/:id
 * Retrieve a specific marksheet
 */
router.get('/marksheets/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const student = await getStudentProfileOrReject(req, res);
    if (!student) return;

    const marksheet = await prisma.uploadedMarksheet.findFirst({
      where: {
        id: req.params.id,
        studentProfileId: student.id,
      },
      include: { subjects: true },
    });

    if (!marksheet) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Marksheet not found' } });
    }

    return res.json({ marksheet });
  } catch (err: any) {
    return res.status(500).json({ error: { code: 'FETCH_FAILED', message: err.message } });
  }
});

/**
 * PUT /api/academic-performance/marksheets/:id/subjects
 * Step 6: Validate, edit, and confirm extracted subject data.
 * Marks the marksheet status as VERIFIED without running complete analysis.
 */
router.put('/marksheets/:id/subjects', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const student = await getStudentProfileOrReject(req, res);
    if (!student) return;

    const parsed = UpdateMarksheetSubjectsSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid marksheet subjects payload',
          details: parsed.error.issues,
        },
      });
    }

    const { subjects, sgpa, totalCredits, academicYear, semester } = parsed.data;

    // Verify marksheet ownership
    const marksheet = await prisma.uploadedMarksheet.findFirst({
      where: {
        id: req.params.id,
        studentProfileId: student.id,
      },
    });

    if (!marksheet) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Marksheet not found' } });
    }

    const studentContext = {
      targetDomain: student.targetDomain,
      degree: (student as any).degree || 'B.Tech',
      branch: (student as any).branch || 'Computer Science and Engineering',
    };

    // Delete existing subjects and recreate verified records
    await prisma.marksheetSubject.deleteMany({
      where: { marksheetId: marksheet.id },
    });

    const updatedMarksheet = await prisma.uploadedMarksheet.update({
      where: { id: marksheet.id },
      data: {
        status: 'VERIFIED',
        sgpa: sgpa !== undefined ? sgpa : marksheet.sgpa,
        totalCredits: totalCredits !== undefined ? totalCredits : marksheet.totalCredits,
        academicYear: academicYear || marksheet.academicYear,
        semester: semester || marksheet.semester,
        subjects: {
          create: subjects.map(s => {
            const normalized = s.normalizedSubject?.trim() || normalizeSubjectName(s.subjectName).normalized;
            const classification = s.classification || classifySubjectForStudent(normalized, studentContext);
            const isBacklog = s.isBacklog ?? (s.percentage < 40 || s.grade === 'F');

            return {
              subjectCode: s.subjectCode || null,
              subjectName: s.subjectName.trim(),
              normalizedSubject: normalized,
              marksObtained: s.marksObtained ?? null,
              maxMarks: s.maxMarks ?? 100,
              percentage: s.percentage,
              grade: s.grade || (s.percentage >= 85 ? 'A+' : s.percentage >= 75 ? 'A' : s.percentage >= 60 ? 'B' : s.percentage >= 40 ? 'C' : 'F'),
              credits: s.credits ?? 3,
              classification,
              isBacklog,
              isPassed: !isBacklog,
            };
          }),
        },
      },
      include: { subjects: true },
    });

    return res.json({
      success: true,
      message: 'Academic data verified successfully.',
      marksheet: updatedMarksheet,
    });
  } catch (err: any) {
    console.error('[AcademicPerformance] Subject update error:', err);
    return res.status(500).json({ error: { code: 'UPDATE_FAILED', message: err.message } });
  }
});

/**
 * DELETE /api/academic-performance/marksheets/:id
 * Delete a marksheet and recalculate performance
 */
router.delete('/marksheets/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const student = await getStudentProfileOrReject(req, res);
    if (!student) return;

    const marksheet = await prisma.uploadedMarksheet.findFirst({
      where: {
        id: req.params.id,
        studentProfileId: student.id,
      },
    });

    if (!marksheet) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Marksheet not found' } });
    }

    // Delete file from disk
    if (fs.existsSync(marksheet.filePath)) {
      try { fs.unlinkSync(marksheet.filePath); } catch {}
    }

    // Delete records from database
    await prisma.marksheetSubject.deleteMany({ where: { marksheetId: marksheet.id } });
    await prisma.uploadedMarksheet.delete({ where: { id: marksheet.id } });

    // Re-run analysis
    const analysis = await runFullAcademicAnalysis(student.id);

    return res.json({
      success: true,
      message: 'Marksheet deleted successfully.',
      analysis,
    });
  } catch (err: any) {
    return res.status(500).json({ error: { code: 'DELETE_FAILED', message: err.message } });
  }
});

/**
 * GET /api/academic-performance/analysis
 * Get latest comprehensive academic analysis
 */
router.get('/analysis', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const student = await getStudentProfileOrReject(req, res);
    if (!student) return;

    const analysis = await runFullAcademicAnalysis(student.id);
    return res.json({ analysis });
  } catch (err: any) {
    return res.status(500).json({ error: { code: 'ANALYSIS_FAILED', message: err.message } });
  }
});

/**
 * POST /api/academic-performance/analyze
 * Step 7: Explicitly run domain-aware academic analysis engine
 */
router.post('/analyze', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const student = await getStudentProfileOrReject(req, res);
    if (!student) return;

    const analysis = await runFullAcademicAnalysis(student.id);
    return res.json({
      success: true,
      message: 'Academic analysis completed.',
      analysis,
    });
  } catch (err: any) {
    return res.status(500).json({ error: { code: 'ANALYSIS_FAILED', message: err.message } });
  }
});

/**
 * GET /api/academic-performance/practice/subjects
 * List available practice subjects and topic categories
 */
router.get('/practice/subjects', authenticate, async (_req: AuthRequest, res: Response) => {
  try {
    const subjects = getPracticeSubjectsAndTopics();
    return res.json({ subjects });
  } catch (err: any) {
    return res.status(500).json({ error: { code: 'FETCH_FAILED', message: err.message } });
  }
});

/**
 * GET /api/academic-performance/practice/questions
 * Get practice questions for a specific weak subject and topic
 */
router.get('/practice/questions', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const subject = req.query.subject as string;
    const topic = req.query.topic as string | undefined;

    if (!subject) {
      return res.status(400).json({ error: { code: 'SUBJECT_REQUIRED', message: 'Subject query parameter is required' } });
    }

    const rawQuestions = getPracticeQuestionsByTopic(subject, topic);

    // Sanitize correct answers for initial test view
    const clientQuestions = rawQuestions.map(q => ({
      id: q.id,
      subject: q.subject,
      topic: q.topic,
      type: q.type,
      difficulty: q.difficulty,
      question: q.question,
      options: q.options,
      hint: q.hint,
    }));

    return res.json({
      subject,
      topic: topic || 'All Topics',
      totalQuestions: clientQuestions.length,
      questions: clientQuestions,
    });
  } catch (err: any) {
    return res.status(500).json({ error: { code: 'FETCH_FAILED', message: err.message } });
  }
});

/**
 * POST /api/academic-performance/practice/submit
 * Submit answers for a practice set, compute score, and record attempt
 */
router.post('/practice/submit', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const student = await getStudentProfileOrReject(req, res);
    if (!student) return;

    const parsed = SubmitPracticeAnswersSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid practice submission payload',
          details: parsed.error.issues,
        },
      });
    }

    const { subject, topic, answers } = parsed.data;
    const result = await gradePracticeSubmission(student.id, subject, topic, answers);

    return res.json({
      success: true,
      message: `Practice set evaluated. Score: ${result.score}/${result.totalQuestions} (${result.percentage}%).`,
      result,
    });
  } catch (err: any) {
    return res.status(500).json({ error: { code: 'SUBMIT_FAILED', message: err.message } });
  }
});

/**
 * GET /api/academic-performance/marksheets/:id/file
 * Securely stream marksheet file to authorized student owner only
 */
router.get('/marksheets/:id/file', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const student = await getStudentProfileOrReject(req, res);
    if (!student) return;

    const marksheet = await prisma.uploadedMarksheet.findFirst({
      where: {
        id: req.params.id,
        studentProfileId: student.id,
      },
    });

    if (!marksheet || !fs.existsSync(marksheet.filePath)) {
      return res.status(404).json({ error: { code: 'FILE_NOT_FOUND', message: 'Marksheet file not found' } });
    }

    res.setHeader('Content-Type', marksheet.fileType || 'application/octet-stream');
    res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(marksheet.fileName)}"`);
    return res.sendFile(path.resolve(marksheet.filePath));
  } catch (err: any) {
    return res.status(500).json({ error: { code: 'DOWNLOAD_FAILED', message: err.message } });
  }
});

export default router;
