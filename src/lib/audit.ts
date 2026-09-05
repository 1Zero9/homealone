import { prisma } from '@/src/lib/prisma';

/**
 * Records one entry in the household's activity trail. Deliberately
 * fire-and-forget (never blocks or fails the calling route) — an audit
 * entry is a nice-to-have record, not a transactional requirement, so a
 * logging failure should never turn a successful delete/restore/role-change
 * into an error response.
 */
export function logAudit(params: {
  householdId: string;
  actorId: string | null;
  actorName: string;
  action: string;
  entityType: string;
  entityLabel?: string | null;
}): void {
  prisma.auditLog
    .create({
      data: {
        householdId: params.householdId,
        actorId: params.actorId,
        actorName: params.actorName,
        action: params.action,
        entityType: params.entityType,
        entityLabel: params.entityLabel ?? null,
      },
    })
    .catch((err) => console.error('Failed to write audit log entry:', err));
}
