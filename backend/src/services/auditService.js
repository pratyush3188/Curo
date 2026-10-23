import { AuditLog } from '../models/AuditLog.js';
import { logger } from '../utils/logger.js';

/**
 * Service to record administrative platform events into MongoDB
 */
export const recordAuditLog = async ({
  actorId,
  actorName,
  action,
  targetType,
  targetId = 'all',
  targetName = '',
  outcome = 'info',
  details = '',
  ipAddress = '',
  userAgent = '',
  metadata = {},
}) => {
  try {
    // Sanitize any potential secret or token
    const sanitizedMetadata = { ...metadata };
    delete sanitizedMetadata.password;
    delete sanitizedMetadata.passwordHash;
    delete sanitizedMetadata.token;
    delete sanitizedMetadata.tokenHash;

    const log = await AuditLog.create({
      actorId: actorId ? actorId.toString() : 'system',
      actorName: actorName || 'System',
      action,
      targetType,
      targetId: targetId ? targetId.toString() : 'all',
      targetName,
      outcome,
      details,
      ipAddress,
      userAgent,
      metadata: sanitizedMetadata,
      timestamp: new Date(),
    });

    return log;
  } catch (err) {
    logger.error(`Failed to write audit log [${action}]: ${err.message}`);
    // Non-blocking so business transaction does not fail if audit logging encounters an issue
    return null;
  }
};
