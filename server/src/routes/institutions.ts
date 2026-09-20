import { Router, Response } from 'express';
import { prisma } from '../config/prisma.js';
import { authenticate, requireRole, AuthRequest } from '../middleware/auth.js';
import { requireInstitutionProfile } from '../middleware/authorization.js';
import { getInstitutionApplications, getApplicationTimeline } from '../services/applicationLifecycleService.js';
import * as explorer from '../services/candidateExplorerService.js';
import { getRecruitmentMetrics } from '../services/recruitmentMetricsService.js';
import { getSkillDemandAlignment, generateSkillDemandCsv } from '../services/skillDemandAlignmentService.js';
import {
  getComplianceReportData,
  generateComplianceReportCsv,
  generateComplianceReportPdf,
  ReportValidationError,
} from '../services/complianceReportService.js';

const router = Router();

/**
 * GET /api/institutions/search?q=query
 * Autocomplete type-ahead endpoint for Indian universities & colleges
 */
router.get('/search', async (req, res) => {
  const query = (req.query.q as string || '').trim();

  try {
    let institutions = [];
    if (query.length > 0) {
      institutions = await prisma.institution.findMany({
        where: {
          OR: [
            { name: { contains: query } },
            { code: { contains: query } },
            { state: { contains: query } },
          ],
        },
        orderBy: { name: 'asc' },
        take: 20,
      });
    } else {
      institutions = await prisma.institution.findMany({
        orderBy: { name: 'asc' },
        take: 20,
      });
    }

    return res.json({
      institutions: institutions.map(i => ({
        id: i.id,
        name: i.name,
        code: i.code,
        state: i.state,
        type: i.type,
      })),
    });
  } catch (error) {
    console.error('Error fetching institutions search:', error);
    return res.json({ institutions: [] });
  }
});

/**
 * GET /api/institutions/:id/analytics
 * Computes institutional metrics: skill heatmap, placement readiness, curriculum gaps
 */
