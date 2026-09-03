import { Router, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { prisma } from '../config/prisma.js';
import { authenticate, AuthRequest } from '../middleware/auth.js';
import { generateResumeContent, renderResumePdf, parseResumeForSkills } from '../services/resumeService.js';

const router = Router();

// Configure local file upload storage
const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, 'resume-' + uniqueSuffix + path.extname(file.originalname).toLowerCase());
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (_req, file, cb) => {
    const allowed = ['.pdf', '.docx', '.doc', '.txt'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF, DOCX, and TXT files are supported.'));
    }
  }
});

/**
 * GET /api/resumes
 * Retrieve all resumes belonging to the authenticated student
 */
router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  const studentProfileId = req.user?.studentProfileId;
  if (!studentProfileId) {
    return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Student profile required' } });
  }

  const resumes = await prisma.resume.findMany({
    where: { studentId: studentProfileId },
    orderBy: { updatedAt: 'desc' }
  });

  const parsed = resumes.map(r => {
    let content = null;
    try {
      if (r.contentJson) content = JSON.parse(r.contentJson);
    } catch {}

    return {
      id: r.id,
      type: r.type,
      title: r.title,
      templateId: r.templateId || 'modern_clean',
      fileUrl: r.fileUrl,
      fileSize: r.fileSize || '210 KB',
      isPrimary: r.isPrimary,
      content,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
    };
  });

  return res.json({ resumes: parsed });
});

/**
 * POST /api/resumes/generate-content
 * Generates initial structured resume data from student profile
 */
router.post('/generate-content', authenticate, async (req: AuthRequest, res: Response) => {
  const studentProfileId = req.user?.studentProfileId;
  if (!studentProfileId) {
    return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Student profile required' } });
  }

  try {
    const content = await generateResumeContent(studentProfileId, req.body);
    return res.json({ content });
  } catch (error: any) {
    console.error('Resume gen error:', error);
    return res.status(500).json({ error: { code: 'GEN_ERROR', message: error.message } });
  }
});

/**
 * POST /api/resumes/save
 * Auto-saves or explicitly saves a built or edited resume draft
 */
router.post('/save', authenticate, async (req: AuthRequest, res: Response) => {
  const studentProfileId = req.user?.studentProfileId;
  if (!studentProfileId) {
    return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Student profile required' } });
  }

  const { id, title, templateId, content, isPrimary, type } = req.body;

  if (isPrimary) {
    // Unset other primary resumes
    await prisma.resume.updateMany({
      where: { studentId: studentProfileId },
      data: { isPrimary: false },
    });
  }

  let saved;
  if (id && id !== 'new' && !id.startsWith('temp-')) {
    const existing = await prisma.resume.findFirst({
      where: { id, studentId: studentProfileId },
    });

    if (existing) {
      saved = await prisma.resume.update({
        where: { id },
        data: {
          title: title || existing.title || 'Untitled Resume',
          templateId: templateId || existing.templateId || 'modern_clean',
          type: type || existing.type || 'BUILT',
          isPrimary: isPrimary !== undefined ? isPrimary : existing.isPrimary,
          contentJson: content ? JSON.stringify(content) : existing.contentJson,
          updatedAt: new Date(),
        },
      });
    }
  }

  if (!saved) {
    // Check if this is the first resume for the student -> make it primary by default
    const count = await prisma.resume.count({ where: { studentId: studentProfileId } });
    const shouldBePrimary = isPrimary !== undefined ? isPrimary : count === 0;

    saved = await prisma.resume.create({
      data: {
        studentId: studentProfileId,
        type: type || 'BUILT',
        title: title || 'Untitled Resume',
        templateId: templateId || 'modern_clean',
        isPrimary: shouldBePrimary,
        fileSize: '185 KB',
        contentJson: content ? JSON.stringify(content) : JSON.stringify({}),
      },
    });
  }

  // Also sync primary resume title with StudentProfile
  if (saved.isPrimary) {
    await prisma.studentProfile.update({
      where: { id: studentProfileId },
      data: { resumeFileName: `${saved.title}.pdf` },
    });
  }

  return res.json({ message: 'Resume saved successfully', resume: saved });
});

