import { NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';
import { getErrorMessage } from '@/src/lib/errors';
import { requireHouseholdUser } from '@/src/lib/auth';

const ACCOUNT_SELECT = { id: true, name: true, type: true, institution: true } as const;

export async function GET() {
  const auth = await requireHouseholdUser();
  if ('error' in auth) return auth.error;

  try {
    const [nodes, edges] = await Promise.all([
      prisma.mapNode.findMany({
        where: { householdId: auth.user.householdId },
        orderBy: { createdAt: 'asc' },
        include: { account: { select: ACCOUNT_SELECT } },
      }),
      prisma.mapEdge.findMany({
        where: { householdId: auth.user.householdId },
        orderBy: { createdAt: 'asc' },
      }),
    ]);

    return NextResponse.json({ status: 'ok', nodes, edges });
  } catch (error: unknown) {
    console.error('Failed to fetch map data:', error);
    return NextResponse.json(
      { status: 'error', message: getErrorMessage(error, 'Database error') },
      { status: 500 }
    );
  }
}