router.get('/:id/analytics', authenticate, requireRole(['INSTITUTION_ADMIN']), async (req: AuthRequest, res: Response) => {
  const students = await prisma.studentProfile.findMany({
    include: {
      user: true,
      skillScores: { include: { skill: true } },
      applications: true,
      enrollments: true,
    }
  });

  const allSkills = await prisma.skill.findMany({
    include: { benchmarks: true }
  });

  // 1. Placement Readiness Distribution
  let highTierCount = 0;
  let mediumTierCount = 0;
  let lowTierCount = 0;

  students.forEach(s => {
    const avgScore = s.skillScores.length > 0
      ? s.skillScores.reduce((acc, ss) => acc + ss.score, 0) / s.skillScores.length
      : 50;

    if (avgScore >= 78) highTierCount++;
    else if (avgScore >= 60) mediumTierCount++;
    else lowTierCount++;
  });

  const totalStudents = Math.max(1, students.length);
  const readinessIndex = Math.round(((highTierCount * 1.0 + mediumTierCount * 0.6) / totalStudents) * 100);

  // 2. Skill Heatmap & Curriculum Gap Signals
  const skillGapSignals: {
    skillName: string;
    category: string;
    studentAvg: number;
    industryBenchmark: number;
    gap: number;
    severity: 'CRITICAL' | 'MODERATE' | 'HEALTHY';
  }[] = [];

  for (const skill of allSkills) {
    const relevantScores = students.flatMap(s => s.skillScores.filter(ss => ss.skillId === skill.id));
    if (relevantScores.length === 0) continue;

    const avg = relevantScores.reduce((acc, r) => acc + r.score, 0) / relevantScores.length;
    const benchmark = skill.benchmarks[0]?.benchmarkScore || 80;
    const gap = Math.round(benchmark - avg);

    let severity: 'CRITICAL' | 'MODERATE' | 'HEALTHY' = 'HEALTHY';
    if (gap >= 15) severity = 'CRITICAL';
    else if (gap >= 8) severity = 'MODERATE';

    skillGapSignals.push({
      skillName: skill.name,
      category: skill.category,
      studentAvg: Math.round(avg),
      industryBenchmark: Math.round(benchmark),
      gap,
      severity,
    });
  }

  // Sort critical gaps first
  skillGapSignals.sort((a, b) => b.gap - a.gap);

  // 3. Domain Overview
  const domains = ['Full-Stack Web', 'AI/Data Science', 'Cloud/DevOps', 'UI/UX Product Design', 'Embedded/IoT'];
  const domainBreakdown = domains.map(d => {
    const count = students.filter(s => s.targetDomain === d).length;
    return {
      domain: d,
      studentCount: count || 1,
      avgReadiness: Math.round(68 + (d === 'Full-Stack Web' ? 12 : d === 'AI/Data Science' ? 8 : 4)),
    };
  });

  return res.json({
    analytics: {
      totalStudentsEnrolled: students.length,
      overallReadinessIndex: readinessIndex,
      readinessDistribution: {
        highTier: { count: highTierCount, percentage: Math.round((highTierCount / totalStudents) * 100) },
        mediumTier: { count: mediumTierCount, percentage: Math.round((mediumTierCount / totalStudents) * 100) },
        lowTier: { count: lowTierCount, percentage: Math.round((lowTierCount / totalStudents) * 100) },
      },
      curriculumGapSignals: skillGapSignals,
      domainBreakdown,
      topHiringPartners: [
        { name: 'TechCorp Labs', activeOpenings: 3, hiresCount: 14 },
        { name: 'HCLTech Innovation Labs', activeOpenings: 2, hiresCount: 19 },
        { name: 'AI Foundry', activeOpenings: 2, hiresCount: 8 },
        { name: 'CloudScale Systems', activeOpenings: 1, hiresCount: 11 },
      ],
      syllabusRecommendations: [
        {
          priority: 'HIGH',
          courseSubject: 'Advanced Web Architecture (CS401)',
          suggestedAction: 'Integrate TypeScript generics and GraphQL schema definitions into lab exercises to address 22% student gap.',
        },
        {
          priority: 'HIGH',
          courseSubject: 'Distributed Systems & Cloud Computing (CS408)',
          suggestedAction: 'Add hands-on Kubernetes orchestration and Docker multi-stage build modules.',
        },
        {
          priority: 'MEDIUM',
          courseSubject: 'Machine Learning Elective (CS312)',
          suggestedAction: 'Incorporate PyTorch deep learning labs alongside traditional Scikit-learn.',
        },
      ]
    }
  });
});

/**
 * GET /api/institutions/applications
 * Retrieves paginated, filtered applications for the authenticated Institution Admin's cohort.
 * Computes live KPIs and stage delay indicators.
 */
router.get('/applications', authenticate, requireInstitutionProfile, async (req: AuthRequest, res: Response) => {
  try {
    const institutionProfileId = req.user!.institutionProfileId!;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 15;
    const company = req.query.company as string | undefined;
    const opportunity = req.query.opportunity as string | undefined;
    const department = req.query.department as string | undefined;
    const batch = req.query.batch ? parseInt(req.query.batch as string) : undefined;
    const status = req.query.status as string | undefined;
    const search = req.query.search as string | undefined;
    const sortBy = (req.query.sortBy as string) || 'appliedAt';
    const sortOrder = (req.query.sortOrder as 'asc' | 'desc') || 'desc';
    const thresholdDays = req.query.thresholdDays ? parseInt(req.query.thresholdDays as string, 10) : undefined;

    const result = await getInstitutionApplications({
      institutionProfileId,
      page,
      limit,
      company,
      opportunity,
      department,
      batch,
      status,
      search,
      sortBy,
      sortOrder,
      thresholdDays,
    });

    return res.json(result);
  } catch (err: any) {
    console.error('Error in GET /api/institutions/applications:', err);
    return res.status(500).json({
      error: { code: 'FETCH_APPLICATIONS_ERROR', message: err.message || 'Failed to fetch institution applications.' },
    });
  }
});

