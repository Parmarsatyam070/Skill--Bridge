import { Router, Response } from 'express';
import { prisma } from '../config/prisma.js';
import { authenticate, requireRole, AuthRequest } from '../middleware/auth.js';
import {
  requireStudentProfile,
  requireIndustryProfile,
  requireOpportunityOwnership,
} from '../middleware/authorization.js';
import { aiRateLimiter, validateAiInput } from '../middleware/aiRateLimit.js';
import { recordAuditLog } from '../services/auditLogService.js';
import { toSafeRecruiterCandidateDto } from '../utils/safeCandidateDto.js';
import { normalizeSkillName } from '../services/skillNormalizer.js';
import { calculateOpportunityMatches } from '../services/matchingEngine.js';
import { z } from 'zod';

const router = Router();

// ------------- Validation Schemas -------------

const CreateOpportunitySchema = z.object({
  title: z.string().min(3).max(200),
  description: z.string().min(10).max(5000),
  type: z.enum(['JOB', 'INTERNSHIP', 'PROJECT', 'RESEARCH', 'FREELANCE']).default('JOB'),
  industry: z.string().max(200).optional(),
  location: z.string().max(200).default('Remote'),
  remote: z.boolean().default(true),
  workMode: z.enum(['REMOTE', 'HYBRID', 'ONSITE']).default('REMOTE'),
  experienceLevel: z.enum(['ENTRY', 'MID', 'SENIOR']).default('ENTRY'),
  educationRequirements: z.string().max(500).optional(),
  stipend: z.string().max(100).optional(),
  duration: z.string().max(100).optional(),
  applicationDeadline: z.string().datetime().optional(),
  requiredSkills: z.array(z.object({
    skillId: z.string().optional(),
    skillName: z.string().optional(),
    proficiencyLevel: z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT']).default('INTERMEDIATE'),
    weight: z.number().int().min(1).max(5).default(3),
    minScore: z.number().min(0).max(100).default(70),
    isMandatory: z.boolean().default(true),
  })).min(1).max(20),
});

const UpdateOpportunitySchema = CreateOpportunitySchema.partial();

