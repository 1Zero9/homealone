import { NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';
import { getErrorMessage } from '@/src/lib/errors';
import { requireHouseholdUser } from '@/src/lib/auth';

const ACCOUNT_SELECT = { id: true, name: true, type: true, institution: true } as const;
const MAX_LABEL_LENGTH = 60;

export async function POST(request: Request) {
  const auth = await requireHouseholdUser();
  if ('error' in auth) return auth.error;

  try {
    const body = await request.json();

    const label = typeof body.label === 'string' ? body.label.trim().slice(0, MAX_LABEL_LENGTH) : '';
    if (!label) {
      return NextResponse.json({ status: 'error', message: 'A label is required' }, { status: 400 });
    }

    const accountId = typeof body.accountId === 'string' && body.accountId ? body.accountId : null;

    if (accountId) {
      const account = await prisma.account.findUnique({ where: { id: accountId } });
      if (!account || account.householdId !== auth.user.householdId) {
        return NextResponse.json({ status: 'error', message: 'Account not found' }, { status: 404 });
      }
    }

    const newNode = await prisma.mapNode.create({
      data: {
        label,
        kind: accountId ? 'ACCOUNT' : 'CUSTOM',
        accountId,
        color: typeof body.color === 'string' && body.color ? body.color : null,
        x: typeof body.x === 'number' ? body.x : 0,
        y: typeof body.y === 'number' ? body.y : 0,
        createdById: auth.user.id,
        householdId: auth.user.householdId,
      },
      include: { account: { select: ACCOUNT_SELECT } },
    });

    return NextResponse.json({ status: 'ok', node: newNode });
  } catch (error: unknown) {
    console.error('Failed to create map node:', error);
    return NextResponse.json(
      { status: 'error', message: getErrorMessage(error, 'Failed to create record') },
      { status: 500 }
    );
  }
}