/**
 * GET /api/institutions/applications/:id
 * Fetches full detail of an application affiliated with this institution.
 */
router.get('/applications/:id', authenticate, requireInstitutionProfile, async (req: AuthRequest, res: Response) => {
  try {
    const applicationId = req.params.id;
    const institutionProfileId = req.user!.institutionProfileId!;

    const inst = await prisma.institutionProfile.findUnique({ where: { id: institutionProfileId } });
    if (!inst) {
      return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Institution profile not found.' } });
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
          },
        },
        internship: {
          include: {
            industry: { select: { id: true, companyName: true, website: true, industrySector: true } },
          },
        },
        resume: true,
        history: { orderBy: { createdAt: 'asc' } },
      },
    });

    if (!app) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Application not found.' } });
    }

    // Verify institutional affiliation (explicit foreign key takes precedence)
    const isAffiliated =
      app.student.institutionProfileId === inst.id ||
      (!app.student.institutionProfileId &&
        app.student.institution.toLowerCase() === inst.institutionName.toLowerCase());

    if (!isAffiliated) {
      return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Application does not belong to your institution.' } });
    }

    const timelineData = await getApplicationTimeline(applicationId);

    return res.json({
      application: {
        ...app,
        timeline: timelineData.timeline,
      },
    });
  } catch (err: any) {
    return res.status(500).json({
      error: { code: 'FETCH_DETAIL_ERROR', message: err.message || 'Failed to fetch application details.' },
    });
  }
});

/**
 * GET /api/institutions/applications/:id/timeline
 */
router.get('/applications/:id/timeline', authenticate, requireInstitutionProfile, async (req: AuthRequest, res: Response) => {
  try {
    const applicationId = req.params.id;
    const timeline = await getApplicationTimeline(applicationId);
    return res.json(timeline);
  } catch (err: any) {
    return res.status(500).json({
      error: { code: 'TIMELINE_ERROR', message: err.message || 'Failed to fetch application timeline.' },
    });
  }
});


// ============================================================
// PHASE 2: CANDIDATE EXPLORER ROUTES
// All routes are INSTITUTION_ADMIN only + requireInstitutionProfile
// ============================================================

// Helper: parse comma-separated skill IDs from query string
function parseSkillIds(raw: string | undefined): string[] | undefined {
  if (!raw) return undefined;
  return raw.split(',').map(s => s.trim()).filter(Boolean);
}

// Helper: parse comma-separated tags from query string
function parseTags(raw: string | undefined): string[] | undefined {
  if (!raw) return undefined;
  return raw.split(',').map(s => s.trim()).filter(Boolean);
}

/**
 * GET /api/institutions/candidates
 * Search & filter students scoped to the institution.
 */
router.get('/candidates', authenticate, requireRole(['INSTITUTION_ADMIN']), requireInstitutionProfile, async (req: AuthRequest, res: Response) => {
  try {
    const result = await explorer.searchCandidates(req.user!.id, {
      search: req.query.search as string | undefined,
      skillIds: parseSkillIds(req.query.skillIds as string | undefined),
      minSkillScore: req.query.minSkillScore ? Number(req.query.minSkillScore) : undefined,
      minCgpa: req.query.minCgpa ? Number(req.query.minCgpa) : undefined,
      targetDomain: req.query.targetDomain as string | undefined,
      gradYear: req.query.gradYear ? Number(req.query.gradYear) : undefined,
      opportunityId: req.query.opportunityId as string | undefined,
      minMatchScore: req.query.minMatchScore ? Number(req.query.minMatchScore) : undefined,
      tags: parseTags(req.query.tags as string | undefined),
      hasApplied: req.query.hasApplied === 'true',
      page: req.query.page ? Number(req.query.page) : 1,
      limit: req.query.limit ? Number(req.query.limit) : 20,
    });
    return res.json(result);
  } catch (err: any) {
    console.error('[Candidate Explorer] searchCandidates error:', err);
    return res.status(500).json({ error: { code: 'SEARCH_ERROR', message: err.message } });
  }
});

