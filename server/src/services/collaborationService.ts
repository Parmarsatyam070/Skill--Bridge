import { prisma } from '../config/prisma.js';
import { recordAuditLog } from './auditLogService.js';
import type {
  CollaborationSummaryDto,
  CollaborationDetailDto,
  CollaborationMessageDto,
  InstitutionCollaborationMetricsDto,
  StatusBreakdownDto,
  CollaborationFilterParams,
  CollaborationPartnerDto,
  CollaborationPartnersResponse,
  CreateCollaborationInput,
  UpdateCollaborationStatusInput,
} from '../../../shared/types.js';

// =========================================================================
// Status Normalization & Upcoming Calculations
// =========================================================================

/**
 * Normalizes raw/legacy status strings to canonical StatusBreakdownDto keys.
 */
export function normalizeStatus(rawStatus: string): keyof StatusBreakdownDto {
  const upper = (rawStatus || '').toUpperCase().trim();
  switch (upper) {
    case 'REQUESTED':
      return 'REQUESTED';
    case 'DISCUSSION':
    case 'UNDER_REVIEW':
      return 'DISCUSSION';
    case 'APPROVED':
    case 'ACCEPTED':
      return 'APPROVED';
    case 'ACTIVE':
    case 'IN_PROGRESS':
      return 'ACTIVE';
    case 'COMPLETED':
      return 'COMPLETED';
    case 'REJECTED':
      return 'REJECTED';
    case 'CANCELLED':
      return 'CANCELLED';
    default:
      return 'REQUESTED';
  }
}

/**
 * Deterministically determines if a collaboration qualifies as "upcoming".
 * Rules:
 * - Terminal statuses (COMPLETED, REJECTED, CANCELLED) cannot be upcoming.
 * - Future startDate qualifies if status is non-terminal.
 * - proposedDate qualifies ONLY if it starts with a valid ISO date (YYYY-MM-DD) that resolves in the future.
 * - Free-text strings (e.g. "Nov 15–20, 2026", "TBD", "Next semester") must NOT be parsed or guessed.
 * - Undated collaborations cannot be upcoming.
 */
export function isUpcoming(
  c: { status: string; startDate: Date | null; proposedDate: string | null },
  now: Date = new Date()
): boolean {
  const normStatus = normalizeStatus(c.status);
  if (normStatus === 'COMPLETED' || normStatus === 'REJECTED' || normStatus === 'CANCELLED') {
    return false;
  }

  // 1. Explicit future start date
  if (c.startDate) {
    return c.startDate.getTime() > now.getTime();
  }

  // 2. Strict ISO date check on proposedDate
  if (c.proposedDate) {
    const raw = c.proposedDate.trim();
    // Must strictly start with YYYY-MM-DD
    const isoDateMatch = raw.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (!isoDateMatch) {
      return false; // Free text strings are not parsed
    }

    const parsedDate = new Date(raw);
    if (isNaN(parsedDate.getTime())) {
      return false;
    }

    return parsedDate.getTime() > now.getTime();
  }

  return false;
}

// =========================================================================
// DTO Mappings
// =========================================================================

export function mapToSummaryDto(collab: any): CollaborationSummaryDto {
  return {
    id: collab.id,
    institutionId: collab.institutionId ?? null,
    companyId: collab.companyId,
    type: collab.type,
    title: collab.title,
    description: collab.description,
    skillsJson: collab.skillsJson ?? null,
    targetDepartment: collab.targetDepartment ?? null,
    proposedDate: collab.proposedDate ?? null,
    startDate: collab.startDate ? collab.startDate.toISOString() : null,
    endDate: collab.endDate ? collab.endDate.toISOString() : null,
    status: collab.status,
    initiatedByRole: collab.initiatedByRole,
    createdAt: collab.createdAt.toISOString(),
    updatedAt: collab.updatedAt.toISOString(),
    institution: collab.institution
      ? {
          id: collab.institution.id,
          institutionName: collab.institution.institutionName,
          adminDesignation: collab.institution.adminDesignation ?? null,
        }
      : null,
    company: {
      id: collab.company.id,
      companyName: collab.company.companyName,
      website: collab.company.website ?? null,
      industrySector: collab.company.industrySector ?? null,
    },
    _count: collab._count ? { messages: collab._count.messages } : undefined,
  };
}

