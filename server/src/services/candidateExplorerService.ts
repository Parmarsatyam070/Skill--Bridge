/**
 * candidateExplorerService.ts — Phase 2: Institution Admin Candidate Explorer
 *
 * Core service for the Institution Admin Candidate Explorer feature.
 * Handles candidate search, filtering, scoring, recommendations, tags, notes, and exports.
 *
 * Design Invariants & Security Hardening (N1–N9):
 *  - N1 (Strict Scoping & Fail-Closed): Candidate discovery STRICTLY requires
 *        student.institutionProfileId === authenticatedInstitutionProfileId.
 *        Institution name fallback is completely eliminated. Students with null
 *        institutionProfileId are excluded until verified.
 *  - N2 (Fail-Closed Detail Access): Every detail lookup verifies ownership. Foreign lookups return null (404).
 *  - N3 (Non-Operative Endorsements): Recommendations record institutional backing
 *        (CandidateRecommendation) but NEVER automatically create or mutate Applications.
 *  - N4 (Cached Match Lookups): Gap analysis reads exclusively from existing CandidateMatch cache.
 *  - N5 (Field-Level Privacy): Tags and Notes are institution-private — completely invisible
 *        to students, recruiters, and other institutions.
 *  - N6 (Safe Parameterized Queries): Filter queries use explicit Prisma parameterization.
 *  - N7 (Session-Safe Provisioning): Background/admin creation does not affect admin sessions.
 *  - N8 (Retention-Safe Recommendations): Recommendations use a shared batchId for auditability.
 *        Data retention policy: Opportunities use soft-closing (status: CLOSED); foreign keys protect
 *        institutional recommendation history from destructive cascades.
 *  - N9 (Role & Middleware Enforcement): All endpoints require verified InstitutionProfile.
 */

import { prisma } from '../config/prisma.js';

// ---------------------------------------------------------------------------
// Shared Types & DTOs
// ---------------------------------------------------------------------------

export interface CandidateFilterParams {
  /** Free-text search against name and email */
  search?: string;
  /** Comma-separated skill IDs */
  skillIds?: string[];
  /** Minimum average skill score */
  minSkillScore?: number;
  /** Minimum CGPA */
  minCgpa?: number;
  /** Target domain name or slug */
  targetDomain?: string;
  /** Graduation year */
  gradYear?: number;
  /** Minimum match score for a specific Opportunity */
  minMatchScore?: number;
  /** Filter by match score for this opportunityId */
  opportunityId?: string;
  /** Tags assigned by THIS institution */
  tags?: string[];
  /** Only include students who have applied to this opportunity */
  hasApplied?: boolean;
  /** Include students NOT matched to this opportunity (gap analysis) */
  includeUnapplied?: boolean;
  /** Pagination */
  page?: number;
  limit?: number;
}

export interface CandidateCard {
  studentProfileId: string;
  userId: string;
  name: string;
  email: string;
  avatarUrl?: string | null;
  institution: string;
  targetDomain: string;
  cgpa?: number | null;
  gradYear?: number | null;
  headline?: string | null;
  githubUsername?: string | null;
  linkedinUrl?: string | null;
  skillSummary: { skillId: string; skillName: string; score: number; verificationLevel: string }[];
  topSkillScore: number;
  applicationStatus?: string | null;
  matchScore?: number | null;
  tags: string[];
  hasNotes: boolean;
}

