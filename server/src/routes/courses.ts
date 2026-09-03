import { Router, Response } from 'express';
import { prisma } from '../config/prisma.js';
import { authenticate, AuthRequest } from '../middleware/auth.js';
import { completeCourseEnrollment } from '../services/skillEngine.js';
import { SkillCovered } from '../../../shared/types.js';

const router = Router();

/**
 * GET /api/courses/providers
 */
router.get('/providers', async (req, res) => {
  const providers = await prisma.courseProvider.findMany({
    include: { _count: { select: { courses: true } } }
  });
  return res.json({ providers });
});

/**
 * GET /api/courses
 */
router.get('/', async (req, res) => {
  const studentProfileId = req.query.studentId as string;
  const providerId = req.query.providerId as string;
  const skillId = req.query.skillId as string;

  const courses = await prisma.course.findMany({
    where: {
      providerId: providerId || undefined,
    },
    include: {
      provider: true,
      enrollments: studentProfileId
        ? { where: { studentId: studentProfileId } }
        : false,
    },
    orderBy: { createdAt: 'desc' },
  });

  const allSkills = await prisma.skill.findMany();
  const skillMap = new Map(allSkills.map(s => [s.id, s.name]));

  const formatted = courses.map(c => {
    let skillsCovered: SkillCovered[] = [];
    try {
      skillsCovered = JSON.parse(c.skillsCoveredJson);
    } catch {}

    const enrichedSkills = skillsCovered.map(sc => ({
      skillId: sc.skillId,
      skillName: skillMap.get(sc.skillId) || 'Skill',
      pointsGain: sc.pointsGain,
    }));

    const enrollment = c.enrollments && c.enrollments.length > 0 ? c.enrollments[0] : null;

    return {
      id: c.id,
      providerId: c.providerId,
      provider: c.provider,
      title: c.title,
      description: c.description,
      skillsCovered: enrichedSkills,
      externalUrl: c.externalUrl,
      duration: c.duration,
      level: c.level,
      enrolled: !!enrollment,
      completed: enrollment?.status === 'completed',
      enrollmentId: enrollment?.id,
    };
  });

  // Filter by skillId if requested
  const filtered = skillId
    ? formatted.filter(f => f.skillsCovered.some(sc => sc.skillId === skillId))
    : formatted;

  return res.json({ courses: filtered });
});

/**
 * POST /api/students/:id/enroll
 */
router.post('/enroll', authenticate, async (req: AuthRequest, res: Response) => {
  const { studentId, courseId } = req.body;

  if (!studentId || !courseId) {
    return res.status(400).json({ error: { code: 'BAD_REQUEST', message: 'studentId and courseId are required.' } });
  }

  const course = await prisma.course.findUnique({
    where: { id: courseId },
    include: { provider: true },
  });

  if (!course) {
    return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Course not found.' } });
  }

  const enrollment = await prisma.enrollment.upsert({
    where: {
      studentId_courseId: {
        studentId,
        courseId,
      }
    },
    update: {},
    create: {
      studentId,
      courseId,
      status: 'enrolled',
    }
  });

  return res.json({
    message: 'Enrolled successfully in partner course.',
    enrollment,
    externalUrl: course.externalUrl,
    providerName: course.provider.name,
  });
});

/**
 * POST /api/enrollments/:id/complete
 * Mark course complete -> recalculates StudentSkillScores
 */
router.post('/enrollments/:id/complete', authenticate, async (req: AuthRequest, res: Response) => {
  const enrollmentId = req.params.id;
  const studentProfileId = req.user?.studentProfileId;

  if (!studentProfileId) {
    return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Only students can complete enrollments.' } });
  }

  try {
    const result = await completeCourseEnrollment(studentProfileId, enrollmentId);
    return res.json({
      message: 'Course completion recorded! Skill radar scores have been updated.',
      result,
    });
  } catch (error: any) {
    console.error('Course completion error:', error);
    return res.status(400).json({ error: { code: 'COMPLETION_ERROR', message: error.message || 'Could not complete course.' } });
  }
});

export default router;