export function mapToDetailDto(collab: any): CollaborationDetailDto {
  return {
    id: collab.id,
    institutionId: collab.institutionId ?? null,
    companyId: collab.companyId,
    type: collab.type,
    title: collab.title,
    description: collab.description,
    skillsJson: collab.skillsJson ?? null,
    targetDepartment: collab.targetDepartment ?? null,
    proposedDate: collab.proposedDate ?? null,
    startDate: collab.startDate ? collab.startDate.toISOString() : null,
    endDate: collab.endDate ? collab.endDate.toISOString() : null,
    status: collab.status,
    initiatedByRole: collab.initiatedByRole,
    createdAt: collab.createdAt.toISOString(),
    updatedAt: collab.updatedAt.toISOString(),
    institution: collab.institution
      ? {
          id: collab.institution.id,
          institutionName: collab.institution.institutionName,
          adminDesignation: collab.institution.adminDesignation ?? null,
        }
      : null,
    company: {
      id: collab.company.id,
      companyName: collab.company.companyName,
      website: collab.company.website ?? null,
      industrySector: collab.company.industrySector ?? null,
    },
    messages: (collab.messages || []).map((m: any) => ({
      id: m.id,
      collaborationId: m.collaborationId,
      senderUserId: m.senderUserId,
      senderUser: {
        id: m.senderUser.id,
        name: m.senderUser.name,
        avatarUrl: m.senderUser.avatarUrl ?? null,
        role: m.senderUser.role,
      },
      message: m.message,
      createdAt: m.createdAt.toISOString(),
    })),
  };
}

// =========================================================================
// Filter Helper
// =========================================================================

export function buildFilterWhereClause(filters?: CollaborationFilterParams) {
  const where: any = {};

  if (!filters) return where;

  if (filters.status && filters.status !== 'ALL') {
    const upper = filters.status.toUpperCase().trim();
    if (upper === 'DISCUSSION' || upper === 'UNDER_REVIEW') {
      where.status = { in: ['DISCUSSION', 'UNDER_REVIEW'] };
    } else if (upper === 'APPROVED' || upper === 'ACCEPTED') {
      where.status = { in: ['APPROVED', 'ACCEPTED'] };
    } else if (upper === 'ACTIVE' || upper === 'IN_PROGRESS') {
      where.status = { in: ['ACTIVE', 'IN_PROGRESS'] };
    } else {
      where.status = upper;
    }
  }

  if (filters.type && filters.type !== 'ALL') {
    where.type = filters.type.trim().toUpperCase();
  }

  if (filters.search && filters.search.trim().length > 0) {
    const term = filters.search.trim();
    where.AND = [
      ...(where.AND || []),
      {
        OR: [
          { title: { contains: term, mode: 'insensitive' } },
          { description: { contains: term, mode: 'insensitive' } },
          { targetDepartment: { contains: term, mode: 'insensitive' } },
          { company: { companyName: { contains: term, mode: 'insensitive' } } },
        ],
      },
    ];
  }

  return where;
}

// =========================================================================
// Core Business Logic: Query Services
// =========================================================================

/**
 * Authoritative Institution Collaboration retrieval.
 * Scoped strictly to institutionProfileId.
 */
export async function getInstitutionCollaborations(
  institutionProfileId: string,
  filters?: CollaborationFilterParams
): Promise<CollaborationSummaryDto[]> {
  if (!institutionProfileId) {
    throw new Error('institutionProfileId is required for institution collaboration queries.');
  }

  const baseWhere = buildFilterWhereClause(filters);
  const where = {
    ...baseWhere,
    institutionId: institutionProfileId, // Strict tenant scoping
  };

  const collabs = await prisma.collaboration.findMany({
    where,
    include: {
      institution: { select: { id: true, institutionName: true, adminDesignation: true } },
      company: { select: { id: true, companyName: true, website: true, industrySector: true } },
      _count: { select: { messages: true } },
    },
    orderBy: { updatedAt: 'desc' },
  });

  return collabs.map(mapToSummaryDto);
}

/**
 * Authoritative Industry Collaboration retrieval.
 * Scoped strictly to industryProfileId.
 */
