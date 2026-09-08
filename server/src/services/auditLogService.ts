import { prisma } from '../config/prisma.js';
import { Prisma } from '@prisma/client';

export interface AuditLogParams {
  userId?: string | null;
  action: string;
  entity: string;
  entityId?: string | null;
  metadata?: Record<string, any> | null;
  tx?: Prisma.TransactionClient;
}

/**
 * Records an immutable audit log entry for security, compliance, and activity auditing.
 * Preserves transactional integrity by supporting an optional Prisma TransactionClient.
 */
export async function recordAuditLog(params: AuditLogParams): Promise<void> {
  const { userId, action, entity, entityId, metadata, tx } = params;

  // Sanitize metadata to prevent logging sensitive secrets or tokens
  let metadataJson: string | null = null;
  if (metadata) {
    const sanitized = { ...metadata };
    delete sanitized.password;
    delete sanitized.token;
    delete sanitized.accessToken;
    delete sanitized.refreshToken;
    delete sanitized.secret;
    metadataJson = JSON.stringify(sanitized);
  }

  const client = tx || prisma;

  try {
    await client.auditLog.create({
      data: {
        userId: userId || null,
        action,
        entity,
        entityId: entityId || null,
        metadataJson,
      },
    });
  } catch (err) {
    // Non-blocking error logging for audit trails unless explicitly transactional
    console.error(`[AUDIT_LOG_ERROR] Failed to record audit log for action ${action}:`, err);
    if (tx) {
      throw err; // Re-throw in transaction to ensure rollback consistency
    }
  }
}
