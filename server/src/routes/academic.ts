import { Router, Response } from 'express';
import { prisma } from '../config/prisma.js';
import { authenticate, requireRole, AuthRequest } from '../middleware/auth.js';
import { PostAcademicOpportunitySchema } from '../../../shared/validation.js';

const router = Router();

/**
 * GET /api/academic-opportunities
 */
router.get('/', async (req, res) => {
  const type = req.query.type as string;
  const opportunities = await prisma.academicOpportunity.findMany({
    where: {
      type: type || undefined,
    },
    orderBy: { createdAt: 'desc' }
  });

  return res.json({ opportunities });
});

/**
 * POST /api/academic-opportunities
 */
router.post('/', authenticate, requireRole(['ACADEMICIAN', 'INDUSTRY', 'INSTITUTION_ADMIN']), async (req: AuthRequest, res: Response) => {
  const parseResult = PostAcademicOpportunitySchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: parseResult.error.errors[0]?.message } });
  }

  const { type, title, description, deadline } = parseResult.data;

  const opportunity = await prisma.academicOpportunity.create({
    data: {
      type,
      title,
      description,
      deadline: deadline || null,
      postedBy: req.user?.email || 'Faculty Coordinator',
      status: 'OPEN',
    }
  });

  return res.status(201).json({ message: 'Academic opportunity posted successfully', opportunity });
});

export default router;