const OpportunityFilterSchema = z.object({
  type: z.string().optional(),
  workMode: z.string().optional(),
  experienceLevel: z.string().optional(),
  search: z.string().max(200).optional(),
  status: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  sortBy: z.enum(['createdAt', 'title', 'applicationDeadline']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// ------------- Helper Functions -------------

function parseJsonSafe<T>(jsonStr: string | null | undefined): T | null {
  if (!jsonStr) return null;
  try {
    return JSON.parse(jsonStr) as T;
  } catch {
    return null;
  }
}

// ------------- ROUTES -------------

/**
 * GET /api/opportunities
 * List opportunities with filtering, search, and pagination.
 * Public endpoint (optionalAuthenticate not needed — open discovery).
 */
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const filterResult = OpportunityFilterSchema.safeParse(req.query);
    if (!filterResult.success) {
      return res.status(400).json({
        error: { code: 'VALIDATION_ERROR', message: filterResult.error.errors[0]?.message }
      });
    }

    const { type, workMode, experienceLevel, search, status, page, limit, sortBy, sortOrder } = filterResult.data;

    const where: any = {};
    if (type) where.type = type;
    if (workMode) where.workMode = workMode;
    if (experienceLevel) where.experienceLevel = experienceLevel;

    // Public visibility guard:
    // DRAFT opportunities are NEVER publicly visible.
    // Only OPEN (and optionally PAUSED) opportunities are publicly discoverable.
    // Recruiters viewing their own listings use the /my/listings endpoint instead.
    const PUBLIC_VISIBLE_STATUSES = ['OPEN'];
    if (status && PUBLIC_VISIBLE_STATUSES.includes(status as string)) {
      where.status = status;
    } else {
      where.status = 'OPEN'; // Default and maximum public visibility
    }

    // Filter out expired opportunities (past applicationDeadline)
    where.OR = [
      { applicationDeadline: null },
      { applicationDeadline: { gte: new Date() } },
    ];

    if (search) {
      // search must not conflict with the OR above — wrap with AND
      where.AND = [
        {
          OR: [
            { title: { contains: search, mode: 'insensitive' } },
            { description: { contains: search, mode: 'insensitive' } },
            { industry: { contains: search, mode: 'insensitive' } },
          ],
        },
      ];
      delete where.OR; // move deadline filter into AND
      where.AND.push({
        OR: [
          { applicationDeadline: null },
          { applicationDeadline: { gte: new Date() } },
        ],
      });
    }

    const [opportunities, total] = await Promise.all([
      prisma.opportunity.findMany({
        where,
        include: {
          company: {
            select: {
              id: true,
              companyName: true,
              website: true,
              industrySector: true,
            },
          },
          skills: {
            include: { skill: { select: { id: true, name: true } } },
          },
          _count: {
            select: { applications: true, matches: true },
          },
        },
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.opportunity.count({ where }),
    ]);

    const formatted = opportunities.map((opp: any) => ({
      id: opp.id,
      title: opp.title,
      description: opp.description,
      type: opp.type,
      industry: opp.company?.industrySector || opp.industry,
      location: opp.location,
      remote: opp.remote,
      workMode: opp.workMode,
      experienceLevel: opp.experienceLevel,
      educationRequirements: opp.educationRequirements,
      stipend: opp.stipend,
      duration: opp.duration,
      applicationDeadline: opp.applicationDeadline,
      status: opp.status,
      createdAt: opp.createdAt,
      company: {
        id: opp.company?.id,
        name: opp.company?.companyName,
        website: opp.company?.website,
        industry: opp.company?.industrySector,
      },
      requiredSkills: (opp.skills || []).map((rs: any) => ({
        id: rs.id,
        skillId: rs.skillId,
        skillName: rs.skill?.name || rs.skillName || 'Unknown',
        proficiencyLevel: rs.proficiencyLevel,
        weight: rs.weight,
        minScore: rs.minScore,
        isMandatory: rs.isMandatory,
      })),
      applicantCount: opp._count?.applications || 0,
      matchCount: opp._count?.matches || 0,
    }));

    return res.json({
      opportunities: formatted,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err: any) {
    console.error('Error fetching opportunities:', err);
    return res.status(500).json({
      error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch opportunities.' }
    });
  }
});

/**
 * GET /api/opportunities/:id
 * Get single opportunity detail.
 */
router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const opportunity = await prisma.opportunity.findUnique({
      where: { id: req.params.id },
      include: {
        company: {
          select: {
            id: true,
            companyName: true,
            website: true,
            industrySector: true,
          },
        },
        skills: {
          include: { skill: { select: { id: true, name: true } } },
        },
        _count: {
          select: { applications: true },
        },
      },
    });

    if (!opportunity) {
      return res.status(404).json({
        error: { code: 'NOT_FOUND', message: 'Opportunity not found.' }
      });
    }

    return res.json({ opportunity });
  } catch (err: any) {
    console.error('Error fetching opportunity:', err);
    return res.status(500).json({
      error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch opportunity details.' }
    });
  }
});

/**
 * POST /api/opportunities
 * Create a new opportunity (Industry/Recruiter only).
 * Uses $transaction for atomicity across Opportunity + OpportunitySkill creation.
 */
router.post('/', authenticate, requireIndustryProfile, async (req: AuthRequest, res: Response) => {
  try {
    const parseResult = CreateOpportunitySchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        error: { code: 'VALIDATION_ERROR', message: parseResult.error.errors[0]?.message }
      });
    }

    const data = parseResult.data;
    const companyId = req.user!.industryProfileId!;

    const opportunity = await prisma.$transaction(async (tx) => {
      // Resolve skill IDs via normalizer for any skills provided by name only
      const resolvedSkills = await Promise.all(
        data.requiredSkills.map(async (rs) => {
          let skillId = rs.skillId;
          if (!skillId && rs.skillName) {
            skillId = await normalizeSkillName(rs.skillName) || undefined;
          }
          return { ...rs, skillId };
        })
      );

      // Filter out skills with no valid skillId (cannot link to database)
      const validSkills = resolvedSkills.filter(rs => rs.skillId);

      if (validSkills.length === 0) {
        throw new Error('At least one valid skill is required. None of the provided skills could be resolved.');
      }

      const opp = await tx.opportunity.create({
        data: {
          companyId,
          title: data.title,
          description: data.description,
          type: data.type,
          industry: data.industry,
          location: data.location,
          remote: data.remote,
          workMode: data.workMode,
          experienceLevel: data.experienceLevel,
          educationRequirements: data.educationRequirements,
          stipend: data.stipend,
          duration: data.duration,
          applicationDeadline: data.applicationDeadline ? new Date(data.applicationDeadline) : null,
          status: 'OPEN',
        },
      });

      // Create OpportunitySkill junction records
      await tx.opportunitySkill.createMany({
        data: validSkills.map(rs => ({
          opportunityId: opp.id,
          skillId: rs.skillId!,
          skillName: rs.skillName || null,
          proficiencyLevel: rs.proficiencyLevel,
          weight: rs.weight,
          minScore: rs.minScore,
          isMandatory: rs.isMandatory,
        })),
      });

      // Audit log within transaction
      await recordAuditLog({
        userId: req.user!.id,
        action: 'CREATE_OPPORTUNITY',
        entity: 'Opportunity',
        entityId: opp.id,
        metadata: { title: data.title, skillCount: validSkills.length },
        tx,
      });

      return opp;
    });

    // Fetch the full opportunity with relations for response
    const fullOpportunity = await prisma.opportunity.findUnique({
      where: { id: opportunity.id },
      include: {
        company: { select: { id: true, companyName: true, website: true } },
        skills: { include: { skill: { select: { id: true, name: true } } } },
      },
    });

    return res.status(201).json({
      message: 'Opportunity created successfully.',
      opportunity: fullOpportunity,
    });
  } catch (err: any) {
    console.error('Error creating opportunity:', err);
    if (err.message?.includes('At least one valid skill')) {
      return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: err.message } });
    }
    return res.status(500).json({
      error: { code: 'INTERNAL_ERROR', message: 'Failed to create opportunity.' }
    });
  }
});