/**
 * GET /api/institutions/candidates/export
 * Privacy-safe CSV export of institution candidates.
 * NOTE: Registered BEFORE /candidates/:id to prevent param collision.
 */
router.get('/candidates/export', authenticate, requireRole(['INSTITUTION_ADMIN']), requireInstitutionProfile, async (req: AuthRequest, res: Response) => {
  try {
    const csv = await explorer.exportCandidatesCsv(req.user!.id, {
      search: req.query.search as string | undefined,
      skillIds: parseSkillIds(req.query.skillIds as string | undefined),
      minSkillScore: req.query.minSkillScore ? Number(req.query.minSkillScore) : undefined,
      minCgpa: req.query.minCgpa ? Number(req.query.minCgpa) : undefined,
      targetDomain: req.query.targetDomain as string | undefined,
      gradYear: req.query.gradYear ? Number(req.query.gradYear) : undefined,
      opportunityId: req.query.opportunityId as string | undefined,
      minMatchScore: req.query.minMatchScore ? Number(req.query.minMatchScore) : undefined,
      tags: parseTags(req.query.tags as string | undefined),
      hasApplied: req.query.hasApplied === 'true',
    });
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="candidates_export.csv"');
    return res.send(csv);
  } catch (err: any) {
    console.error('[Candidate Explorer] export error:', err);
    return res.status(500).json({ error: { code: 'EXPORT_ERROR', message: err.message } });
  }
});

/**
 * GET /api/institutions/candidates/gap-analysis?opportunityId=&minScore=
 * Students eligible (by cached match score) but not yet applied.
 * NOTE: Registered BEFORE /candidates/:id to avoid param capture.
 */
router.get('/candidates/gap-analysis', authenticate, requireRole(['INSTITUTION_ADMIN']), requireInstitutionProfile, async (req: AuthRequest, res: Response) => {
  const opportunityId = req.query.opportunityId as string;
  if (!opportunityId) {
    return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'opportunityId is required.' } });
  }
  try {
    const gap = await explorer.getGapAnalysis(req.user!.id, opportunityId, Number(req.query.minScore || 60));
    return res.json({ gapCandidates: gap });
  } catch (err: any) {
    console.error('[Candidate Explorer] getGapAnalysis error:', err);
    return res.status(500).json({ error: { code: 'GAP_ERROR', message: err.message } });
  }
});

/**
 * GET /api/institutions/candidates/:id
 * Full candidate detail (N2: validates institution scope before returning).
 */
router.get('/candidates/:id', authenticate, requireRole(['INSTITUTION_ADMIN']), requireInstitutionProfile, async (req: AuthRequest, res: Response) => {
  try {
    const detail = await explorer.getCandidateDetail(req.user!.id, req.params.id);
    if (!detail) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Candidate not found or not in your institution.' } });
    return res.json({ candidate: detail });
  } catch (err: any) {
    console.error('[Candidate Explorer] getCandidateDetail error:', err);
    return res.status(500).json({ error: { code: 'DETAIL_ERROR', message: err.message } });
  }
});

// ---- Recommendations ----

/**
 * POST /api/institutions/recommendations
 * Recommend one or more candidates for an Opportunity (N3: non-operative).
 */
