import { Router, Response } from 'express';
import { prisma } from '../config/prisma.js';
import { authenticate, AuthRequest } from '../middleware/auth.js';
import {
  requireIndustryProfile,
  requireInstitutionProfile,
  requireCollaborationAccess,
} from '../middleware/authorization.js';
import { recordAuditLog } from '../services/auditLogService.js';
import { z } from 'zod';

const router = Router();

// ------------- Validation Schemas -------------

const CreateCollaborationSchema = z.object({
  type: z.enum(['WORKSHOP', 'HACKATHON', 'MENTORSHIP', 'CURRICULUM', 'RESEARCH', 'PLACEMENT_DRIVE']).default('WORKSHOP'),
  title: z.string().min(3).max(200),
  description: z.string().min(10).max(5000),
  skills: z.array(z.string().max(100)).max(20).optional(),
  targetDepartment: z.string().max(200).optional(),
  proposedDate: z.string().max(100).optional(),
  institutionId: z.string().optional(), // Required for INDUSTRY initiating
  companyId: z.string().optional(),     // Required for INSTITUTION initiating
});

const UpdateCollaborationStatusSchema = z.object({
  status: z.enum(['REQUESTED', 'DISCUSSION', 'UNDER_REVIEW', 'APPROVED', 'ACCEPTED', 'ACTIVE', 'IN_PROGRESS', 'COMPLETED', 'REJECTED', 'CANCELLED']),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});

const SendMessageSchema = z.object({
  message: z.string().min(1).max(2000),
});

// ------------- ROUTES -------------

/**
 * GET /api/collaborations
 * List collaborations relevant to the authenticated user's role.
 */
router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Authentication required.' } });
    }

    let where: any = {};

    if (req.user.role === 'INDUSTRY' && req.user.industryProfileId) {
      where.companyId = req.user.industryProfileId;
    } else if (req.user.role === 'INSTITUTION_ADMIN' && req.user.institutionProfileId) {
      where.institutionId = req.user.institutionProfileId;
    } else if (req.user.role === 'ADMIN') {
      // Admin sees all
    } else {
      return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Access denied.' } });
    }

    const { status } = req.query;
    if (status) where.status = status;

    const collaborations = await prisma.collaboration.findMany({
      where,
      include: {
        institution: { select: { id: true, institutionName: true, adminDesignation: true } },
        company: { select: { id: true, companyName: true, website: true, industrySector: true } },
        _count: { select: { messages: true } },
      },
      orderBy: { updatedAt: 'desc' },
    });

    return res.json({ collaborations });
  } catch (err: any) {
    console.error('Error fetching collaborations:', err);
    return res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch collaborations.' } });
  }
});

/**
 * GET /api/collaborations/partners
 * List potential collaboration partners (Institutions for Industry, Companies for Institution Admins).
 */
router.get('/partners', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Authentication required.' } });
    }

    if (req.user.role === 'INDUSTRY') {
      const institutions = await prisma.institutionProfile.findMany({
        select: { id: true, institutionName: true, adminDesignation: true },
        orderBy: { institutionName: 'asc' },
      });
      return res.json({ institutions, companies: [] });
    } else if (req.user.role === 'INSTITUTION_ADMIN') {
      const companies = await prisma.industryProfile.findMany({
        select: { id: true, companyName: true, website: true, industrySector: true },
        orderBy: { companyName: 'asc' },
      });
      return res.json({ institutions: [], companies });
    } else if (req.user.role === 'ADMIN') {
      const [institutions, companies] = await Promise.all([
        prisma.institutionProfile.findMany({
          select: { id: true, institutionName: true },
          orderBy: { institutionName: 'asc' },
        }),
        prisma.industryProfile.findMany({
          select: { id: true, companyName: true },
          orderBy: { companyName: 'asc' },
        }),
      ]);
      return res.json({ institutions, companies });
    } else {
      return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Access denied.' } });
    }
  } catch (err: any) {
    console.error('Error fetching collaboration partners:', err);
    return res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch partners.' } });
  }
});

/**
 * GET /api/collaborations/:id
 * Get a single collaboration with messages.
 */
