import { NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';
import { getErrorMessage } from '@/src/lib/errors';
import { requireAdmin } from '@/src/lib/auth';

export async function GET() {
  const auth = await requireAdmin();
  if ('error' in auth) return auth.error;

  try {
    const entries = await prisma.auditLog.findMany({
      where: { householdId: auth.user.householdId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return NextResponse.json({ status: 'ok', entries });
  } catch (error: unknown) {
    console.error('Failed to fetch audit log:', error);
    return NextResponse.json(
      { status: 'error', message: getErrorMessage(error, 'Database error') },
      { status: 500 }
    );
  }
}