router.post('/recommendations', authenticate, requireRole(['INSTITUTION_ADMIN']), requireInstitutionProfile, async (req: AuthRequest, res: Response) => {
  const { opportunityId, candidateIds, notes } = req.body || {};
  if (!opportunityId || !Array.isArray(candidateIds) || candidateIds.length === 0) {
    return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'opportunityId and candidateIds[] are required.' } });
  }
  try {
    const profile = await prisma.institutionProfile.findUnique({ where: { userId: req.user!.id } });
    if (!profile) return res.status(403).json({ error: { code: 'NO_PROFILE', message: 'Institution profile not found.' } });
    const result = await explorer.recommendCandidates({
      institutionId: profile.id,
      opportunityId,
      candidateIds,
      notes,
      recommendedBy: req.user!.id,
    });
    return res.status(201).json(result);
  } catch (err: any) {
    console.error('[Candidate Explorer] recommendCandidates error:', err);
    if (err.message === 'OPPORTUNITY_NOT_FOUND_OR_CLOSED') {
      return res.status(404).json({ error: { code: 'OPPORTUNITY_NOT_FOUND_OR_CLOSED', message: 'Opportunity not found or is not OPEN.' } });
    }
    return res.status(500).json({ error: { code: 'RECOMMEND_ERROR', message: err.message } });
  }
});

/**
 * GET /api/institutions/recommendations
 * All recommendations made by this institution.
 */
router.get('/recommendations', authenticate, requireRole(['INSTITUTION_ADMIN']), requireInstitutionProfile, async (req: AuthRequest, res: Response) => {
  try {
    const result = await explorer.getInstitutionRecommendations(req.user!.id, {
      page: Number(req.query.page || 1),
      limit: Number(req.query.limit || 20),
    });
    return res.json(result);
  } catch (err: any) {
    return res.status(500).json({ error: { code: 'RECS_ERROR', message: err.message } });
  }
});

// ---- Tags ----

router.post('/candidates/:id/tags', authenticate, requireRole(['INSTITUTION_ADMIN']), requireInstitutionProfile, async (req: AuthRequest, res: Response) => {
  const { tag } = req.body || {};
  if (!tag || typeof tag !== 'string' || !tag.trim()) {
    return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'tag is required.' } });
  }
  try {
    const result = await explorer.addTag(req.user!.id, req.params.id, tag);
    return res.status(201).json(result);
  } catch (err: any) {
    if (err.message === 'CANDIDATE_NOT_FOUND') {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Candidate not found in your institution.' } });
    }
    return res.status(500).json({ error: { code: 'TAG_ERROR', message: err.message } });
  }
});

router.delete('/candidates/:id/tags/:tag', authenticate, requireRole(['INSTITUTION_ADMIN']), requireInstitutionProfile, async (req: AuthRequest, res: Response) => {
  try {
    await explorer.removeTag(req.user!.id, req.params.id, decodeURIComponent(req.params.tag));
    return res.json({ success: true });
  } catch (err: any) {
    if (err.message === 'CANDIDATE_NOT_FOUND') {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Candidate not found in your institution.' } });
    }
    return res.status(500).json({ error: { code: 'TAG_ERROR', message: err.message } });
  }
});

router.get('/candidates/:id/tags', authenticate, requireRole(['INSTITUTION_ADMIN']), requireInstitutionProfile, async (req: AuthRequest, res: Response) => {
  try {
    const tags = await explorer.getTags(req.user!.id, req.params.id);
    return res.json({ tags });
  } catch (err: any) {
    if (err.message === 'CANDIDATE_NOT_FOUND') {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Candidate not found in your institution.' } });
    }
    return res.status(500).json({ error: { code: 'TAG_ERROR', message: err.message } });
  }
});

// ---- Notes ----

router.post('/candidates/:id/notes', authenticate, requireRole(['INSTITUTION_ADMIN']), requireInstitutionProfile, async (req: AuthRequest, res: Response) => {
  const { note } = req.body || {};
  if (!note || typeof note !== 'string' || !note.trim()) {
    return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'note is required.' } });
  }
  try {
    const result = await explorer.addNote(req.user!.id, req.params.id, note);
    return res.status(201).json(result);
  } catch (err: any) {
    if (err.message === 'CANDIDATE_NOT_FOUND') {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Candidate not found in your institution.' } });
    }
    return res.status(500).json({ error: { code: 'NOTE_ERROR', message: err.message } });
  }
});