export async function getIndustryCollaborations(
  industryProfileId: string,
  filters?: CollaborationFilterParams
): Promise<CollaborationSummaryDto[]> {
  if (!industryProfileId) {
    throw new Error('industryProfileId is required for industry collaboration queries.');
  }

  const baseWhere = buildFilterWhereClause(filters);
  const where = {
    ...baseWhere,
    companyId: industryProfileId,
  };

  const collabs = await prisma.collaboration.findMany({
    where,
    include: {
      institution: { select: { id: true, institutionName: true, adminDesignation: true } },
      company: { select: { id: true, companyName: true, website: true, industrySector: true } },
      _count: { select: { messages: true } },
    },
    orderBy: { updatedAt: 'desc' },
  });

  return collabs.map(mapToSummaryDto);
}

/**
 * Admin Collaboration retrieval (platform-wide).
 */
export async function getAllCollaborations(
  filters?: CollaborationFilterParams
): Promise<CollaborationSummaryDto[]> {
  const where = buildFilterWhereClause(filters);

  const collabs = await prisma.collaboration.findMany({
    where,
    include: {
      institution: { select: { id: true, institutionName: true, adminDesignation: true } },
      company: { select: { id: true, companyName: true, website: true, industrySector: true } },
      _count: { select: { messages: true } },
    },
    orderBy: { updatedAt: 'desc' },
  });

  return collabs.map(mapToSummaryDto);
}

/**
 * Helper to dispatch collaboration listing based on authenticated user context.
 */
export async function getCollaborationsForUser(
  user: { role: string; institutionProfileId?: string | null; industryProfileId?: string | null },
  filters?: CollaborationFilterParams
): Promise<CollaborationSummaryDto[]> {
  if (user.role === 'INSTITUTION_ADMIN') {
    if (!user.institutionProfileId) {
      throw { statusCode: 403, code: 'NO_INSTITUTION_PROFILE', message: 'Institution profile not found.' };
    }
    return getInstitutionCollaborations(user.institutionProfileId, filters);
  }

  if (user.role === 'INDUSTRY') {
    if (!user.industryProfileId) {
      throw { statusCode: 403, code: 'NO_INDUSTRY_PROFILE', message: 'Industry profile not found.' };
    }
    return getIndustryCollaborations(user.industryProfileId, filters);
  }

  if (user.role === 'ADMIN') {
    return getAllCollaborations(filters);
  }

  throw { statusCode: 403, code: 'FORBIDDEN', message: 'Access denied.' };
}

/**
 * Authoritative Institution Collaboration Metrics.
 * Computes deterministic totals, normalized status breakdown, upcoming counts, and type breakdown.
 */
export async function getInstitutionCollaborationMetrics(
  institutionProfileId: string
): Promise<InstitutionCollaborationMetricsDto> {
  if (!institutionProfileId) {
    throw new Error('institutionProfileId is required to compute metrics.');
  }

  const collabs = await prisma.collaboration.findMany({
    where: {
      institutionId: institutionProfileId, // Strict tenant scoping - null records excluded
    },
    select: {
      id: true,
      status: true,
      type: true,
      startDate: true,
      proposedDate: true,
    },
  });

  const statusBreakdown: StatusBreakdownDto = {
    REQUESTED: 0,
    DISCUSSION: 0,
    APPROVED: 0,
    ACTIVE: 0,
    COMPLETED: 0,
    REJECTED: 0,
    CANCELLED: 0,
  };

  const typeBreakdown: Record<string, number> = {};
  const totalCollaborations = collabs.length;
  let activeCollaborations = 0;
  let completedCollaborations = 0;
  let upcomingCollaborations = 0;

  const now = new Date();

  for (const c of collabs) {
    const norm = normalizeStatus(c.status);
    statusBreakdown[norm]++;

    if (norm === 'ACTIVE') {
      activeCollaborations++;
    } else if (norm === 'COMPLETED') {
      completedCollaborations++;
    }

    if (isUpcoming(c, now)) {
      upcomingCollaborations++;
    }

    const typeKey = (c.type || 'WORKSHOP').toUpperCase().trim();
    typeBreakdown[typeKey] = (typeBreakdown[typeKey] || 0) + 1;
  }

  return {
    totalCollaborations,
    activeCollaborations,
    upcomingCollaborations,
    completedCollaborations,
    statusBreakdown,
    typeBreakdown,
  };
}