/** Privacy-safe, controlled candidate detail DTO (Requirement 6 & 7) */
export interface SanitizedCandidateDetail {
  studentProfileId: string;
  userId: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  institution: string;
  department: string; // targetDomain
  batch: number | null; // gradYear
  cgpa: number | null;
  headline: string | null;
  githubUsername: string | null;
  linkedinUrl: string | null;
  skills: Array<{
    skillId: string;
    skillName: string;
    score: number;
    verificationLevel: string;
    verifiedAt: Date | null;
    evidenceSummary: string | null;
  }>;
  assessments: Array<{
    id: string;
    title: string;
    score: number;
    completedAt: Date | null;
  }>;
  solvedDsaCount: number;
  applications: Array<{
    id: string;
    opportunityTitle: string;
    type: string;
    status: string;
    appliedAt: Date;
  }>;
  tags: string[];
  notes: Array<{
    id: string;
    authorId: string;
    note: string;
    createdAt: Date;
  }>;
  recommendations: Array<{
    id: string;
    opportunityId: string;
    opportunityTitle: string;
    companyName: string;
    status: string;
    createdAt: Date;
  }>;
}

export interface RecommendationPayload {
  institutionId: string;
  opportunityId: string;
  candidateIds: string[];
  notes?: string;
  recommendedBy: string; // User.id
}

// ---------------------------------------------------------------------------
// Scope Resolver (Server-Side Authenticated Context Only)
// ---------------------------------------------------------------------------

/**
 * Resolves InstitutionProfile from the authenticated user's ID.
 * Throws if the user has no linked InstitutionProfile.
 */
export async function resolveInstitutionProfile(adminUserId: string) {
  const profile = await prisma.institutionProfile.findUnique({
    where: { userId: adminUserId },
  });
  if (!profile) {
    throw new Error('INSTITUTION_PROFILE_NOT_FOUND');
  }
  return profile;
}

// ---------------------------------------------------------------------------
// Candidate Search & Filtering (Fail-Closed, N1)
// ---------------------------------------------------------------------------

/**
 * Searches candidates strictly belonging to the authenticated institution.
 * Requirement 1: Uses ONLY student.institutionProfileId === institution.id.
 * No fallback to institution-name matching.
 */