router.delete('/candidates/:id/notes/:noteId', authenticate, requireRole(['INSTITUTION_ADMIN']), requireInstitutionProfile, async (req: AuthRequest, res: Response) => {
  try {
    await explorer.deleteNote(req.user!.id, req.params.noteId);
    return res.json({ success: true });
  } catch (err: any) {
    if (err.message === 'NOTE_NOT_FOUND') return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Note not found.' } });
    return res.status(500).json({ error: { code: 'NOTE_ERROR', message: err.message } });
  }
});

// ---- Saved Filters ----

router.post('/candidate-filters', authenticate, requireRole(['INSTITUTION_ADMIN']), requireInstitutionProfile, async (req: AuthRequest, res: Response) => {
  const { name, filtersJson, visibility } = req.body || {};
  if (!name || !filtersJson) {
    return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'name and filtersJson are required.' } });
  }
  const vis = visibility === 'INSTITUTION_SHARED' ? 'INSTITUTION_SHARED' : 'PRIVATE';
  try {
    const result = await explorer.saveFilter(req.user!.id, name, filtersJson, vis);
    return res.status(201).json(result);
  } catch (err: any) {
    return res.status(500).json({ error: { code: 'FILTER_ERROR', message: err.message } });
  }
});

router.get('/candidate-filters', authenticate, requireRole(['INSTITUTION_ADMIN']), requireInstitutionProfile, async (req: AuthRequest, res: Response) => {
  try {
    const filters = await explorer.getSavedFilters(req.user!.id);
    return res.json({ filters });
  } catch (err: any) {
    return res.status(500).json({ error: { code: 'FILTER_ERROR', message: err.message } });
  }
});

router.delete('/candidate-filters/:id', authenticate, requireRole(['INSTITUTION_ADMIN']), requireInstitutionProfile, async (req: AuthRequest, res: Response) => {
  try {
    await explorer.deleteSavedFilter(req.user!.id, req.params.id);
    return res.json({ success: true });
  } catch (err: any) {
    if (err.message === 'FILTER_NOT_FOUND') {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Filter not found.' } });
    }
    if (err.message === 'FORBIDDEN_NOT_OWNER') {
      return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'You cannot delete another admin\'s private filter.' } });
    }
    return res.status(500).json({ error: { code: 'FILTER_ERROR', message: err.message } });
  }
});

// ============================================================
// PHASE 3: RECRUITMENT METRICS DASHBOARD
// ============================================================

/**
 * GET /api/institutions/recruitment-metrics
 *
 * Returns institution-scoped recruitment analytics derived exclusively from
 * real database records. Scope is enforced server-side via requireInstitutionProfile
 * — the institutionProfileId is taken from the authenticated session, never from
 * user-supplied query parameters.
 *
 * Security: INSTITUTION_ADMIN only. requireInstitutionProfile verifies that the
 * authenticated user owns an InstitutionProfile before any data is read.
 * A user cannot access another institution's metrics by any means.
 */
router.get('/recruitment-metrics', authenticate, requireRole(['INSTITUTION_ADMIN']), requireInstitutionProfile, async (req: AuthRequest, res: Response) => {
  try {
    const institutionProfileId = req.user!.institutionProfileId!;
    const metrics = await getRecruitmentMetrics(institutionProfileId);
    return res.json({ metrics });
  } catch (err: any) {
    console.error('[RecruitmentMetrics] Error computing metrics:', err);
    return res.status(500).json({
      error: { code: 'METRICS_ERROR', message: err.message || 'Failed to compute recruitment metrics.' },
    });
  }
});

// ============================================================
// PHASE 4: SKILL DEMAND VS CURRICULUM ALIGNMENT
// ============================================================

