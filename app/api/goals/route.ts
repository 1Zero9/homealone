import { NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';
import { getErrorMessage } from '@/src/lib/errors';
import { requireHouseholdUser } from '@/src/lib/auth';
import { logAudit } from '@/src/lib/audit';

const ACCOUNT_SELECT = { id: true, name: true, type: true, institution: true } as const;

export async function GET() {
  const auth = await requireHouseholdUser();
  if ('error' in auth) return auth.error;

  try {
    const goals = await prisma.goal.findMany({
      where: { householdId: auth.user.householdId },
      orderBy: { createdAt: 'asc' },
      include: {
        linkedAccount: { select: ACCOUNT_SELECT },
        createdBy: { select: { id: true, name: true, role: true } },
      },
    });

    return NextResponse.json({ status: 'ok', goals });
  } catch (error: unknown) {
    console.error('Failed to fetch goals from PostgreSQL:', error);
    return NextResponse.json(
      { status: 'error', message: getErrorMessage(error, 'Database error') },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const auth = await requireHouseholdUser();
  if ('error' in auth) return auth.error;

  try {
    const body = await request.json();

    if (!body.name || typeof body.name !== 'string') {
      return NextResponse.json({ status: 'error', message: 'Goal name is required' }, { status: 400 });
    }
    if (!body.targetAmount || Number(body.targetAmount) <= 0) {
      return NextResponse.json({ status: 'error', message: 'A positive target amount is required' }, { status: 400 });
    }

    const newGoal = await prisma.goal.create({
      data: {
        name: body.name,
        targetAmount: Number(body.targetAmount),
        currentAmount: body.currentAmount != null ? Number(body.currentAmount) : 0,
        currency: body.currency || 'EUR',
        targetDate: body.targetDate || null,
        notes: body.notes || null,
        isActive: typeof body.isActive === 'boolean' ? body.isActive : true,
        linkedAccountId: body.linkedAccountId || null,
        createdById: auth.user.id,
        householdId: auth.user.householdId,
      },
      include: {
        linkedAccount: { select: ACCOUNT_SELECT },
        createdBy: { select: { id: true, name: true, role: true } },
      },
    });

    return NextResponse.json({ status: 'ok', goal: newGoal });
  } catch (error: unknown) {
    console.error('Failed to create goal:', error);
    return NextResponse.json(
      { status: 'error', message: getErrorMessage(error, 'Failed to create record') },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  const auth = await requireHouseholdUser();
  if ('error' in auth) return auth.error;

  try {
    const body = await request.json();
    if (!body.id) {
      return NextResponse.json({ status: 'error', message: 'Missing goal id' }, { status: 400 });
    }

    const existing = await prisma.goal.findUnique({ where: { id: body.id } });
    if (!existing || existing.householdId !== auth.user.householdId) {
      return NextResponse.json({ status: 'error', message: 'Goal not found' }, { status: 404 });
    }

    const updated = await prisma.goal.update({
      where: { id: body.id },
      data: {
        name: body.name ?? existing.name,
        targetAmount: body.targetAmount !== undefined ? Number(body.targetAmount) : existing.targetAmount,
        currentAmount: body.currentAmount !== undefined ? Number(body.currentAmount) : existing.currentAmount,
        currency: body.currency ?? existing.currency,
        targetDate: body.targetDate !== undefined ? body.targetDate || null : existing.targetDate,
        notes: body.notes !== undefined ? body.notes || null : existing.notes,
        isActive: typeof body.isActive === 'boolean' ? body.isActive : existing.isActive,
        linkedAccountId: body.linkedAccountId !== undefined ? body.linkedAccountId || null : existing.linkedAccountId,
      },
      include: {
        linkedAccount: { select: ACCOUNT_SELECT },
        createdBy: { select: { id: true, name: true, role: true } },
      },
    });

    return NextResponse.json({ status: 'ok', goal: updated });
  } catch (error: unknown) {
    console.error('Failed to update goal:', error);
    return NextResponse.json(
      { status: 'error', message: getErrorMessage(error, 'Failed to update record') },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  const auth = await requireHouseholdUser();
  if ('error' in auth) return auth.error;

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ status: 'error', message: 'Missing id query parameter' }, { status: 400 });
    }

    const existing = await prisma.goal.findUnique({ where: { id } });
    if (!existing || existing.householdId !== auth.user.householdId) {
      return NextResponse.json({ status: 'error', message: 'Goal not found' }, { status: 404 });
    }

    await prisma.goal.delete({ where: { id } });

    logAudit({
      householdId: auth.user.householdId as string,
      actorId: auth.user.id,
      actorName: auth.user.name,
      action: 'DELETE',
      entityType: 'Goal',
      entityLabel: existing.name,
    });

    return NextResponse.json({ status: 'ok', deletedId: id });
  } catch (error: unknown) {
    console.error('Failed to delete goal:', error);
    return NextResponse.json(
      { status: 'error', message: getErrorMessage(error, 'Failed to delete record') },
      { status: 500 }
    );
  }
}
