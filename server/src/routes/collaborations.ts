import { Router, Response } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth.js';
import { requireCollaborationAccess } from '../middleware/authorization.js';
import { z } from 'zod';
import * as collaborationService from '../services/collaborationService.js';

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
 * List collaborations relevant to the authenticated user's role with search/status/type filters.
 */
router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Authentication required.' } });
    }

    const { status, type, search } = req.query;
    const filters = {
      status: typeof status === 'string' ? status : undefined,
      type: typeof type === 'string' ? type : undefined,
      search: typeof search === 'string' ? search : undefined,
    };

    const collaborations = await collaborationService.getCollaborationsForUser(req.user, filters);
    return res.json({ collaborations });
  } catch (err: any) {
    if (err.statusCode) {
      return res.status(err.statusCode).json({ error: { code: err.code, message: err.message } });
    }
    console.error('Error fetching collaborations:', err);
    return res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch collaborations.' } });
  }
});

/**
 * GET /api/collaborations/metrics
 * Compute deterministic aggregate metrics for the authenticated Institution Admin.
 */
router.get('/metrics', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Authentication required.' } });
    }

    if (req.user.role !== 'INSTITUTION_ADMIN' || !req.user.institutionProfileId) {
      return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Institution Admin profile required for metrics.' } });
    }

    const metrics = await collaborationService.getInstitutionCollaborationMetrics(req.user.institutionProfileId);
    return res.json({ metrics });
  } catch (err: any) {
    console.error('Error fetching collaboration metrics:', err);
    return res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch metrics.' } });
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

    if (req.user.role !== 'INDUSTRY' && req.user.role !== 'INSTITUTION_ADMIN' && req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Access denied.' } });
    }

    const partners = await collaborationService.getPartnersForRole(req.user.role);
    return res.json(partners);
  } catch (err: any) {
    console.error('Error fetching collaboration partners:', err);
    return res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch partners.' } });
  }
});

/**
 * GET /api/collaborations/:id
 * Get a single collaboration with messages, verifying participant authorization.
 */
router.get('/:id', authenticate, requireCollaborationAccess, async (req: AuthRequest, res: Response) => {
  try {
    const collaboration = await collaborationService.getCollaborationById(req.params.id);

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

    const parseResult = CreateCollaborationSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        error: { code: 'VALIDATION_ERROR', message: parseResult.error.errors[0]?.message }
      });
    }

    const full = await collaborationService.createCollaboration({
      initiator: {
        userId: req.user.id,
        role: req.user.role,
        institutionProfileId: req.user.institutionProfileId,
        industryProfileId: req.user.industryProfileId,
      },
      data: parseResult.data,
    });

    return res.status(201).json({
      message: 'Collaboration request created.',
      collaboration: full,
    });
  } catch (err: any) {
    if (err.statusCode) {
      return res.status(err.statusCode).json({ error: { code: err.code, message: err.message } });
    }
    console.error('Error creating collaboration:', err);
    return res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to create collaboration.' } });
  }
});

/**
 * PATCH /api/collaborations/:id/status
 * Update collaboration status (both authorized parties can update, e.g. accept, reject, complete).
 */
router.patch('/:id/status', authenticate, requireCollaborationAccess, async (req: AuthRequest, res: Response) => {
  try {
    const parseResult = UpdateCollaborationStatusSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        error: { code: 'VALIDATION_ERROR', message: parseResult.error.errors[0]?.message }
      });
    }

    const updated = await collaborationService.updateCollaborationStatus({
      collaborationId: req.params.id,
      userId: req.user!.id,
      data: parseResult.data,
      institutionProfileId: req.user?.role === 'INSTITUTION_ADMIN' ? req.user.institutionProfileId : undefined,
    });

    return res.json({ message: 'Collaboration status updated.', collaboration: updated });
  } catch (err: any) {
    if (err.statusCode) {
      return res.status(err.statusCode).json({ error: { code: err.code, message: err.message } });
    }
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

    const message = await collaborationService.addCollaborationMessage({
      collaborationId: req.params.id,
      senderUserId: req.user!.id,
      message: parseResult.data.message,
    });

    return res.status(201).json({ message });
  } catch (err: any) {
    console.error('Error sending collaboration message:', err);
    return res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to send message.' } });
  }
});

export default router;