export async function searchCandidates(
  adminUserId: string,
  params: CandidateFilterParams
): Promise<{ candidates: CandidateCard[]; total: number; page: number; pages: number }> {
  const institution = await resolveInstitutionProfile(adminUserId);
  const page = Math.max(1, params.page || 1);
  const limit = Math.min(100, Math.max(1, params.limit || 20));
  const skip = (page - 1) * limit;

  // Strict fail-closed scoping: ONLY match institutionProfileId
  const institutionScopeFilter = {
    institutionProfileId: institution.id,
  };

  // Build skill score filter
  let skillScoreFilter: object | undefined;
  if (params.skillIds && params.skillIds.length > 0) {
    skillScoreFilter = {
      skillScores: {
        some: {
          skillId: { in: params.skillIds },
          score: { gte: params.minSkillScore ?? 0 },
        },
      },
    };
  } else if (params.minSkillScore && params.minSkillScore > 0) {
    skillScoreFilter = {
      skillScores: {
        some: {
          score: { gte: params.minSkillScore },
        },
      },
    };
  }

  // Build tag filter (institution-scoped, N5)
  let tagFilter: object | undefined;
  if (params.tags && params.tags.length > 0) {
    tagFilter = {
      candidateTags: {
        some: {
          institutionId: institution.id,
          tag: { in: params.tags },
        },
      },
    };
  }

  // Build opportunity match score filter
  let matchScoreFilter: object | undefined;
  if (params.opportunityId && params.minMatchScore != null) {
    matchScoreFilter = {
      candidateMatches: {
        some: {
          opportunityId: params.opportunityId,
          score: { gte: params.minMatchScore },
        },
      },
    };
  } else if (params.opportunityId && params.hasApplied) {
    matchScoreFilter = {
      applications: {
        some: {
          opportunityId: params.opportunityId,
        },
      },
    };
  }

  // User-level search filter (name / email)
  let userSearchFilter: object | undefined;
  if (params.search && params.search.trim().length > 0) {
    const term = params.search.trim();
    userSearchFilter = {
      user: {
        OR: [
          { name: { contains: term, mode: 'insensitive' as const } },
          { email: { contains: term, mode: 'insensitive' as const } },
        ],
      },
    };
  }

  const where: any = {
    AND: [
      institutionScopeFilter,
      ...(params.targetDomain ? [{ targetDomain: { contains: params.targetDomain, mode: 'insensitive' as const } }] : []),
      ...(params.minCgpa != null ? [{ cgpa: { gte: params.minCgpa } }] : []),
      ...(params.gradYear != null ? [{ gradYear: params.gradYear }] : []),
      ...(skillScoreFilter ? [skillScoreFilter] : []),
      ...(tagFilter ? [tagFilter] : []),
      ...(matchScoreFilter ? [matchScoreFilter] : []),
      ...(userSearchFilter ? [userSearchFilter] : []),
    ],
  };

  const [rawStudents, total] = await Promise.all([
    prisma.studentProfile.findMany({
      where,
      skip,
      take: limit,
      orderBy: { user: { name: 'asc' } },
      include: {
        user: { select: { id: true, name: true, email: true, avatarUrl: true } },
        skillScores: {
          include: { skill: { select: { id: true, name: true } } },
          orderBy: { score: 'desc' },
          take: 10,
        },
        candidateTags: {
          where: { institutionId: institution.id },
          select: { tag: true },
        },
        candidateNotes: {
          where: { institutionId: institution.id },
          select: { id: true },
          take: 1,
        },
        ...(params.opportunityId
          ? {
              applications: {
                where: { opportunityId: params.opportunityId },
                select: { status: true },
                take: 1,
              },
              candidateMatches: {
                where: { opportunityId: params.opportunityId },
                select: { score: true },
                take: 1,
              },
            }
          : {}),
      },
    }),
    prisma.studentProfile.count({ where }),
  ]);

  const candidates: CandidateCard[] = rawStudents.map((s: any) => {
    const skillSummary = s.skillScores.map((ss: any) => ({
      skillId: ss.skillId,
      skillName: ss.skill?.name || ss.skillId,
      score: Math.round(ss.score),
      verificationLevel: ss.verificationLevel,
    }));
    const top5Scores = skillSummary.slice(0, 5).map((ss: any) => ss.score);
    const topSkillScore = top5Scores.length > 0
      ? Math.round(top5Scores.reduce((a: number, b: number) => a + b, 0) / top5Scores.length)
      : 0;

    return {
      studentProfileId: s.id,
      userId: s.userId,
      name: s.user?.name || '—',
      email: s.user?.email || '—',
      avatarUrl: s.user?.avatarUrl || null,
      institution: s.institution,
      targetDomain: s.targetDomain,
      cgpa: s.cgpa ?? null,
      gradYear: s.gradYear ?? null,
      headline: s.headline ?? null,
      githubUsername: s.githubUsername ?? null,
      linkedinUrl: s.linkedinUrl ?? null,
      skillSummary,
      topSkillScore,
      applicationStatus: s.applications?.[0]?.status ?? null,
      matchScore: s.candidateMatches?.[0]?.score ?? null,
      tags: (s.candidateTags || []).map((t: any) => t.tag),
      hasNotes: (s.candidateNotes || []).length > 0,
    };
  });

  return {
    candidates,
    total,
    page,
    pages: Math.ceil(total / limit),
  };
}

// ---------------------------------------------------------------------------
// Candidate Detail View (Fail-Closed, Explicit Field Selection, N2, Req 6 & 7)
// ---------------------------------------------------------------------------

/**
 * Sanitizes verification evidence metadata.
 * Strips raw internal tokens, secret keys, or unrestricted private blobs.
 */
function sanitizeEvidence(evidenceJson: string | null): string | null {
  if (!evidenceJson) return null;
  try {
    const parsed = JSON.parse(evidenceJson);
    // Extract only authorized display fields
    const safeEvidence = {
      issuer: parsed.issuer || parsed.organization || parsed.authority || null,
      title: parsed.title || parsed.certificateName || null,
      issueDate: parsed.issueDate || parsed.verifiedAt || null,
      verifiedVia: parsed.verifiedVia || parsed.provider || null,
      badgeUrl: parsed.badgeUrl || parsed.credentialUrl || null,
    };
    return JSON.stringify(safeEvidence);
  } catch {
    return null;
  }
}

