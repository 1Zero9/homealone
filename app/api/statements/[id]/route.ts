import { NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';
import { getErrorMessage } from '@/src/lib/errors';
import { requireHouseholdUser } from '@/src/lib/auth';

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireHouseholdUser();
  if ('error' in auth) return auth.error;

  try {
    const { id } = await params;
    const body = await request.json();

    if (typeof body.label !== 'string' || !body.label.trim()) {
      return NextResponse.json({ status: 'error', message: 'Label is required' }, { status: 400 });
    }

    const existing = await prisma.statementImport.findUnique({ where: { id } });
    if (!existing || existing.householdId !== auth.user.householdId) {
      return NextResponse.json({ status: 'error', message: 'Statement import not found' }, { status: 404 });
    }

    const updated = await prisma.statementImport.update({
      where: { id },
      data: { label: body.label.trim() },
    });

    return NextResponse.json({ status: 'ok', import: updated });
  } catch (error: unknown) {
    console.error('Failed to rename statement import:', error);
    return NextResponse.json(
      { status: 'error', message: getErrorMessage(error, 'Failed to rename import') },
      { status: 500 }
    );
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireHouseholdUser();
  if ('error' in auth) return auth.error;

  try {
    const { id } = await params;
    const existing = await prisma.statementImport.findUnique({ where: { id } });
    if (!existing || existing.householdId !== auth.user.householdId) {
      return NextResponse.json({ status: 'error', message: 'Statement import not found' }, { status: 404 });
    }

    await prisma.statementImport.delete({ where: { id } });

    return NextResponse.json({ status: 'ok', deletedId: id });
  } catch (error: unknown) {
    console.error('Failed to delete statement import:', error);
    return NextResponse.json(
      { status: 'error', message: getErrorMessage(error, 'Failed to delete import') },
      { status: 500 }
    );
  }
}