/**
 * Retrieve single collaboration by ID with full detail and message history.
 * If institutionProfileId is supplied, validates that this institution owns the collaboration.
 */
export async function getCollaborationById(
  collaborationId: string,
  institutionProfileId?: string
): Promise<CollaborationDetailDto | null> {
  const collab = await prisma.collaboration.findUnique({
    where: { id: collaborationId },
    include: {
      institution: { select: { id: true, institutionName: true, adminDesignation: true } },
      company: { select: { id: true, companyName: true, website: true, industrySector: true } },
      messages: {
        include: {
          senderUser: { select: { id: true, name: true, avatarUrl: true, role: true } },
        },
        orderBy: { createdAt: 'asc' },
      },
    },
  });

  if (!collab) {
    return null;
  }

  // Tenant check if institutionProfileId is specified
  if (institutionProfileId && collab.institutionId !== institutionProfileId) {
    return null;
  }

  return mapToDetailDto(collab);
}

/**
 * Retrieve verified industry partners for Institution Admin discovery.
 * Exposes only safe fields (no recruiter email, phone, credentials, or PII).
 */
export async function getCollaborationPartners(
  _institutionProfileId?: string
): Promise<CollaborationPartnerDto[]> {
  const companies = await prisma.industryProfile.findMany({
    select: {
      id: true,
      companyName: true,
      website: true,
      industrySector: true,
    },
    orderBy: { companyName: 'asc' },
  });

  return companies.map((c) => ({
    industryProfileId: c.id,
    companyName: c.companyName,
    website: c.website ?? null,
    industrySector: c.industrySector ?? null,
  }));
}

/**
 * Partner discovery for all roles, preserving existing GET /api/collaborations/partners contract.
 */
export async function getPartnersForRole(
  role: string
): Promise<CollaborationPartnersResponse> {
  if (role === 'INDUSTRY') {
    const institutions = await prisma.institutionProfile.findMany({
      select: { id: true, institutionName: true, adminDesignation: true },
      orderBy: { institutionName: 'asc' },
    });
    return { institutions, companies: [] };
  } else if (role === 'INSTITUTION_ADMIN') {
    const companies = await prisma.industryProfile.findMany({
      select: { id: true, companyName: true, website: true, industrySector: true },
      orderBy: { companyName: 'asc' },
    });
    return { institutions: [], companies };
  } else if (role === 'ADMIN') {
    const [institutions, companies] = await Promise.all([
      prisma.institutionProfile.findMany({
        select: { id: true, institutionName: true, adminDesignation: true },
        orderBy: { institutionName: 'asc' },
      }),
      prisma.industryProfile.findMany({
        select: { id: true, companyName: true, website: true, industrySector: true },
        orderBy: { companyName: 'asc' },
      }),
    ]);
    return { institutions, companies };
  }

  return { institutions: [], companies: [] };
}

// =========================================================================
// Encapsulated Mutations
// =========================================================================

export interface CreateCollaborationParams {
  initiator: {
    userId: string;
    role: string;
    institutionProfileId?: string | null;
    industryProfileId?: string | null;
  };
  data: CreateCollaborationInput;
}