router.get('/:id', authenticate, requireCollaborationAccess, async (req: AuthRequest, res: Response) => {
  try {
    const collaboration = await prisma.collaboration.findUnique({
      where: { id: req.params.id },
      include: {
        institution: { select: { id: true, institutionName: true, adminDesignation: true } },
        company: { select: { id: true, companyName: true, website: true } },
        messages: {
          include: {
            senderUser: { select: { id: true, name: true, avatarUrl: true, role: true } },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!collaboration) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Collaboration not found.' } });
    }

    return res.json({ collaboration });
  } catch (err: any) {
    console.error('Error fetching collaboration:', err);
    return res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch collaboration.' } });
  }
});

/**
 * POST /api/collaborations
 * Create a new collaboration request.
 * Can be initiated by INDUSTRY (targeting an institution) or INSTITUTION (targeting a company).
 */
router.post('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Authentication required.' } });
    }

    if (req.user.role !== 'INDUSTRY' && req.user.role !== 'INSTITUTION_ADMIN' && req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Only Industry or Institution Admin users can initiate collaborations.' } });
    }

    const parseResult = CreateCollaborationSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        error: { code: 'VALIDATION_ERROR', message: parseResult.error.errors[0]?.message }
      });
    }

    const data = parseResult.data;

    let institutionId: string;
    let companyId: string;
    let initiatedByRole: string;

    if (req.user.role === 'INDUSTRY') {
      if (!req.user.industryProfileId) {
        return res.status(403).json({ error: { code: 'NO_INDUSTRY_PROFILE', message: 'Industry profile not found.' } });
      }
      if (!data.institutionId) {
        return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'institutionId is required when initiating from Industry.' } });
      }
      companyId = req.user.industryProfileId;
      institutionId = data.institutionId;
      initiatedByRole = 'INDUSTRY';
    } else if (req.user.role === 'INSTITUTION_ADMIN') {
      if (!req.user.institutionProfileId) {
        return res.status(403).json({ error: { code: 'NO_INSTITUTION_PROFILE', message: 'Institution profile not found.' } });
      }
      if (!data.companyId) {
        return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'companyId is required when initiating from Institution.' } });
      }
      institutionId = req.user.institutionProfileId;
      companyId = data.companyId;
      initiatedByRole = 'INSTITUTION_ADMIN';
    } else if (req.user.role === 'ADMIN') {
      // Admin must explicitly specify both parties
      if (!data.institutionId || !data.companyId) {
        return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Admin must provide both institutionId and companyId.' } });
      }
      institutionId = data.institutionId;
      companyId = data.companyId;
      initiatedByRole = 'ADMIN';
    } else {
      return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Role not permitted to initiate collaborations.' } });
    }

    // Verify both parties exist
    const [institutionExists, companyExists] = await Promise.all([
      prisma.institutionProfile.findUnique({ where: { id: institutionId }, select: { id: true } }),
      prisma.industryProfile.findUnique({ where: { id: companyId }, select: { id: true } }),
    ]);

    if (!institutionExists) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Institution not found.' } });
    }
    if (!companyExists) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Company not found.' } });
    }

    const collaboration = await prisma.$transaction(async (tx) => {
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
        userId: req.user!.id,
        action: 'CREATE_COLLABORATION',
        entity: 'Collaboration',
        entityId: collab.id,
        metadata: { type: data.type, title: data.title, initiatedByRole },
        tx,
      });

      return collab;
    });

    const full = await prisma.collaboration.findUnique({
      where: { id: collaboration.id },
      include: {
        institution: { select: { id: true, institutionName: true } },
        company: { select: { id: true, companyName: true } },
      },
    });

    return res.status(201).json({
      message: 'Collaboration request created.',
      collaboration: full,
    });
  } catch (err: any) {
    console.error('Error creating collaboration:', err);
    return res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to create collaboration.' } });
  }
});

/**
 * PATCH /api/collaborations/:id/status
 * Update collaboration status (both parties can update, e.g. accept, reject, complete).
 */
router.patch('/:id/status', authenticate, requireCollaborationAccess, async (req: AuthRequest, res: Response) => {
  try {
    const parseResult = UpdateCollaborationStatusSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        error: { code: 'VALIDATION_ERROR', message: parseResult.error.errors[0]?.message }
      });
    }

    const { status, startDate, endDate } = parseResult.data;
    const collaborationId = req.params.id;

    const updateData: any = { status };
    if (startDate) updateData.startDate = new Date(startDate);
    if (endDate) updateData.endDate = new Date(endDate);

    const updated = await prisma.$transaction(async (tx) => {
      const collab = await tx.collaboration.update({
        where: { id: collaborationId },
        data: updateData,
      });

      await recordAuditLog({
        userId: req.user!.id,
        action: 'UPDATE_COLLABORATION_STATUS',
        entity: 'Collaboration',
        entityId: collaborationId,
        metadata: { newStatus: status },
        tx,
      });

      return collab;
    });

    return res.json({ message: 'Collaboration status updated.', collaboration: updated });
  } catch (err: any) {
    console.error('Error updating collaboration status:', err);
    return res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to update status.' } });
  }
});

/**
 * POST /api/collaborations/:id/messages
 * Send a negotiation message in a collaboration thread.
 */
router.post('/:id/messages', authenticate, requireCollaborationAccess, async (req: AuthRequest, res: Response) => {
  try {
    const parseResult = SendMessageSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        error: { code: 'VALIDATION_ERROR', message: parseResult.error.errors[0]?.message }
      });
    }

    const message = await prisma.collaborationMessage.create({
      data: {
        collaborationId: req.params.id,
        senderUserId: req.user!.id,
        message: parseResult.data.message,
      },
      include: {
        senderUser: { select: { id: true, name: true, avatarUrl: true, role: true } },
      },
    });

    return res.status(201).json({ message });
  } catch (err: any) {
    console.error('Error sending collaboration message:', err);
    return res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to send message.' } });
  }
});

export default router;