/**
 * Resolves candidate detail with strict institution scoping and explicit field selection.
 * Returns null if student does not belong to the institution (Fail-Closed, N2).
 */
export async function getCandidateDetail(
  adminUserId: string,
  studentProfileId: string
): Promise<SanitizedCandidateDetail | null> {
  const institution = await resolveInstitutionProfile(adminUserId);

  // N2 & Requirement 1: Verify student strictly belongs to this institution via institutionProfileId
  const student = await prisma.studentProfile.findFirst({
    where: {
      id: studentProfileId,
      institutionProfileId: institution.id,
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          avatarUrl: true,
        },
      },
      skillScores: {
        include: { skill: { select: { id: true, name: true } } },
        orderBy: { score: 'desc' },
      },
      assessmentAttempts: {
        orderBy: { startedAt: 'desc' },
        take: 10,
        select: {
          id: true,
          score: true,
          submittedAt: true,
          practiceSet: { select: { title: true } },
        },
      },
      dsaAttempts: {
        where: { status: 'SOLVED' },
        select: { id: true },
      },
      applications: {
        orderBy: { appliedAt: 'desc' },
        take: 10,
        include: {
          opportunity: { select: { id: true, title: true, type: true } },
          internship: { select: { id: true, title: true } },
        },
      },
      candidateTags: {
        where: { institutionId: institution.id },
        select: { tag: true },
      },
      candidateNotes: {
        where: { institutionId: institution.id },
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          authorId: true,
          note: true,
          createdAt: true,
        },
      },
      candidateRecommendations: {
        where: { institutionId: institution.id },
        include: {
          opportunity: {
            select: {
              id: true,
              title: true,
              company: { select: { companyName: true } },
            },
          },
        },
      },
    },
  });

  if (!student) {
    return null; // Fail-closed: caller maps to 404
  }

  // Construct explicit privacy-safe DTO
  return {
    studentProfileId: student.id,
    userId: student.userId,
    name: student.user?.name || '—',
    email: student.user?.email || '—',
    avatarUrl: student.user?.avatarUrl || null,
    institution: student.institution,
    department: student.targetDomain,
    batch: student.gradYear ?? null,
    cgpa: student.cgpa ?? null,
    headline: student.headline ?? null,
    githubUsername: student.githubUsername ?? null,
    linkedinUrl: student.linkedinUrl ?? null,
    skills: student.skillScores.map((ss) => ({
      skillId: ss.skillId,
      skillName: ss.skill?.name || ss.skillId,
      score: Math.round(ss.score),
      verificationLevel: ss.verificationLevel,
      verifiedAt: ss.verifiedAt,
      evidenceSummary: sanitizeEvidence(ss.verificationEvidenceJson),
    })),
    assessments: student.assessmentAttempts.map((att: any) => ({
      id: att.id,
      title: att.practiceSet?.title || 'Practice Assessment',
      score: Math.round(att.score),
      completedAt: att.submittedAt,
    })),
    solvedDsaCount: student.dsaAttempts.length,
    applications: student.applications.map((app) => ({
      id: app.id,
      opportunityTitle: app.opportunity?.title || app.internship?.title || 'Opportunity',
      type: app.opportunity?.type || 'INTERNSHIP',
      status: app.status,
      appliedAt: app.appliedAt,
    })),
    tags: student.candidateTags.map((t) => t.tag),
    notes: student.candidateNotes,
    recommendations: student.candidateRecommendations.map((r) => ({
      id: r.id,
      opportunityId: r.opportunityId,
      opportunityTitle: r.opportunity.title,
      companyName: r.opportunity.company?.companyName || 'Recruiter Partner',
      status: r.status,
      createdAt: r.createdAt,
    })),
  };
}

