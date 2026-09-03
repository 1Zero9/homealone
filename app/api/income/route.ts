import { NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';
import { getErrorMessage } from '@/src/lib/errors';
import { requireHouseholdUser } from '@/src/lib/auth';

export async function GET() {
  const auth = await requireHouseholdUser();
  if ('error' in auth) return auth.error;

  try {
    const incomes = await prisma.income.findMany({
      where: { householdId: auth.user.householdId },
      orderBy: { createdAt: 'desc' },
      include: {
        createdBy: {
          select: { id: true, name: true, role: true },
        },
        depositAccount: {
          select: { id: true, name: true, type: true, institution: true },
        },
      },
    });

    return NextResponse.json({
      status: 'ok',
      incomes,
    });
  } catch (error: unknown) {
    console.error('Failed to fetch income from PostgreSQL:', error);
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

    const newIncome = await prisma.income.create({
      data: {
        name: body.name,
        amount: Number(body.amount),
        currency: body.currency || 'EUR',
        frequency: body.frequency || 'monthly',
        category: body.category || 'salary',
        isActive: typeof body.isActive === 'boolean' ? body.isActive : true,
        notes: body.notes || null,
        depositAccountId: body.depositAccountId || null,
        createdById: auth.user.id,
        householdId: auth.user.householdId,
      },
      include: {
        createdBy: {
          select: { id: true, name: true, role: true },
        },
        depositAccount: {
          select: { id: true, name: true, type: true, institution: true },
        },
      },
    });

    return NextResponse.json({
      status: 'ok',
      income: newIncome,
    });
  } catch (error: unknown) {
    console.error('Failed to create income:', error);
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
      return NextResponse.json(
        { status: 'error', message: 'Missing income id' },
        { status: 400 }
      );
    }

    const existing = await prisma.income.findUnique({ where: { id: body.id } });
    if (!existing || existing.householdId !== auth.user.householdId) {
      return NextResponse.json(
        { status: 'error', message: 'Income not found' },
        { status: 404 }
      );
    }

    const updatedIncome = await prisma.income.update({
      where: { id: body.id },
      data: {
        name: body.name,
        amount: Number(body.amount),
        currency: body.currency,
        frequency: body.frequency,
        category: body.category,
        isActive: typeof body.isActive === 'boolean' ? body.isActive : true,
        notes: body.notes || null,
        ...(body.depositAccountId !== undefined ? { depositAccountId: body.depositAccountId || null } : {}),
      },
      include: {
        createdBy: {
          select: { id: true, name: true, role: true },
        },
        depositAccount: {
          select: { id: true, name: true, type: true, institution: true },
        },
      },
    });

    return NextResponse.json({
      status: 'ok',
      income: updatedIncome,
    });
  } catch (error: unknown) {
    console.error('Failed to update income:', error);
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
      return NextResponse.json(
        { status: 'error', message: 'Missing id query parameter' },
        { status: 400 }
      );
    }

    const existing = await prisma.income.findUnique({ where: { id } });
    if (!existing || existing.householdId !== auth.user.householdId) {
      return NextResponse.json(
        { status: 'error', message: 'Income not found' },
        { status: 404 }
      );
    }

    await prisma.income.delete({
      where: { id },
    });

    return NextResponse.json({
      status: 'ok',
      deletedId: id,
    });
  } catch (error: unknown) {
    console.error('Failed to delete income:', error);
    return NextResponse.json(
      { status: 'error', message: getErrorMessage(error, 'Failed to delete record') },
      { status: 500 }
    );
  }
}