/**
 * PUT /api/opportunities/:id
 * Update an existing opportunity (owner only).
 */
router.put('/:id', authenticate, requireOpportunityOwnership, async (req: AuthRequest, res: Response) => {
  try {
    const parseResult = UpdateOpportunitySchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        error: { code: 'VALIDATION_ERROR', message: parseResult.error.errors[0]?.message }
      });
    }

    const data = parseResult.data;
    const opportunityId = req.params.id;

    const updated = await prisma.$transaction(async (tx) => {
      const updateData: any = {};
      if (data.title !== undefined) updateData.title = data.title;
      if (data.description !== undefined) updateData.description = data.description;
      if (data.type !== undefined) updateData.type = data.type;
      if (data.industry !== undefined) updateData.industry = data.industry;
      if (data.location !== undefined) updateData.location = data.location;
      if (data.remote !== undefined) updateData.remote = data.remote;
      if (data.workMode !== undefined) updateData.workMode = data.workMode;
      if (data.experienceLevel !== undefined) updateData.experienceLevel = data.experienceLevel;
      if (data.educationRequirements !== undefined) updateData.educationRequirements = data.educationRequirements;
      if (data.stipend !== undefined) updateData.stipend = data.stipend;
      if (data.duration !== undefined) updateData.duration = data.duration;
      if (data.applicationDeadline !== undefined) updateData.applicationDeadline = data.applicationDeadline ? new Date(data.applicationDeadline) : null;

      const opp = await tx.opportunity.update({
        where: { id: opportunityId },
        data: updateData,
      });

      // If skills are being updated, replace them transactionally
      if (data.requiredSkills) {
        await tx.opportunitySkill.deleteMany({ where: { opportunityId } });

        const resolvedSkills = await Promise.all(
          data.requiredSkills.map(async (rs) => {
            let skillId = rs.skillId;
            if (!skillId && rs.skillName) {
              skillId = await normalizeSkillName(rs.skillName) || undefined;
            }
            return { ...rs, skillId };
          })
        );

        const validSkills = resolvedSkills.filter(rs => rs.skillId);
        if (validSkills.length > 0) {
          await tx.opportunitySkill.createMany({
            data: validSkills.map(rs => ({
              opportunityId,
              skillId: rs.skillId!,
              skillName: rs.skillName || null,
              proficiencyLevel: rs.proficiencyLevel || 'INTERMEDIATE',
              weight: rs.weight || 3,
              minScore: rs.minScore || 70,
              isMandatory: rs.isMandatory ?? true,
            })),
          });
        }
      }

      await recordAuditLog({
        userId: req.user!.id,
        action: 'UPDATE_OPPORTUNITY',
        entity: 'Opportunity',
        entityId: opportunityId,
        metadata: { updatedFields: Object.keys(data) },
        tx,
      });

      return opp;
    });

    const fullOpportunity = await prisma.opportunity.findUnique({
      where: { id: opportunityId },
      include: {
        company: { select: { id: true, companyName: true } },
        skills: { include: { skill: { select: { id: true, name: true } } } },
      },
    });

    return res.json({
      message: 'Opportunity updated successfully.',
      opportunity: fullOpportunity,
    });
  } catch (err: any) {
    console.error('Error updating opportunity:', err);
    return res.status(500).json({
      error: { code: 'INTERNAL_ERROR', message: 'Failed to update opportunity.' }
    });
  }
});