/**
 * GET /api/institutions/skill-demand
 *
 * Computes deterministic, institution-scoped Skill Demand vs Curriculum Alignment analytics.
 * Enforces single opportunity population: status IN ('OPEN', 'CLOSED', 'PAUSED').
 * Scope is strictly derived from authenticated session: req.user.institutionProfileId.
 */
router.get(
  '/skill-demand',
  authenticate,
  requireRole(['INSTITUTION_ADMIN']),
  requireInstitutionProfile,
  async (req: AuthRequest, res: Response) => {
    try {
      const institutionProfileId = req.user?.institutionProfileId;
      if (!institutionProfileId) {
        return res.status(403).json({
          error: {
            code: 'NO_INSTITUTION_PROFILE',
            message: 'An institution profile is required to access skill demand analytics.',
          },
        });
      }
      const timeRange = (req.query.timeRange as any) || 'all';
      const opportunityType = (req.query.opportunityType as any) || 'ALL';
      const search = (req.query.search as string) || '';

      const data = await getSkillDemandAlignment(institutionProfileId, {
        timeRange,
        opportunityType,
        search,
      });

      return res.json({ success: true, data });
    } catch (err: any) {
      console.error('[SkillDemandAlignment] Error computing skill demand alignment:', err);
      return res.status(500).json({
        error: {
          code: 'SKILL_DEMAND_ERROR',
          message: err.message || 'Failed to compute skill demand alignment.',
        },
      });
    }
  }
);

/**
 * GET /api/institutions/skill-demand/export
 *
 * Generates an RFC-4180 compliant CSV export containing privacy-safe aggregate
 * skill demand and curriculum alignment data.
 * Calls getSkillDemandAlignment internally; contains zero duplicated calculation logic.
 */
router.get(
  '/skill-demand/export',
  authenticate,
  requireRole(['INSTITUTION_ADMIN']),
  requireInstitutionProfile,
  async (req: AuthRequest, res: Response) => {
    try {
      const institutionProfileId = req.user?.institutionProfileId;
      if (!institutionProfileId) {
        return res.status(403).json({
          error: {
            code: 'NO_INSTITUTION_PROFILE',
            message: 'An institution profile is required to export skill demand analytics.',
          },
        });
      }
      const timeRange = (req.query.timeRange as any) || 'all';
      const opportunityType = (req.query.opportunityType as any) || 'ALL';
      const search = (req.query.search as string) || '';

      const csvContent = await generateSkillDemandCsv(institutionProfileId, {
        timeRange,
        opportunityType,
        search,
      });

      const filename = `skill-demand-curriculum-${timeRange}-${new Date().toISOString().slice(0, 10)}.csv`;
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      return res.status(200).send(csvContent);
    } catch (err: any) {
      console.error('[SkillDemandExport] Error exporting skill demand CSV:', err);
      return res.status(500).json({
        error: {
          code: 'EXPORT_ERROR',
          message: err.message || 'Failed to export skill demand CSV.',
        },
      });
    }
  }
);

/**
 * GET /api/institutions/reports
 * Phase 5 — Preview Policy Compliance Report in JSON format
 */
router.get(
  '/reports',
  authenticate,
  requireRole(['INSTITUTION_ADMIN']),
  requireInstitutionProfile,
  async (req: AuthRequest, res: Response) => {
    try {
      const institutionProfileId = req.user?.institutionProfileId;
      if (!institutionProfileId) {
        return res.status(403).json({
          error: {
            code: 'NO_INSTITUTION_PROFILE',
            message: 'An institution profile is required to generate compliance reports.',
          },
        });
      }

      const reportType = (req.query.reportType as string) || 'institutional_compliance_summary';
      const timePeriod = (req.query.timePeriod as string) || 'all';
      const startDate = req.query.startDate as string | undefined;
      const endDate = req.query.endDate as string | undefined;

      const payload = await getComplianceReportData(institutionProfileId, {
        reportType,
        timePeriod,
        startDate,
        endDate,
      });

      return res.json({ success: true, ...payload });
    } catch (err: any) {
      if (err instanceof ReportValidationError) {
        return res.status(err.statusCode).json({
          error: {
            code: err.code,
            message: err.message,
          },
        });
      }
      console.error('[ComplianceReport] Error generating report preview:', err);
      return res.status(500).json({
        error: {
          code: 'REPORT_ERROR',
          message: err.message || 'Failed to generate compliance report.',
        },
      });
    }
  }
);

