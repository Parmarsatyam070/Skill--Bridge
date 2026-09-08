import { Router, Response } from 'express';
import { prisma } from '../config/prisma.js';
import { authenticate, AuthRequest } from '../middleware/auth.js';
import { ApplyInternshipSchema } from '../../../shared/validation.js';
import { calculateSingleMatch } from '../services/matchingEngine.js';
import { ApplicationStatus } from '../../../shared/types.js';

const router = Router();

const VALID_STATUSES: ApplicationStatus[] = [
  'applied',
  'under_review',
  'shortlisted',
  'interview',
  'hired',
  'rejected',
];

/**
 * Helper to safely parse JSON strings
 */
function parseJsonSafe<T>(jsonStr: string | null | undefined): T | null {
  if (!jsonStr) return null;
  try {
    return JSON.parse(jsonStr) as T;
  } catch {
    return null;
  }
}

/**
 * POST /api/applications/apply
 * Applies to an internship with resume selection and snapshotting matchScoreAtApply
 */
router.post('/apply', authenticate, async (req: AuthRequest, res: Response) => {
  const parseResult = ApplyInternshipSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({
      error: { code: 'VALIDATION_ERROR', message: parseResult.error.errors[0]?.message },
    });
  }

  const { internshipId, resumeId, coverNote } = parseResult.data;
  const studentProfileId = req.user?.studentProfileId;

  if (!studentProfileId) {
    return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Only students can apply to internships.' } });
  }

  // Check if already applied
  const existing = await prisma.application.findFirst({
    where: { studentId: studentProfileId, internshipId },
  });

  if (existing) {
    return res.status(409).json({ error: { code: 'ALREADY_APPLIED', message: 'You have already applied for this internship.' } });
  }

  // Calculate authoritative 3-pillar match score snapshot at moment of apply
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
        include: { industry: true },
      },
    },
  });

  return res.status(201).json({
    message: 'Application submitted successfully!',
    application: {
      id: application.id,
      internshipTitle: application.internship?.title || 'Application',
      companyName: application.internship?.industry?.companyName || 'Company',
      status: application.status,
      matchScoreAtApply: application.matchScoreAtApply,
      appliedAt: application.appliedAt,
    },
  });
});

/**
 * GET /api/applications/student/:id
 * Fetches applications for a student with live 3-pillar match scores and interview/hired details
 */
router.get('/student/:id', authenticate, async (req: AuthRequest, res: Response) => {
  const studentId = req.params.id;

  const applications = await prisma.application.findMany({
    where: { studentId },
    include: {
      internship: {
        include: { industry: true },
      },
      resume: true,
    },
    orderBy: { appliedAt: 'desc' },
  });

  const formatted = await Promise.all(
    applications.map(async a => {
      const currentMatch = a.internshipId ? await calculateSingleMatch(studentId, a.internshipId) : null;
      return {
        id: a.id,
        internshipId: a.internshipId,
        internshipTitle: a.internship?.title || 'Application',
        companyName: a.internship?.industry?.companyName || 'Company',
        location: a.internship?.location || 'Remote',
        workMode: a.internship?.workMode || 'REMOTE',
        stipend: a.internship?.stipend || 'N/A',
        status: a.status as ApplicationStatus,
        matchScoreAtApply: a.matchScoreAtApply,
        currentMatchScore: currentMatch ? currentMatch.overallScore : a.matchScoreAtApply,
        matchTier: currentMatch ? currentMatch.tier : 'medium',
        resumeTitle: a.resume?.title,
        coverNote: a.coverNote,
        interviewDetails: parseJsonSafe(a.interviewDetailsJson),
        hiredDetails: parseJsonSafe(a.hiredDetailsJson),
        appliedAt: a.appliedAt,
      };
    })
  );

  return res.json({ applications: formatted });
});

/**
 * Status update handler logic shared between PUT /:id/status and PATCH /:id
 */
async function handleStatusUpdate(req: AuthRequest, res: Response) {
  const { status, interviewDetails, hiredDetails } = req.body;

  if (!status || !VALID_STATUSES.includes(status)) {
    return res.status(400).json({
      error: {
        code: 'BAD_REQUEST',
        message: `Invalid application status. Allowed: ${VALID_STATUSES.join(', ')}`,
      },
    });
  }

  // Validate status-specific required data
  if (status === 'interview') {
    if (!interviewDetails) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Interview details must be provided when setting status to interview.',
        },
      });
    }
    if (!interviewDetails.interviewDate || !interviewDetails.interviewTime) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'interviewDate and interviewTime are required for interview scheduling.',
        },
      });
    }
  }

  if (status === 'hired') {
    if (!hiredDetails || !hiredDetails.offerDate) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Offer date (offerDate) is required when marking a candidate as hired.',
        },
      });
    }
  }

  // Verify application exists
  const existingApp = await prisma.application.findUnique({
    where: { id: req.params.id },
    include: {
      student: { include: { user: true } },
      internship: { include: { industry: true } },
    },
  });

  if (!existingApp) {
    return res.status(404).json({
      error: { code: 'NOT_FOUND', message: 'Application not found.' },
    });
  }

  // Prepare update payload
  const updateData: any = { status };

  if (status === 'interview' && interviewDetails) {
    updateData.interviewDetailsJson = JSON.stringify({
      ...interviewDetails,
      scheduledAt: new Date().toISOString(),
    });
  }

  if (status === 'hired' && hiredDetails) {
    updateData.hiredDetailsJson = JSON.stringify({
      ...hiredDetails,
      hiredAt: new Date().toISOString(),
    });
  }

  const updated = await prisma.application.update({
    where: { id: req.params.id },
    data: updateData,
    include: {
      internship: { include: { industry: true } },
      resume: true,
    },
  });

  // Calculate live match for response
  const liveMatch = updated.internshipId ? await calculateSingleMatch(updated.studentId, updated.internshipId) : null;

  return res.json({
    message: `Application status updated to ${status}`,
    application: {
      id: updated.id,
      studentId: updated.studentId,
      internshipId: updated.internshipId,
      internshipTitle: updated.internship?.title || 'Application',
      companyName: updated.internship?.industry?.companyName || 'Company',
      status: updated.status as ApplicationStatus,
      matchScoreAtApply: updated.matchScoreAtApply,
      currentMatchScore: liveMatch ? liveMatch.overallScore : updated.matchScoreAtApply,
      matchTier: liveMatch ? liveMatch.tier : 'medium',
      coverNote: updated.coverNote,
      interviewDetails: parseJsonSafe(updated.interviewDetailsJson),
      hiredDetails: parseJsonSafe(updated.hiredDetailsJson),
      appliedAt: updated.appliedAt,
    },
  });
}

/**
 * PUT /api/applications/:id/status
 */
router.put('/:id/status', authenticate, handleStatusUpdate);

/**
 * PATCH /api/applications/:id
 */
router.patch('/:id', authenticate, handleStatusUpdate);

export default router;
