import { NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';
import { getErrorMessage } from '@/src/lib/errors';
import { requireHouseholdUser } from '@/src/lib/auth';
import { rolloverIfDue } from '@/src/lib/billing';
import type { BillingCycle } from '@/src/types/expense';

export async function GET() {
  const auth = await requireHouseholdUser();
  if ('error' in auth) return auth.error;

  try {
    const expenses = await prisma.expense.findMany({
      where: { householdId: auth.user.householdId },
      orderBy: { renewalDay: 'asc' },
      include: {
        createdBy: {
          select: { id: true, name: true, role: true },
        },
      },
    });

    // Lazily roll forward any bills whose due date has passed.
    const results = await Promise.all(
      expenses.map(async (expense) => {
        const rollover = rolloverIfDue({
          nextRenewalDate: expense.nextRenewalDate,
          billingCycle: expense.billingCycle as BillingCycle,
          isPaidThisCycle: expense.isPaidThisCycle,
        });

        if (!rollover.changed) return expense;

        return prisma.expense.update({
          where: { id: expense.id },
          data: {
            nextRenewalDate: rollover.nextRenewalDate,
            isPaidThisCycle: rollover.isPaidThisCycle,
          },
          include: {
            createdBy: {
              select: { id: true, name: true, role: true },
            },
          },
        });
      })
    );

    return NextResponse.json({
      status: 'ok',
      expenses: results,
    });
  } catch (error: unknown) {
    console.error('Failed to fetch expenses from PostgreSQL:', error);
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

    const newExpense = await prisma.expense.create({
      data: {
        name: body.name,
        amount: Number(body.amount),
        currency: body.currency || 'EUR',
        billingCycle: body.billingCycle || 'monthly',
        category: body.category || 'utilities',
        icon: body.icon || 'Zap',
        color: body.color || '#3155D9',
        renewalDay: Number(body.renewalDay) || 1,
        nextRenewalDate: body.nextRenewalDate || new Date().toISOString().split('T')[0],
        paymentMethod: body.paymentMethod || 'SEPA Direct Debit',
        isActive: typeof body.isActive === 'boolean' ? body.isActive : true,
        notes: body.notes || null,
        contractEndDate: body.contractEndDate || null,
        vendorEmail: body.vendorEmail || null,
        usageRating: body.usageRating || 'high',
        isVariable: typeof body.isVariable === 'boolean' ? body.isVariable : false,
        createdById: auth.user.id,
        householdId: auth.user.householdId,
      },
      include: {
        createdBy: {
          select: { id: true, name: true, role: true },
        },
      },
    });

    return NextResponse.json({
      status: 'ok',
      expense: newExpense,
    });
  } catch (error: unknown) {
    console.error('Failed to create expense:', error);
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
        { status: 'error', message: 'Missing expense id' },
        { status: 400 }
      );
    }

    const existing = await prisma.expense.findUnique({ where: { id: body.id } });
    if (!existing || existing.householdId !== auth.user.householdId) {
      return NextResponse.json(
        { status: 'error', message: 'Expense not found' },
        { status: 404 }
      );
    }

    // Toggling "paid this cycle" is handled explicitly so we can stamp lastPaidAt.
    const markingPaid = body.isPaidThisCycle === true && !existing.isPaidThisCycle;
    const markingUnpaid = body.isPaidThisCycle === false && existing.isPaidThisCycle;

    const updatedExpense = await prisma.expense.update({
      where: { id: body.id },
      data: {
        name: body.name,
        amount: Number(body.amount),
        currency: body.currency,
        billingCycle: body.billingCycle,
        category: body.category,
        icon: body.icon,
        color: body.color,
        renewalDay: Number(body.renewalDay),
        nextRenewalDate: body.nextRenewalDate,
        paymentMethod: body.paymentMethod,
        isActive: typeof body.isActive === 'boolean' ? body.isActive : true,
        notes: body.notes || null,
        contractEndDate: body.contractEndDate || null,
        vendorEmail: body.vendorEmail || null,
        usageRating: body.usageRating || 'high',
        isVariable: typeof body.isVariable === 'boolean' ? body.isVariable : false,
        ...(typeof body.isPaidThisCycle === 'boolean' ? { isPaidThisCycle: body.isPaidThisCycle } : {}),
        ...(markingPaid ? { lastPaidAt: new Date() } : {}),
        ...(markingUnpaid ? { lastPaidAt: null } : {}),
      },
      include: {
        createdBy: {
          select: { id: true, name: true, role: true },
        },
      },
    });

    return NextResponse.json({
      status: 'ok',
      expense: updatedExpense,
    });
  } catch (error: unknown) {
    console.error('Failed to update expense:', error);
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

    const existing = await prisma.expense.findUnique({ where: { id } });
    if (!existing || existing.householdId !== auth.user.householdId) {
      return NextResponse.json(
        { status: 'error', message: 'Expense not found' },
        { status: 404 }
      );
    }

    await prisma.expense.delete({
      where: { id },
    });

    return NextResponse.json({
      status: 'ok',
      deletedId: id,
    });
  } catch (error: unknown) {
    console.error('Failed to delete expense:', error);
    return NextResponse.json(
      { status: 'error', message: getErrorMessage(error, 'Failed to delete record') },
      { status: 500 }
    );
  }
}