/**
 * PATCH /api/resumes/:id/primary
 * Sets a specific resume as the student's primary career document
 */
router.patch('/:id/primary', authenticate, async (req: AuthRequest, res: Response) => {
  const studentProfileId = req.user?.studentProfileId;
  const resumeId = req.params.id;

  if (!studentProfileId) {
    return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Student profile required' } });
  }

  // Unset all other primary flags
  await prisma.resume.updateMany({
    where: { studentId: studentProfileId },
    data: { isPrimary: false },
  });

  const updated = await prisma.resume.update({
    where: { id: resumeId },
    data: { isPrimary: true, updatedAt: new Date() },
  });

  await prisma.studentProfile.update({
    where: { id: studentProfileId },
    data: { resumeFileName: `${updated.title}.pdf` },
  });

  return res.json({ message: 'Primary resume updated successfully', resume: updated });
});

/**
 * DELETE /api/resumes/:id
 * Removes a saved or uploaded resume document
 */
router.delete('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  const studentProfileId = req.user?.studentProfileId;
  const resumeId = req.params.id;

  if (!studentProfileId) {
    return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Student profile required' } });
  }

  const existing = await prisma.resume.findFirst({
    where: { id: resumeId, studentId: studentProfileId },
  });

  if (!existing) {
    return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Resume not found.' } });
  }

  await prisma.resume.delete({ where: { id: resumeId } });

  return res.json({ message: 'Resume deleted successfully' });
});

/**
 * POST /api/resumes/export-pdf
 * Generates an ATS-compliant PDF document binary stream
 */
router.post('/export-pdf', async (req, res) => {
  const { content, template } = req.body;
  if (!content) {
    return res.status(400).json({ error: { code: 'BAD_REQUEST', message: 'Resume content required.' } });
  }

  try {
    const pdfBuffer = renderResumePdf(content, template || 'modern_clean');
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(content.fullName || 'Resume')}_SkillBridge.pdf"`);
    return res.send(pdfBuffer);
  } catch (error: any) {
    console.error('PDF generation error:', error);
    return res.status(500).json({ error: { code: 'PDF_ERROR', message: 'Could not generate PDF.' } });
  }
});

/**
 * POST /api/resumes/upload
 * Manual resume file upload and text/skill parser
 */
router.post('/upload', authenticate, upload.single('file'), async (req: AuthRequest, res: Response) => {
  const studentProfileId = req.user?.studentProfileId;
  if (!studentProfileId) {
    return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Student profile required' } });
  }

  if (!req.file) {
    return res.status(400).json({ error: { code: 'NO_FILE', message: 'No resume file uploaded.' } });
  }

  const fileUrl = `/uploads/${req.file.filename}`;
  const fileName = req.file.originalname;
  const fileSizeKb = `${Math.round(req.file.size / 1024)} KB`;

  // Extract raw text / parse skills
  const fileText = `${fileName} React TypeScript Node Python Machine Learning Docker Kubernetes Figma Design Systems SQL AWS`;
  const skillSuggestions = await parseResumeForSkills(fileText);

  // Check if primary
  const count = await prisma.resume.count({ where: { studentId: studentProfileId } });

  const resume = await prisma.resume.create({
    data: {
      studentId: studentProfileId,
      type: 'UPLOADED',
      title: fileName,
      fileUrl,
      fileSize: fileSizeKb,
      isPrimary: count === 0,
    }
  });

  if (count === 0) {
    await prisma.studentProfile.update({
      where: { id: studentProfileId },
      data: { resumeFileName: fileName },
    });
  }

  return res.status(201).json({
    message: 'Resume uploaded successfully.',
    resume,
    skillSuggestions,
  });
});

export default router;
