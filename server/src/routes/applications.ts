import { Router, Response } from 'express';
import { prisma } from '../config/prisma.js';
import { authenticate, AuthRequest } from '../middleware/auth.js';
import { ApplyInternshipSchema } from '../../../shared/validation.js';
import { calculateSingleMatch } from '../services/matchingEngine.js';

const router = Router();

/**
 * POST /api/students/:id/apply
 * Applies to an internship with resume selection and snapshotting matchScoreAtApply
 */
router.post('/apply', authenticate, async (req: AuthRequest, res: Response) => {
  const parseResult = ApplyInternshipSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({
      error: { code: 'VALIDATION_ERROR', message: parseResult.error.errors[0]?.message }
    });
  }

  const { internshipId, resumeId, coverNote } = parseResult.data;
  const studentProfileId = req.user?.studentProfileId;

  if (!studentProfileId) {
    return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Only students can apply to internships.' } });
  }

  // Check if already applied
  const existing = await prisma.application.findFirst({
    where: { studentId: studentProfileId, internshipId }
  });

  if (existing) {
    return res.status(409).json({ error: { code: 'ALREADY_APPLIED', message: 'You have already applied for this internship.' } });
  }

  // Calculate authoritative match score snapshot at moment of apply
  const matchBreakdown = await calculateSingleMatch(studentProfileId, internshipId);
  const matchScoreAtApply = matchBreakdown ? matchBreakdown.overallScore : 65;

  const application = await prisma.application.create({
    data: {
      studentId: studentProfileId,
      internshipId,
      resumeId: resumeId || null,
      coverNote: coverNote || '',
      matchScoreAtApply,
      status: 'applied',
    },
    include: {
      internship: {
        include: { industry: true }
      }
    }
  });

  return res.status(201).json({
    message: 'Application submitted successfully!',
    application: {
      id: application.id,
      internshipTitle: application.internship.title,
      companyName: application.internship.industry.companyName,
      status: application.status,
      matchScoreAtApply: application.matchScoreAtApply,
      appliedAt: application.appliedAt,
    }
  });
});

/**
 * GET /api/students/:id/applications
 */
router.get('/student/:id', authenticate, async (req: AuthRequest, res: Response) => {
  const studentId = req.params.id;

  const applications = await prisma.application.findMany({
    where: { studentId },
    include: {
      internship: {
        include: { industry: true }
      },
      resume: true,
    },
    orderBy: { appliedAt: 'desc' }
  });

  const formatted = await Promise.all(
    applications.map(async a => {
      const currentMatch = await calculateSingleMatch(studentId, a.internshipId);
      return {
        id: a.id,
        internshipId: a.internshipId,
        internshipTitle: a.internship.title,
        companyName: a.internship.industry.companyName,
        location: a.internship.location,
        workMode: a.internship.workMode,
        stipend: a.internship.stipend,
        status: a.status,
        matchScoreAtApply: a.matchScoreAtApply,
        currentMatchScore: currentMatch ? currentMatch.overallScore : a.matchScoreAtApply,
        matchTier: currentMatch ? currentMatch.tier : 'medium',
        resumeTitle: a.resume?.title,
        coverNote: a.coverNote,
        appliedAt: a.appliedAt,
      };
    })
  );

  return res.json({ applications: formatted });
});

/**
 * PUT /api/applications/:id/status
 * Updates status (applied -> under_review -> shortlisted -> rejected)
 */
router.put('/:id/status', authenticate, async (req: AuthRequest, res: Response) => {
  const { status } = req.body;
  if (!['applied', 'under_review', 'shortlisted', 'rejected'].includes(status)) {
    return res.status(400).json({ error: { code: 'BAD_REQUEST', message: 'Invalid application status.' } });
  }

  const updated = await prisma.application.update({
    where: { id: req.params.id },
    data: { status }
  });

  return res.json({ message: 'Application status updated', application: updated });
});

export default router;
