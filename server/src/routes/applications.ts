import { Router, Response } from 'express';
import { prisma } from '../config/prisma.js';
import { authenticate, AuthRequest } from '../middleware/auth.js';
import { ApplyInternshipSchema } from '../../../shared/validation.js';
import { calculateSingleMatch } from '../services/matchingEngine.js';
import { ApplicationStatus } from '../../../shared/types.js';
import {
  transitionApplicationStatus,
  getApplicationTimeline,
  calculateStageDuration,
  normalizeStatus,
} from '../services/applicationLifecycleService.js';

const router = Router();

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
 * Applies to an internship with resume selection, match score snapshot, and initial history record.
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

  const application = await prisma.$transaction(async tx => {
    const app = await tx.application.create({
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

    // Create initial history record
    await tx.applicationHistory.create({
      data: {
        applicationId: app.id,
        fromStatus: 'INITIAL',
        toStatus: 'APPLIED',
        changedByUserId: req.user!.id,
        changedByRole: req.user!.role,
        notes: coverNote ? `Cover Note: ${coverNote}` : 'Application submitted.',
      },
    });

    return app;
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
 * Fetches applications for a student with both Opportunities & Internships,
 * stage duration, neutral bottleneck delay flags, and timeline details.
 * Security: Accessible only by the student themselves, their Institution Admin, or an Admin.
 */
router.get('/student/:id', authenticate, async (req: AuthRequest, res: Response) => {
  const targetStudentId = req.params.id;
  const user = req.user;

  if (!user) {
    return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Authentication required.' } });
  }

  // Authorization check
  let isAuthorized = false;
  if (user.role === 'ADMIN') {
    isAuthorized = true;
  } else if (user.role === 'STUDENT' && user.studentProfileId === targetStudentId) {
    isAuthorized = true;
  } else if (user.role === 'INSTITUTION_ADMIN' && user.institutionProfileId) {
    // Check if student belongs to this institution
    const instProfile = await prisma.institutionProfile.findUnique({
      where: { id: user.institutionProfileId },
    });
    if (instProfile) {
      const student = await prisma.studentProfile.findUnique({
        where: { id: targetStudentId },
        select: { institution: true, institutionProfileId: true },
      });
      if (
        student &&
        (student.institutionProfileId === instProfile.id ||
          (!student.institutionProfileId &&
            student.institution.toLowerCase() === instProfile.institutionName.toLowerCase()))
      ) {
        isAuthorized = true;
      }
    }
  }

  if (!isAuthorized) {
    return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Access denied to this student applications portfolio.' } });
  }

  const applications = await prisma.application.findMany({
    where: { studentId: targetStudentId },
    include: {
      internship: {
        include: { industry: true },
      },
      opportunity: {
        include: { company: true },
      },
      resume: true,
      history: {
        orderBy: { createdAt: 'desc' },
      },
    },
    orderBy: { appliedAt: 'desc' },
  });

  const formatted = await Promise.all(
    applications.map(async a => {
      const currentMatch = a.internshipId ? await calculateSingleMatch(targetStudentId, a.internshipId) : null;
      const { daysInCurrentStage, isStageDelayed, delayThresholdDays } = calculateStageDuration(a);

      const title = a.opportunity?.title || a.internship?.title || 'Application';
      const companyName = a.opportunity?.company?.companyName || a.internship?.industry?.companyName || 'Company';
      const location = a.opportunity?.location || a.internship?.location || 'Remote';
      const workMode = a.opportunity?.workMode || a.internship?.workMode || 'REMOTE';
      const stipend = a.opportunity?.stipend || a.internship?.stipend || 'Competitive';
      const normStatus = normalizeStatus(a.status);

      return {
        id: a.id,
        internshipId: a.internshipId,
        opportunityId: a.opportunityId,
        internshipTitle: title,
        opportunityTitle: title,
        companyName,
        location,
        workMode,
        stipend,
        status: a.status as ApplicationStatus,
        canonicalStatus: normStatus,
        matchScoreAtApply: a.matchScoreAtApply,
        currentMatchScore: currentMatch ? currentMatch.overallScore : a.matchScoreAtApply,
        matchTier: currentMatch ? currentMatch.tier : a.matchScoreAtApply >= 80 ? 'high' : a.matchScoreAtApply >= 50 ? 'medium' : 'low',
        resumeTitle: a.resume?.title,
        coverNote: a.coverNote,
        interviewDetails: parseJsonSafe(a.interviewDetailsJson),
        hiredDetails: parseJsonSafe(a.hiredDetailsJson),
        appliedAt: a.appliedAt,
        updatedAt: a.updatedAt,
        daysInCurrentStage,
        isStageDelayed,
        delayThresholdDays,
        historyCount: a.history.length,
      };
    })
  );

  return res.json({ applications: formatted });
});

/**
 * GET /api/applications/:id
 * Fetches full details and timeline of a single application.
 * Authorized for the candidate, the hiring recruiter, or the affiliated institution admin.
 */
router.get('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  const applicationId = req.params.id;
  const user = req.user;

  if (!user) {
    return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Authentication required.' } });
  }

  const app = await prisma.application.findUnique({
    where: { id: applicationId },
    include: {
      student: {
        include: {
          user: { select: { id: true, name: true, email: true, avatarUrl: true } },
        },
      },
      opportunity: {
        include: {
          company: { select: { id: true, companyName: true, website: true, industrySector: true } },
          skills: { include: { skill: { select: { name: true } } } },
        },
      },
      internship: {
        include: {
          industry: { select: { id: true, companyName: true, website: true, industrySector: true } },
        },
      },
      resume: true,
      history: {
        orderBy: { createdAt: 'asc' },
      },
    },
  });

  if (!app) {
    return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Application not found.' } });
  }

  // Authorization check
  let authorized = false;
  if (user.role === 'ADMIN') {
    authorized = true;
  } else if (user.role === 'STUDENT' && user.studentProfileId === app.studentId) {
    authorized = true;
  } else if (user.role === 'INDUSTRY') {
    const oppComp = app.opportunity?.companyId;
    const internComp = app.internship?.industryId;
    if (user.industryProfileId && (user.industryProfileId === oppComp || user.industryProfileId === internComp)) {
      authorized = true;
    }
  } else if (user.role === 'INSTITUTION_ADMIN' && user.institutionProfileId) {
    const inst = await prisma.institutionProfile.findUnique({ where: { id: user.institutionProfileId } });
    if (inst) {
      if (
        app.student.institutionProfileId === inst.id ||
        (!app.student.institutionProfileId &&
          app.student.institution.toLowerCase() === inst.institutionName.toLowerCase())
      ) {
        authorized = true;
      }
    }
  }

  if (!authorized) {
    return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'You are not authorized to view this application.' } });
  }

  const timelineData = await getApplicationTimeline(applicationId);
  const { daysInCurrentStage, isStageDelayed, delayThresholdDays } = calculateStageDuration(app);

  const title = app.opportunity?.title || app.internship?.title || 'Application';
  const comp = app.opportunity?.company || app.internship?.industry;

  return res.json({
    application: {
      id: app.id,
      studentId: app.studentId,
      studentName: app.student?.user?.name,
      studentEmail: app.student?.user?.email,
      avatarUrl: app.student?.user?.avatarUrl,
      department: app.student?.targetDomain || 'General',
      gradYear: app.student?.gradYear,
      cgpa: app.student?.cgpa,
      companyId: comp?.id,
      companyName: comp?.companyName || 'Company',
      companyWebsite: comp?.website,
      opportunityId: app.opportunityId || app.internshipId,
      opportunityTitle: title,
      status: app.status,
      canonicalStatus: normalizeStatus(app.status),
      matchScoreAtApply: app.matchScoreAtApply,
      coverNote: app.coverNote,
      resume: app.resume
        ? {
            id: app.resume.id,
            title: app.resume.title,
            fileUrl: app.resume.fileUrl,
          }
        : null,
      interviewDetails: parseJsonSafe(app.interviewDetailsJson),
      hiredDetails: parseJsonSafe(app.hiredDetailsJson),
      appliedAt: app.appliedAt,
      updatedAt: app.updatedAt,
      daysInCurrentStage,
      isStageDelayed,
      delayThresholdDays,
      timeline: timelineData.timeline,
    },
  });
});

