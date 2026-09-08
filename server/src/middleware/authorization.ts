import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth.js';
import { prisma } from '../config/prisma.js';

/**
 * 8-Step Request Pipeline Defensive Authorization Middleware
 *
 * Verifies req.user exists, validates role, checks profile existence,
 * validates target entity ownership, and prevents unauthorized cross-tenant mutations.
 */

export function requireStudentProfile(req: AuthRequest, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({
      error: { code: 'UNAUTHORIZED', message: 'Authentication required.' }
    });
  }

  if (req.user.role !== 'STUDENT' && req.user.role !== 'ADMIN') {
    return res.status(403).json({
      error: { code: 'FORBIDDEN', message: 'Access denied. Student role required.' }
    });
  }

  if (!req.user.studentProfileId && req.user.role !== 'ADMIN') {
    return res.status(403).json({
      error: { code: 'NO_STUDENT_PROFILE', message: 'Student profile not found for this account.' }
    });
  }

  return next();
}

export function requireIndustryProfile(req: AuthRequest, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({
      error: { code: 'UNAUTHORIZED', message: 'Authentication required.' }
    });
  }

  if (req.user.role !== 'INDUSTRY' && req.user.role !== 'ADMIN') {
    return res.status(403).json({
      error: { code: 'FORBIDDEN', message: 'Access denied. Industry role required.' }
    });
  }

  if (!req.user.industryProfileId && req.user.role !== 'ADMIN') {
    return res.status(403).json({
      error: { code: 'NO_INDUSTRY_PROFILE', message: 'Industry profile not found for this account.' }
    });
  }

  return next();
}

export function requireInstitutionProfile(req: AuthRequest, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Authentication required.' } });
  }
  // Role string in DB is INSTITUTION_ADMIN — not a generic "INSTITUTION" role
  if (req.user.role !== 'INSTITUTION_ADMIN' && req.user.role !== 'ADMIN') {
    return res.status(403).json({
      error: { code: 'FORBIDDEN', message: 'Access denied. Institution Admin role required.' }
    });
  }
  if (!req.user.institutionProfileId && req.user.role !== 'ADMIN') {
    return res.status(403).json({
      error: { code: 'NO_INSTITUTION_PROFILE', message: 'Institution profile not found for this account.' }
    });
  }
  return next();
}

export async function requireOpportunityOwnership(req: AuthRequest, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({
      error: { code: 'UNAUTHORIZED', message: 'Authentication required.' }
    });
  }

  if (req.user.role !== 'INDUSTRY' && req.user.role !== 'ADMIN') {
    return res.status(403).json({
      error: { code: 'FORBIDDEN', message: 'Access denied. Industry role required.' }
    });
  }

  if (!req.user.industryProfileId && req.user.role !== 'ADMIN') {
    return res.status(403).json({
      error: { code: 'NO_INDUSTRY_PROFILE', message: 'Industry profile not found for this account.' }
    });
  }

  const opportunityId = req.params.opportunityId || req.params.id;
  if (!opportunityId) {
    return res.status(400).json({
      error: { code: 'INVALID_REQUEST', message: 'Opportunity ID parameter is required.' }
    });
  }

  try {
    const opportunity = await prisma.opportunity.findUnique({
      where: { id: opportunityId },
      select: { id: true, companyId: true }
    });

    if (!opportunity) {
      return res.status(404).json({
        error: { code: 'NOT_FOUND', message: 'Opportunity not found.' }
      });
    }

    if (req.user.role !== 'ADMIN' && opportunity.companyId !== req.user.industryProfileId) {
      return res.status(403).json({
        error: { code: 'FORBIDDEN_OWNERSHIP', message: 'You do not have permission to modify this opportunity.' }
      });
    }

    return next();
  } catch (err: any) {
    console.error('Error verifying opportunity ownership:', err);
    return res.status(500).json({
      error: { code: 'INTERNAL_ERROR', message: 'Failed to verify resource ownership.' }
    });
  }
}

export async function requireCollaborationAccess(req: AuthRequest, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({
      error: { code: 'UNAUTHORIZED', message: 'Authentication required.' }
    });
  }

  const collaborationId = req.params.collaborationId || req.params.id;
  if (!collaborationId) {
    return res.status(400).json({
      error: { code: 'INVALID_REQUEST', message: 'Collaboration ID parameter is required.' }
    });
  }

  try {
    const collab = await prisma.collaboration.findUnique({
      where: { id: collaborationId },
      select: { id: true, institutionId: true, companyId: true }
    });

    if (!collab) {
      return res.status(404).json({
        error: { code: 'NOT_FOUND', message: 'Collaboration request not found.' }
      });
    }

    if (req.user.role === 'ADMIN') {
      return next();
    }

    const isInstitutionOwner = req.user.institutionProfileId && collab.institutionId === req.user.institutionProfileId;
    const isCompanyOwner = req.user.industryProfileId && collab.companyId === req.user.industryProfileId;

    if (!isInstitutionOwner && !isCompanyOwner) {
      return res.status(403).json({
        error: { code: 'FORBIDDEN_ACCESS', message: 'You are not a participant in this collaboration.' }
      });
    }

    return next();
  } catch (err: any) {
    console.error('Error verifying collaboration access:', err);
    return res.status(500).json({
      error: { code: 'INTERNAL_ERROR', message: 'Failed to verify collaboration access.' }
    });
  }
}