/**
 * PATCH /api/opportunities/:id/status
 * Update opportunity status (owner only).
 */
router.patch('/:id/status', authenticate, requireOpportunityOwnership, async (req: AuthRequest, res: Response) => {
  try {
    const { status } = req.body;
    if (!['OPEN', 'CLOSED', 'DRAFT', 'PAUSED'].includes(status)) {
      return res.status(400).json({
        error: { code: 'VALIDATION_ERROR', message: 'Status must be one of: OPEN, CLOSED, DRAFT, PAUSED.' }
      });
    }

    const updated = await prisma.opportunity.update({
      where: { id: req.params.id },
      data: { status },
    });

    await recordAuditLog({
      userId: req.user!.id,
      action: 'UPDATE_OPPORTUNITY_STATUS',
      entity: 'Opportunity',
      entityId: req.params.id,
      metadata: { newStatus: status },
    });

    return res.json({ message: 'Opportunity status updated.', opportunity: updated });
  } catch (err: any) {
    console.error('Error updating opportunity status:', err);
    return res.status(500).json({
      error: { code: 'INTERNAL_ERROR', message: 'Failed to update status.' }
    });
  }
});

/**
 * DELETE /api/opportunities/:id
 * Soft delete by setting status to CLOSED (owner only).
 */
router.delete('/:id', authenticate, requireOpportunityOwnership, async (req: AuthRequest, res: Response) => {
  try {
    await prisma.opportunity.update({
      where: { id: req.params.id },
      data: { status: 'CLOSED' },
    });

    await recordAuditLog({
      userId: req.user!.id,
      action: 'CLOSE_OPPORTUNITY',
      entity: 'Opportunity',
      entityId: req.params.id,
    });

    return res.json({ message: 'Opportunity closed successfully.' });
  } catch (err: any) {
    console.error('Error closing opportunity:', err);
    return res.status(500).json({
      error: { code: 'INTERNAL_ERROR', message: 'Failed to close opportunity.' }
    });
  }
});

/**
 * GET /api/opportunities/:id/applicants
 * Get ranked applicants for an opportunity (owner only).
 * Returns privacy-safe candidate data via SafeRecruiterCandidateDto.
 */
router.get('/:id/applicants', authenticate, requireOpportunityOwnership, async (req: AuthRequest, res: Response) => {
  try {
    const opportunityId = req.params.id;

    const applications = await prisma.application.findMany({
      where: { opportunityId },
      include: {
        student: {
          include: {
            user: { select: { id: true, name: true, avatarUrl: true } },
            skillScores: { include: { skill: true } },
          },
        },
      },
      orderBy: { matchScoreAtApply: 'desc' },
    });

    // Look up cached 7-factor match scores — MUST only use v2.0-7factor records
    const matchRecords = await prisma.candidateMatch.findMany({
      where: {
        opportunityId,
        algorithmVersion: 'v2.0-7factor', // Guard: never mix Internship match scores
      },
    });
    const matchMap = new Map(matchRecords.map(m => [m.candidateId, m]));

    const applicants = applications.map(app => {
      const match = matchMap.get(app.studentId);
      const safeCandidate = toSafeRecruiterCandidateDto(app.student, {
        matchScore: match?.score ?? app.matchScoreAtApply ?? 0,
        matchBreakdown: match ? parseJsonSafe(match.breakdownJson) : null,
      });

      return {
        applicationId: app.id,
        status: app.status,
        coverNote: app.coverNote,
        matchScoreAtApply: app.matchScoreAtApply,
        liveMatchScore: match?.score ?? null,          // From 7-factor cache
        eligibility: match?.eligibility ?? true,        // From 7-factor eligibility gate
        ineligibilityReason: match?.ineligibilityReason ?? null,
        algorithmVersion: match?.algorithmVersion ?? null,
        appliedAt: app.appliedAt,
        candidate: safeCandidate,
      };
    });

    // Sort: eligible first, then by live match score desc
    applicants.sort((a, b) => {
      if (a.eligibility !== b.eligibility) return a.eligibility ? -1 : 1;
      return (b.liveMatchScore ?? 0) - (a.liveMatchScore ?? 0);
    });

    return res.json({ applicants });
  } catch (err: any) {
    console.error('Error fetching applicants:', err);
    return res.status(500).json({
      error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch applicants.' }
    });
  }
});

