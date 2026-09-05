import { prisma } from '@/src/lib/prisma';
import { Prisma } from '@prisma/client';

// A snapshot's payloadJson holds one plain array per table.
export interface BackupPayload {
  accounts?: Record<string, unknown>[];
  goals?: Record<string, unknown>[];
  expenses?: Record<string, unknown>[];
  incomes?: Record<string, unknown>[];
  transfers?: Record<string, unknown>[];
}

/**
 * Snapshots a household's core financial data (Account, Goal, Expense,
 * Income, Transfer) into a single DatabaseBackup row. Shared by the
 * admin-triggered POST /api/admin/backup route and the daily
 * GET /api/cron/backup route — the only difference between a manual and
 * an automatic snapshot is `isAutomatic` and who (if anyone) triggered it.
 */
export async function createHouseholdSnapshot(
  householdId: string,
  createdById: string | null,
  notes: string,
  isAutomatic = false
) {
  const [accounts, goals, expenses, incomes, transfers] = await Promise.all([
    prisma.account.findMany({ where: { householdId } }),
    prisma.goal.findMany({ where: { householdId } }),
    prisma.expense.findMany({ where: { householdId } }),
    prisma.income.findMany({ where: { householdId } }),
    prisma.transfer.findMany({ where: { householdId } }),
  ]);

  const payload: BackupPayload = { accounts, goals, expenses, incomes, transfers };
  const recordCount = accounts.length + goals.length + expenses.length + incomes.length + transfers.length;

  return prisma.databaseBackup.create({
    data: {
      createdById,
      householdId,
      payloadJson: payload as unknown as Prisma.InputJsonValue,
      recordCount,
      notes,
      isAutomatic,
    },
  });
}

/**
 * Deletes a household's oldest automatic snapshots beyond `keep` (default
 * 14, roughly two weeks of daily snapshots). Manual snapshots are never
 * touched here — only ones with isAutomatic: true count towards the cap.
 */
export async function pruneAutomaticSnapshots(householdId: string, keep = 14) {
  const stale = await prisma.databaseBackup.findMany({
    where: { householdId, isAutomatic: true },
    orderBy: { createdAt: 'desc' },
    skip: keep,
    select: { id: true },
  });

  if (stale.length === 0) return 0;

  await prisma.databaseBackup.deleteMany({
    where: { id: { in: stale.map((b) => b.id) } },
  });

  return stale.length;
}
