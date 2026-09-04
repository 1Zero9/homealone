import { NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';
import { getErrorMessage } from '@/src/lib/errors';
import { requireHouseholdUser } from '@/src/lib/auth';

const ACCOUNT_SELECT = { id: true, name: true, type: true, institution: true } as const;
const MAX_LABEL_LENGTH = 60;

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireHouseholdUser();
  if ('error' in auth) return auth.error;

  try {
    const { id } = await params;
    const existing = await prisma.mapNode.findUnique({ where: { id } });
    if (!existing || existing.householdId !== auth.user.householdId) {
      return NextResponse.json({ status: 'error', message: 'Node not found' }, { status: 404 });
    }

    const body = await request.json();

    const data: {
      label?: string;
      color?: string | null;
      x?: number;
      y?: number;
    } = {};

    if (typeof body.label === 'string' && body.label.trim()) {
      data.label = body.label.trim().slice(0, MAX_LABEL_LENGTH);
    }
    if (body.color !== undefined) {
      data.color = typeof body.color === 'string' && body.color ? body.color : null;
    }
    if (typeof body.x === 'number') data.x = body.x;
    if (typeof body.y === 'number') data.y = body.y;

    const updated = await prisma.mapNode.update({
      where: { id },
      data,
      include: { account: { select: ACCOUNT_SELECT } },
    });

    return NextResponse.json({ status: 'ok', node: updated });
  } catch (error: unknown) {
    console.error('Failed to update map node:', error);
    return NextResponse.json(
      { status: 'error', message: getErrorMessage(error, 'Failed to update record') },
      { status: 500 }
    );
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireHouseholdUser();
  if ('error' in auth) return auth.error;

  try {
    const { id } = await params;
    const existing = await prisma.mapNode.findUnique({ where: { id } });
    if (!existing || existing.householdId !== auth.user.householdId) {
      return NextResponse.json({ status: 'error', message: 'Node not found' }, { status: 404 });
    }

    await prisma.mapNode.delete({ where: { id } });

    return NextResponse.json({ status: 'ok', deletedId: id });
  } catch (error: unknown) {
    console.error('Failed to delete map node:', error);
    return NextResponse.json(
      { status: 'error', message: getErrorMessage(error, 'Failed to delete record') },
      { status: 500 }
    );
  }
}
