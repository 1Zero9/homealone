import { NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';
import { getErrorMessage } from '@/src/lib/errors';
import { requireHouseholdUser } from '@/src/lib/auth';

const MAX_LABEL_LENGTH = 60;

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireHouseholdUser();
  if ('error' in auth) return auth.error;

  try {
    const { id } = await params;
    const existing = await prisma.mapEdge.findUnique({ where: { id } });
    if (!existing || existing.householdId !== auth.user.householdId) {
      return NextResponse.json({ status: 'error', message: 'Edge not found' }, { status: 404 });
    }

    const body = await request.json();

    const data: { label?: string | null; amount?: number | null; currency?: string | null } = {};
    if (body.label !== undefined) {
      data.label = typeof body.label === 'string' && body.label.trim() ? body.label.trim().slice(0, MAX_LABEL_LENGTH) : null;
    }
    if (body.amount !== undefined) {
      data.amount = typeof body.amount === 'number' && body.amount > 0 ? body.amount : null;
    }
    if (body.currency !== undefined) {
      data.currency = typeof body.currency === 'string' && body.currency ? body.currency : null;
    }

    const updated = await prisma.mapEdge.update({ where: { id }, data });

    return NextResponse.json({ status: 'ok', edge: updated });
  } catch (error: unknown) {
    console.error('Failed to update map edge:', error);
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
    const existing = await prisma.mapEdge.findUnique({ where: { id } });
    if (!existing || existing.householdId !== auth.user.householdId) {
      return NextResponse.json({ status: 'error', message: 'Edge not found' }, { status: 404 });
    }

    await prisma.mapEdge.delete({ where: { id } });

    return NextResponse.json({ status: 'ok', deletedId: id });
  } catch (error: unknown) {
    console.error('Failed to delete map edge:', error);
    return NextResponse.json(
      { status: 'error', message: getErrorMessage(error, 'Failed to delete record') },
      { status: 500 }
    );
  }
}