export async function createCollaboration(params: CreateCollaborationParams) {
  const { initiator, data } = params;

  let institutionId: string;
  let companyId: string;
  let initiatedByRole: string;

  if (initiator.role === 'INDUSTRY') {
    if (!initiator.industryProfileId) {
      throw { statusCode: 403, code: 'NO_INDUSTRY_PROFILE', message: 'Industry profile not found.' };
    }
    if (!data.institutionId) {
      throw { statusCode: 400, code: 'VALIDATION_ERROR', message: 'institutionId is required when initiating from Industry.' };
    }
    companyId = initiator.industryProfileId;
    institutionId = data.institutionId;
    initiatedByRole = 'INDUSTRY';
  } else if (initiator.role === 'INSTITUTION_ADMIN') {
    if (!initiator.institutionProfileId) {
      throw { statusCode: 403, code: 'NO_INSTITUTION_PROFILE', message: 'Institution profile not found.' };
    }
    if (!data.companyId) {
      throw { statusCode: 400, code: 'VALIDATION_ERROR', message: 'companyId is required when initiating from Institution.' };
    }
    institutionId = initiator.institutionProfileId;
    companyId = data.companyId;
    initiatedByRole = 'INSTITUTION_ADMIN';
  } else if (initiator.role === 'ADMIN') {
    if (!data.institutionId || !data.companyId) {
      throw { statusCode: 400, code: 'VALIDATION_ERROR', message: 'Admin must provide both institutionId and companyId.' };
    }
    institutionId = data.institutionId;
    companyId = data.companyId;
    initiatedByRole = 'ADMIN';
  } else {
    throw { statusCode: 403, code: 'FORBIDDEN', message: 'Role not permitted to initiate collaborations.' };
  }

  const [institutionExists, companyExists] = await Promise.all([
    prisma.institutionProfile.findUnique({ where: { id: institutionId }, select: { id: true } }),
    prisma.industryProfile.findUnique({ where: { id: companyId }, select: { id: true } }),
  ]);

  if (!institutionExists) {
    throw { statusCode: 404, code: 'NOT_FOUND', message: 'Institution not found.' };
  }
  if (!companyExists) {
    throw { statusCode: 404, code: 'NOT_FOUND', message: 'Company not found.' };
  }

  const created = await prisma.$transaction(async (tx) => {
    const collab = await tx.collaboration.create({
      data: {
        institutionId,
        companyId,
        type: data.type,
        title: data.title,
        description: data.description,
        skillsJson: data.skills ? JSON.stringify(data.skills) : null,
        targetDepartment: data.targetDepartment,
        proposedDate: data.proposedDate,
        status: 'REQUESTED',
        initiatedByRole,
      },
    });

    await recordAuditLog({
      userId: initiator.userId,
      action: 'CREATE_COLLABORATION',
      entity: 'Collaboration',
      entityId: collab.id,
      metadata: { type: data.type, title: data.title, initiatedByRole },
      tx,
    });

    return collab;
  });

  const full = await prisma.collaboration.findUnique({
    where: { id: created.id },
    include: {
      institution: { select: { id: true, institutionName: true } },
      company: { select: { id: true, companyName: true } },
    },
  });

  return full;
}

export interface UpdateCollaborationStatusParams {
  collaborationId: string;
  userId: string;
  data: UpdateCollaborationStatusInput;
  institutionProfileId?: string | null;
}

export async function updateCollaborationStatus(params: UpdateCollaborationStatusParams) {
  const { collaborationId, userId, data, institutionProfileId } = params;

  const existing = await prisma.collaboration.findUnique({
    where: { id: collaborationId },
    select: { id: true, institutionId: true, companyId: true },
  });

  if (!existing) {
    throw { statusCode: 404, code: 'NOT_FOUND', message: 'Collaboration request not found.' };
  }

  if (institutionProfileId && existing.institutionId !== institutionProfileId) {
    throw { statusCode: 403, code: 'FORBIDDEN_ACCESS', message: 'You are not a participant in this collaboration.' };
  }

  const updateData: any = { status: data.status };
  if (data.startDate) updateData.startDate = new Date(data.startDate);
  if (data.endDate) updateData.endDate = new Date(data.endDate);

  const updated = await prisma.$transaction(async (tx) => {
    const collab = await tx.collaboration.update({
      where: { id: collaborationId },
      data: updateData,
    });

    await recordAuditLog({
      userId,
      action: 'UPDATE_COLLABORATION_STATUS',
      entity: 'Collaboration',
      entityId: collaborationId,
      metadata: { newStatus: data.status },
      tx,
    });

    return collab;
  });

  return updated;
}

export interface AddCollaborationMessageParams {
  collaborationId: string;
  senderUserId: string;
  message: string;
}

export async function addCollaborationMessage(params: AddCollaborationMessageParams): Promise<CollaborationMessageDto> {
  const { collaborationId, senderUserId, message } = params;

  const created = await prisma.collaborationMessage.create({
    data: {
      collaborationId,
      senderUserId,
      message,
    },
    include: {
      senderUser: { select: { id: true, name: true, avatarUrl: true, role: true } },
    },
  });

  return {
    id: created.id,
    collaborationId: created.collaborationId,
    senderUserId: created.senderUserId,
    senderUser: {
      id: created.senderUser.id,
      name: created.senderUser.name,
      avatarUrl: created.senderUser.avatarUrl ?? null,
      role: created.senderUser.role,
    },
    message: created.message,
    createdAt: created.createdAt.toISOString(),
  };
}
