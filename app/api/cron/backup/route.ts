import { NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';
import { getErrorMessage } from '@/src/lib/errors';
import { createHouseholdSnapshot, pruneAutomaticSnapshots } from '@/src/lib/backup';

/**
 * Daily cron (see vercel.json) that snapshots every household's core
 * financial data automatically, so a real backup exists even if nobody
 * remembers to click "Create Snapshot" in Admin. Prunes each household's
 * automatic snapshots down to the most recent 14 afterward — manual
 * snapshots are never touched by this.
 *
 * Vercel sends `Authorization: Bearer ${CRON_SECRET}` automatically for
 * cron-triggered requests when the CRON_SECRET env var is set.
 */
export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ status: 'error', message: 'Unauthorized' }, { status: 401 });
    }
  }

  try {
    const households = await prisma.household.findMany({ select: { id: true } });

    let snapshotted = 0;
    let pruned = 0;

    for (const { id: householdId } of households) {
      await createHouseholdSnapshot(householdId, null, 'Automatic daily snapshot', true);
      snapshotted += 1;
      pruned += await pruneAutomaticSnapshots(householdId, 14);
    }

    return NextResponse.json({ status: 'ok', households: households.length, snapshotted, pruned });
  } catch (error: unknown) {
    console.error('Failed to run automatic backup cron:', error);
    return NextResponse.json(
      { status: 'error', message: getErrorMessage(error, 'Automatic backup failed') },
      { status: 500 }
    );
  }
}