// ---------------------------------------------------------------------------
// Recommendations (Non-Operative, Scoped, N3, N8, Req 8 & 9)
// ---------------------------------------------------------------------------

/**
 * Creates CandidateRecommendation records for candidates against an Opportunity.
 * Invariants:
 *  - Verifies all candidates belong to the caller's institution (N1).
 *  - Non-operative endorsement: NEVER creates Applications (N3).
 *  - Recommends for OPEN opportunities only.
 */
export async function recommendCandidates(payload: RecommendationPayload) {
  const { institutionId, opportunityId, candidateIds, notes, recommendedBy } = payload;

  // Validate opportunity exists and is OPEN
  const opp = await prisma.opportunity.findFirst({
    where: { id: opportunityId, status: 'OPEN' },
    select: { id: true },
  });
  if (!opp) throw new Error('OPPORTUNITY_NOT_FOUND_OR_CLOSED');

  // Verify all candidateIds strictly belong to this institution (Fail-Closed)
  const ownedCandidates = await prisma.studentProfile.findMany({
    where: {
      id: { in: candidateIds },
      institutionProfileId: institutionId,
    },
    select: { id: true },
  });

  const ownedCandidateIds = new Set(ownedCandidates.map((c) => c.id));
  const validIdsToRecommend = candidateIds.filter((id) => ownedCandidateIds.has(id));

  if (validIdsToRecommend.length === 0) {
    throw new Error('NO_VALID_CANDIDATES_IN_INSTITUTION');
  }

  const batchId = crypto.randomUUID();

  const results = await Promise.allSettled(
    validIdsToRecommend.map((candidateId) =>
      prisma.candidateRecommendation.upsert({
        where: {
          institutionId_opportunityId_candidateId: {
            institutionId,
            opportunityId,
            candidateId,
          },
        },
        update: {
          notes: notes ?? undefined,
          recommendedBy,
          batchId,
          status: 'RECOMMENDED',
          updatedAt: new Date(),
        },
        create: {
          institutionId,
          opportunityId,
          candidateId,
          recommendedBy,
          notes: notes ?? undefined,
          status: 'RECOMMENDED',
          batchId,
        },
      })
    )
  );

  const succeeded = results.filter((r) => r.status === 'fulfilled').length;
  const failed = results.filter((r) => r.status === 'rejected').length;
  return { batchId, succeeded, failed };
}

/**
 * Returns all recommendations made by this institution.
 */
export async function getInstitutionRecommendations(
  adminUserId: string,
  params: { page?: number; limit?: number }
) {
  const institution = await resolveInstitutionProfile(adminUserId);
  const page = Math.max(1, params.page || 1);
  const limit = Math.min(100, Math.max(1, params.limit || 20));

  const [recs, total] = await Promise.all([
    prisma.candidateRecommendation.findMany({
      where: { institutionId: institution.id },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        opportunity: {
          select: {
            id: true,
            title: true,
            company: { select: { companyName: true } },
          },
        },
        candidate: {
          select: {
            id: true,
            targetDomain: true,
            cgpa: true,
            user: { select: { name: true, avatarUrl: true } },
          },
        },
      },
    }),
    prisma.candidateRecommendation.count({ where: { institutionId: institution.id } }),
  ]);

  return { recommendations: recs, total, page, pages: Math.ceil(total / limit) };
}

// ---------------------------------------------------------------------------
// Candidate Tags (Fail-Closed, Institution-Private, N5)
// ---------------------------------------------------------------------------

async function verifyStudentOwnership(institutionId: string, candidateId: string) {
  const student = await prisma.studentProfile.findFirst({
    where: { id: candidateId, institutionProfileId: institutionId },
    select: { id: true },
  });
  if (!student) {
    throw new Error('CANDIDATE_NOT_FOUND');
  }
}