/**
 * GET /api/applications/:id/timeline
 * Fetches the event timeline for an application.
 */
router.get('/:id/timeline', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const timeline = await getApplicationTimeline(req.params.id);
    return res.json(timeline);
  } catch (err: any) {
    return res.status(err.message === 'Application not found.' ? 404 : 500).json({
      error: { code: 'TIMELINE_ERROR', message: err.message },
    });
  }
});

/**
 * Status update handler shared between PUT /:id/status and PATCH /:id
 * Validates backend state transition rules and server-side actor ownership.
 */
async function handleStatusUpdate(req: AuthRequest, res: Response) {
  try {
    const { status, notes, interviewDetails, hiredDetails } = req.body;

    if (!status) {
      return res.status(400).json({
        error: { code: 'BAD_REQUEST', message: 'New status is required.' },
      });
    }

    const user = req.user!;
    const result = await transitionApplicationStatus({
      applicationId: req.params.id,
      toStatus: status,
      user: {
        id: user.id,
        role: user.role,
        name: (user as any).name || user.email,
        studentProfileId: user.studentProfileId,
        industryProfileId: user.industryProfileId,
      },
      notes,
      interviewDetails,
      hiredDetails,
    });

    const timeline = await getApplicationTimeline(req.params.id);

    return res.json({
      message: `Application stage transitioned to ${result.updatedApp.status}`,
      application: {
        id: result.updatedApp.id,
        status: result.updatedApp.status,
        canonicalStatus: normalizeStatus(result.updatedApp.status),
        updatedAt: result.updatedApp.updatedAt,
      },
      timeline: timeline.timeline,
    });
  } catch (err: any) {
    const statusCode = err.message.startsWith('Forbidden') ? 403 : err.message === 'Application not found.' ? 404 : 400;
    return res.status(statusCode).json({
      error: { code: 'STATUS_UPDATE_ERROR', message: err.message },
    });
  }
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