/**
 * POST /api/opportunities/:id/apply
 * Student applies to an opportunity.
 */
router.post('/:id/apply', authenticate, requireStudentProfile, async (req: AuthRequest, res: Response) => {
  try {
    const opportunityId = req.params.id;
    const studentProfileId = req.user!.studentProfileId!;

    // Check opportunity exists and is open
    const opportunity = await prisma.opportunity.findUnique({
      where: { id: opportunityId },
      select: { id: true, status: true, applicationDeadline: true },
    });

    if (!opportunity) {
      return res.status(404).json({
        error: { code: 'NOT_FOUND', message: 'Opportunity not found.' }
      });
    }

    if (opportunity.status !== 'OPEN') {
      return res.status(400).json({
        error: { code: 'OPPORTUNITY_CLOSED', message: 'This opportunity is no longer accepting applications.' }
      });
    }

    if (opportunity.applicationDeadline && new Date() > opportunity.applicationDeadline) {
      return res.status(400).json({
        error: { code: 'DEADLINE_PASSED', message: 'The application deadline has passed.' }
      });
    }

    // Check for duplicate application
    const existing = await prisma.application.findFirst({
      where: { studentId: studentProfileId, opportunityId },
    });

    if (existing) {
      return res.status(409).json({
        error: { code: 'ALREADY_APPLIED', message: 'You have already applied to this opportunity.' }
      });
    }

    const { coverNote, resumeId } = req.body;

    // Look up cached match score for snapshot
    const cachedMatch = await prisma.candidateMatch.findUnique({
      where: {
        candidateId_opportunityId: {
          candidateId: studentProfileId,
          opportunityId,
        },
      },
      select: { score: true },
    });

    const application = await prisma.$transaction(async (tx) => {
      const app = await tx.application.create({
        data: {
          studentId: studentProfileId,
          opportunityId,
          coverNote: coverNote || null,
          resumeId: resumeId || null,
          status: 'APPLIED',
          matchScoreAtApply: cachedMatch?.score || 0,
        },
      });

      await recordAuditLog({
        userId: req.user!.id,
        action: 'APPLY_OPPORTUNITY',
        entity: 'Application',
        entityId: app.id,
        metadata: { opportunityId, matchScoreAtApply: cachedMatch?.score || 0 },
        tx,
      });

      return app;
    });

    return res.status(201).json({
      message: 'Application submitted successfully.',
      application,
    });
  } catch (err: any) {
    console.error('Error applying to opportunity:', err);
    return res.status(500).json({
      error: { code: 'INTERNAL_ERROR', message: 'Failed to submit application.' }
    });
  }
});

/**
 * POST /api/opportunities/:id/save
 * Student saves/bookmarks an opportunity.
 */
router.post('/:id/save', authenticate, requireStudentProfile, async (req: AuthRequest, res: Response) => {
  try {
    const opportunityId = req.params.id;
    const studentProfileId = req.user!.studentProfileId!;

    // Upsert — idempotent save
    await prisma.savedOpportunity.upsert({
      where: {
        studentId_opportunityId: {
          studentId: studentProfileId,
          opportunityId,
        },
      },
      update: {},
      create: {
        studentId: studentProfileId,
        opportunityId,
      },
    });

    return res.json({ message: 'Opportunity saved.' });
  } catch (err: any) {
    console.error('Error saving opportunity:', err);
    return res.status(500).json({
      error: { code: 'INTERNAL_ERROR', message: 'Failed to save opportunity.' }
    });
  }
});

/**
 * DELETE /api/opportunities/:id/save
 * Student unsaves/unbookmarks an opportunity.
 */
router.delete('/:id/save', authenticate, requireStudentProfile, async (req: AuthRequest, res: Response) => {
  try {
    const opportunityId = req.params.id;
    const studentProfileId = req.user!.studentProfileId!;

    await prisma.savedOpportunity.deleteMany({
      where: {
        studentId: studentProfileId,
        opportunityId,
      },
    });

    return res.json({ message: 'Opportunity unsaved.' });
  } catch (err: any) {
    console.error('Error unsaving opportunity:', err);
    return res.status(500).json({
      error: { code: 'INTERNAL_ERROR', message: 'Failed to unsave opportunity.' }
    });
  }
});