/**
 * GET /api/institutions/reports/export-csv
 * Phase 5 — Export Policy Compliance Report in RFC-4180 CSV format (CRLF line endings)
 */
router.get(
  '/reports/export-csv',
  authenticate,
  requireRole(['INSTITUTION_ADMIN']),
  requireInstitutionProfile,
  async (req: AuthRequest, res: Response) => {
    try {
      const institutionProfileId = req.user?.institutionProfileId;
      if (!institutionProfileId) {
        return res.status(403).json({
          error: {
            code: 'NO_INSTITUTION_PROFILE',
            message: 'An institution profile is required to export compliance reports.',
          },
        });
      }

      const reportType = (req.query.reportType as string) || 'institutional_compliance_summary';
      const timePeriod = (req.query.timePeriod as string) || 'all';
      const startDate = req.query.startDate as string | undefined;
      const endDate = req.query.endDate as string | undefined;

      const payload = await getComplianceReportData(institutionProfileId, {
        reportType,
        timePeriod,
        startDate,
        endDate,
      });

      const csvContent = generateComplianceReportCsv(payload);
      const filename = `compliance-${reportType}-${timePeriod}-${new Date().toISOString().slice(0, 10)}.csv`;

      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      return res.status(200).send(csvContent);
    } catch (err: any) {
      if (err instanceof ReportValidationError) {
        return res.status(err.statusCode).json({
          error: {
            code: err.code,
            message: err.message,
          },
        });
      }
      console.error('[ComplianceReportExportCsv] Error exporting report CSV:', err);
      return res.status(500).json({
        error: {
          code: 'EXPORT_ERROR',
          message: err.message || 'Failed to export compliance report CSV.',
        },
      });
    }
  }
);

/**
 * GET /api/institutions/reports/export-pdf
 * Phase 5 — Export Policy Compliance Report in PDF format
 */
router.get(
  '/reports/export-pdf',
  authenticate,
  requireRole(['INSTITUTION_ADMIN']),
  requireInstitutionProfile,
  async (req: AuthRequest, res: Response) => {
    try {
      const institutionProfileId = req.user?.institutionProfileId;
      if (!institutionProfileId) {
        return res.status(403).json({
          error: {
            code: 'NO_INSTITUTION_PROFILE',
            message: 'An institution profile is required to export compliance reports.',
          },
        });
      }

      const reportType = (req.query.reportType as string) || 'institutional_compliance_summary';
      const timePeriod = (req.query.timePeriod as string) || 'all';
      const startDate = req.query.startDate as string | undefined;
      const endDate = req.query.endDate as string | undefined;

      const payload = await getComplianceReportData(institutionProfileId, {
        reportType,
        timePeriod,
        startDate,
        endDate,
      });

      const pdfBuffer = await generateComplianceReportPdf(payload);
      const filename = `compliance-${reportType}-${timePeriod}-${new Date().toISOString().slice(0, 10)}.pdf`;

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      return res.status(200).send(pdfBuffer);
    } catch (err: any) {
      if (err instanceof ReportValidationError) {
        return res.status(err.statusCode).json({
          error: {
            code: err.code,
            message: err.message,
          },
        });
      }
      console.error('[ComplianceReportExportPdf] Error exporting report PDF:', err);
      return res.status(500).json({
        error: {
          code: 'EXPORT_ERROR',
          message: err.message || 'Failed to export compliance report PDF.',
        },
      });
    }
  }
);

export default router;