export async function addTag(adminUserId: string, candidateId: string, tag: string) {
  const institution = await resolveInstitutionProfile(adminUserId);
  await verifyStudentOwnership(institution.id, candidateId);

  return prisma.candidateTag.upsert({
    where: {
      institutionId_candidateId_tag: {
        institutionId: institution.id,
        candidateId,
        tag: tag.trim(),
      },
    },
    update: {},
    create: {
      institutionId: institution.id,
      candidateId,
      tag: tag.trim(),
    },
  });
}

export async function removeTag(adminUserId: string, candidateId: string, tag: string) {
  const institution = await resolveInstitutionProfile(adminUserId);
  await verifyStudentOwnership(institution.id, candidateId);

  return prisma.candidateTag.deleteMany({
    where: {
      institutionId: institution.id,
      candidateId,
      tag: tag.trim(),
    },
  });
}

export async function getTags(adminUserId: string, candidateId: string) {
  const institution = await resolveInstitutionProfile(adminUserId);
  await verifyStudentOwnership(institution.id, candidateId);

  return prisma.candidateTag.findMany({
    where: { institutionId: institution.id, candidateId },
    orderBy: { createdAt: 'asc' },
  });
}

// ---------------------------------------------------------------------------
// Candidate Notes (Fail-Closed, Institution-Private, N5)
// ---------------------------------------------------------------------------

export async function addNote(adminUserId: string, candidateId: string, note: string) {
  const institution = await resolveInstitutionProfile(adminUserId);
  await verifyStudentOwnership(institution.id, candidateId);

  return prisma.candidateNote.create({
    data: {
      institutionId: institution.id,
      candidateId,
      authorId: adminUserId,
      note: note.trim(),
    },
  });
}

export async function deleteNote(adminUserId: string, noteId: string) {
  const institution = await resolveInstitutionProfile(adminUserId);
  const existing = await prisma.candidateNote.findFirst({
    where: { id: noteId, institutionId: institution.id },
  });
  if (!existing) throw new Error('NOTE_NOT_FOUND');
  return prisma.candidateNote.delete({ where: { id: noteId } });
}

// ---------------------------------------------------------------------------
// Saved Filters (Creator-Private Ownership, Req 4 & 5)
// ---------------------------------------------------------------------------

export async function saveFilter(
  adminUserId: string,
  name: string,
  filtersJson: string,
  visibility: 'PRIVATE' | 'INSTITUTION_SHARED' = 'PRIVATE'
) {
  const institution = await resolveInstitutionProfile(adminUserId);
  return prisma.savedCandidateFilter.create({
    data: {
      institutionId: institution.id,
      name: name.trim(),
      filtersJson,
      createdBy: adminUserId,
      visibility,
    },
  });
}

/**
 * Returns only filters created by the current admin OR explicitly shared with the institution.
 * Requirement 4 & 5: Admin A cannot see Admin B's private filters.
 */
export async function getSavedFilters(adminUserId: string) {
  const institution = await resolveInstitutionProfile(adminUserId);
  return prisma.savedCandidateFilter.findMany({
    where: {
      institutionId: institution.id,
      OR: [
        { createdBy: adminUserId },
        { visibility: 'INSTITUTION_SHARED' },
      ],
    },
    orderBy: { createdAt: 'desc' },
  });
}

/**
 * Deletes a filter only if createdBy === adminUserId (Requirement 5).
 * Admin B cannot delete Admin A's private filter.
 */
export async function deleteSavedFilter(adminUserId: string, filterId: string) {
  const institution = await resolveInstitutionProfile(adminUserId);
  const existing = await prisma.savedCandidateFilter.findFirst({
    where: { id: filterId, institutionId: institution.id },
  });
  if (!existing) {
    throw new Error('FILTER_NOT_FOUND');
  }
  if (existing.createdBy !== adminUserId) {
    throw new Error('FORBIDDEN_NOT_OWNER');
  }
  return prisma.savedCandidateFilter.delete({ where: { id: filterId } });
}