/**
 * GET /api/opportunities/saved/list
 * Get all saved opportunities for the logged-in student.
 */
router.get('/saved/list', authenticate, requireStudentProfile, async (req: AuthRequest, res: Response) => {
  try {
    const studentProfileId = req.user!.studentProfileId!;

    const saved = await prisma.savedOpportunity.findMany({
      where: { studentId: studentProfileId },
      include: {
        opportunity: {
          include: {
            company: { select: { id: true, companyName: true, website: true } },
            skills: { include: { skill: { select: { name: true } } } },
          },
        },
      },
      orderBy: { savedAt: 'desc' },
    });

    return res.json({
      savedOpportunities: saved.map((s: any) => ({
        savedAt: s.savedAt,
        opportunity: {
          id: s.opportunity?.id,
          title: s.opportunity?.title,
          type: s.opportunity?.type,
          location: s.opportunity?.location,
          workMode: s.opportunity?.workMode,
          stipend: s.opportunity?.stipend,
          status: s.opportunity?.status,
          company: s.opportunity?.company,
          skills: (s.opportunity?.skills || []).map((rs: any) => rs.skill?.name || rs.skillName),
          createdAt: s.opportunity?.createdAt,
        },
      })),
    });
  } catch (err: any) {
    console.error('Error fetching saved opportunities:', err);
    return res.status(500).json({
      error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch saved opportunities.' }
    });
  }
});

/**
 * GET /api/opportunities/my/listings
 * Get all opportunities created by the logged-in recruiter.
 */
router.get('/my/listings', authenticate, requireIndustryProfile, async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user!.industryProfileId!;

    const opportunities = await prisma.opportunity.findMany({
      where: { companyId },
      include: {
        skills: { include: { skill: { select: { name: true } } } },
        _count: { select: { applications: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return res.json({
      opportunities: opportunities.map((opp: any) => ({
        id: opp.id,
        title: opp.title,
        type: opp.type,
        status: opp.status,
        location: opp.location,
        workMode: opp.workMode,
        stipend: opp.stipend,
        createdAt: opp.createdAt,
        applicationDeadline: opp.applicationDeadline,
        applicantCount: opp._count?.applications || 0,
        skills: (opp.skills || []).map((rs: any) => rs.skill?.name || rs.skillName),
      })),
    });
  } catch (err: any) {
    console.error('Error fetching my listings:', err);
    return res.status(500).json({
      error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch your listings.' }
    });
  }
});

/**
 * GET /api/opportunities/my/matches
 * Get AI-computed match scores for the logged-in student against all open opportunities.
 * Triggers calculateOpportunityMatches and caches results in CandidateMatch.
 */
router.get('/my/matches', authenticate, requireStudentProfile, async (req: AuthRequest, res: Response) => {
  try {
    const studentProfileId = req.user!.studentProfileId!;

    const results = await calculateOpportunityMatches(studentProfileId);

    // Enrich with opportunity details
    const oppIds = results.map(r => r.opportunityId);
    const opportunities = await prisma.opportunity.findMany({
      where: { id: { in: oppIds } },
      include: {
        company: { select: { id: true, companyName: true } },
        skills: { include: { skill: { select: { name: true } } } },
      },
    });
    const oppMap = new Map(opportunities.map(o => [o.id, o]));

    const enriched = results.map(r => {
      const opp = oppMap.get(r.opportunityId) as any;
      return {
        opportunityId: r.opportunityId,
        opportunityTitle: r.opportunityTitle,
        score: r.score,
        tier: r.tier,
        eligibility: r.eligibility,
        ineligibilityReason: r.ineligibilityReason,
        company: opp ? { id: opp.company?.id, name: opp.company?.companyName } : null,
        type: opp?.type,
        location: opp?.location,
        workMode: opp?.workMode,
        stipend: opp?.stipend,
        breakdown: parseJsonSafe(r.breakdownJson),
        matchedSkills: parseJsonSafe(r.matchedSkillsJson),
        missingSkills: parseJsonSafe(r.missingSkillsJson),
        strengths: parseJsonSafe(r.strengthsJson),
        recommendations: parseJsonSafe(r.recommendationsJson),
      };
    });

    return res.json({ matches: enriched, total: enriched.length });
  } catch (err: any) {
    console.error('Error computing opportunity matches:', err);
    return res.status(500).json({
      error: { code: 'INTERNAL_ERROR', message: 'Failed to compute opportunity matches.' }
    });
  }
});

export default router;