// ---------------------------------------------------------------------------
// Gap Analysis (Cached CandidateMatch, Fail-Closed, N4, Req 12)
// ---------------------------------------------------------------------------

/**
 * Identifies eligible candidates belonging to the institution who have NOT applied.
 * Reads exclusively from CandidateMatch cache (N4). Never mutates applications.
 */
export async function getGapAnalysis(
  adminUserId: string,
  opportunityId: string,
  minScore: number = 60
) {
  const institution = await resolveInstitutionProfile(adminUserId);

  // Set of applied student IDs for this opportunity
  const applied = await prisma.application.findMany({
    where: { opportunityId },
    select: { studentId: true },
  });
  const appliedSet = new Set(applied.map((a) => a.studentId));

  // Institution students (fail-closed, N1)
  const institutionStudents = await prisma.studentProfile.findMany({
    where: { institutionProfileId: institution.id },
    select: { id: true },
  });
  const institutionStudentIds = institutionStudents.map((s) => s.id);

  if (institutionStudentIds.length === 0) {
    return [];
  }

  const matches = await prisma.candidateMatch.findMany({
    where: {
      opportunityId,
      score: { gte: minScore },
      eligibility: true,
      candidateId: { in: institutionStudentIds },
    },
    include: {
      candidate: {
        include: {
          user: { select: { id: true, name: true, email: true, avatarUrl: true } },
        },
      },
    },
    orderBy: { score: 'desc' },
  });

  return matches
    .filter((m) => !appliedSet.has(m.candidateId))
    .map((m: any) => ({
      studentProfileId: m.candidateId,
      userId: m.candidate.userId,
      name: m.candidate.user?.name || '—',
      email: m.candidate.user?.email || '—',
      avatarUrl: m.candidate.user?.avatarUrl || null,
      institution: m.candidate.institution,
      targetDomain: m.candidate.targetDomain,
      matchScore: Math.round(m.score),
      eligibility: m.eligibility,
    }));
}

// ---------------------------------------------------------------------------
// Privacy-Safe Candidate CSV Export (Requirement 14)
// ---------------------------------------------------------------------------

/**
 * Exports candidate data scoped strictly to the institution into CSV format.
 * Zero passwords, tokens, auth data, or unrestricted documents.
 */
export async function exportCandidatesCsv(
  adminUserId: string,
  params: CandidateFilterParams
): Promise<string> {
  // Use searchCandidates with high limit to fetch institution-scoped candidates
  const { candidates } = await searchCandidates(adminUserId, {
    ...params,
    page: 1,
    limit: 1000,
  });

  const headers = [
    'Student ID',
    'Name',
    'Email',
    'Target Domain',
    'Graduation Year',
    'CGPA',
    'Top Skill Score',
    'Verified Skills',
    'Application Status',
    'Tags',
  ];

  const rows = candidates.map((c) => {
    const verifiedSkillsStr = c.skillSummary
      .map((s) => `${s.skillName} (${s.score} - ${s.verificationLevel})`)
      .join('; ');
    const tagsStr = c.tags.join('; ');

    return [
      `"${c.studentProfileId}"`,
      `"${(c.name || '').replace(/"/g, '""')}"`,
      `"${(c.email || '').replace(/"/g, '""')}"`,
      `"${(c.targetDomain || '').replace(/"/g, '""')}"`,
      c.gradYear ? String(c.gradYear) : '',
      c.cgpa ? c.cgpa.toFixed(2) : '',
      String(c.topSkillScore || 0),
      `"${verifiedSkillsStr.replace(/"/g, '""')}"`,
      `"${c.applicationStatus || 'Unapplied'}"`,
      `"${tagsStr.replace(/"/g, '""')}"`,
    ].join(',');
  });

  return [headers.join(','), ...rows].join('\n');
}
