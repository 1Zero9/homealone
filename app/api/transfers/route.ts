import { NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';
import { getErrorMessage } from '@/src/lib/errors';
import { requireHouseholdUser } from '@/src/lib/auth';
import { logAudit } from '@/src/lib/audit';
import { formatCurrency } from '@/src/utils/formatters';
import type { CurrencyCode } from '@/src/types/expense';
import { findPossibleDuplicate } from '@/src/lib/duplicateGuard';

const ACCOUNT_SELECT = { id: true, name: true, type: true, institution: true } as const;

export async function GET() {
  const auth = await requireHouseholdUser();
  if ('error' in auth) return auth.error;

  try {
    const transfers = await prisma.transfer.findMany({
      where: { householdId: auth.user.householdId },
      orderBy: { date: 'desc' },
      include: {
        fromAccount: { select: ACCOUNT_SELECT },
        toAccount: { select: ACCOUNT_SELECT },
        linkedExpense: { select: { id: true, name: true } },
        linkedIncome: { select: { id: true, name: true } },
        createdBy: { select: { id: true, name: true, role: true } },
      },
    });

    return NextResponse.json({ status: 'ok', transfers });
  } catch (error: unknown) {
    console.error('Failed to fetch transfers from PostgreSQL:', error);
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

    if (!body.amount || Number(body.amount) <= 0) {
      return NextResponse.json({ status: 'error', message: 'A positive amount is required' }, { status: 400 });
    }
    if (!body.date) {
      return NextResponse.json({ status: 'error', message: 'Date is required' }, { status: 400 });
    }
    if (!body.fromAccountId && !body.toAccountId) {
      return NextResponse.json(
        { status: 'error', message: 'A transfer needs at least one internal account (source or destination)' },
        { status: 400 }
      );
    }

    // Only checked for standalone transfers — one tied to a recurring
    // Expense/Income (a "mark as paid" reconciliation transfer) is expected
    // to legitimately repeat the same amount every cycle, so checking those
    // against themselves month to month would just be noisy false positives.
    const possibleDuplicate =
      !body.linkedExpenseId && !body.linkedIncomeId
        ? await findPossibleDuplicate({
            householdId: auth.user.householdId as string,
            amount: Number(body.amount),
            currency: body.currency || 'EUR',
            date: body.date,
            accountId: body.fromAccountId || body.toAccountId || null,
          })
        : null;

    const newTransfer = await prisma.transfer.create({
      data: {
        amount: Number(body.amount),
        currency: body.currency || 'EUR',
        date: body.date,
        note: body.note || null,
        externalLabel: body.externalLabel || null,
        fromAccountId: body.fromAccountId || null,
        toAccountId: body.toAccountId || null,
        linkedExpenseId: body.linkedExpenseId || null,
        linkedIncomeId: body.linkedIncomeId || null,
        createdById: auth.user.id,
        householdId: auth.user.householdId,
      },
      include: {
        fromAccount: { select: ACCOUNT_SELECT },
        toAccount: { select: ACCOUNT_SELECT },
        linkedExpense: { select: { id: true, name: true } },
        linkedIncome: { select: { id: true, name: true } },
        createdBy: { select: { id: true, name: true, role: true } },
      },
    });

    return NextResponse.json({ status: 'ok', transfer: newTransfer, possibleDuplicate });
  } catch (error: unknown) {
    console.error('Failed to create transfer:', error);
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
      return NextResponse.json({ status: 'error', message: 'Missing transfer id' }, { status: 400 });
    }

    const existing = await prisma.transfer.findUnique({ where: { id: body.id } });
    if (!existing || existing.householdId !== auth.user.householdId) {
      return NextResponse.json({ status: 'error', message: 'Transfer not found' }, { status: 404 });
    }

    const updated = await prisma.transfer.update({
      where: { id: body.id },
      data: {
        amount: body.amount !== undefined ? Number(body.amount) : existing.amount,
        currency: body.currency ?? existing.currency,
        date: body.date ?? existing.date,
        note: body.note !== undefined ? body.note || null : existing.note,
        externalLabel: body.externalLabel !== undefined ? body.externalLabel || null : existing.externalLabel,
        fromAccountId: body.fromAccountId !== undefined ? body.fromAccountId || null : existing.fromAccountId,
        toAccountId: body.toAccountId !== undefined ? body.toAccountId || null : existing.toAccountId,
        linkedExpenseId: body.linkedExpenseId !== undefined ? body.linkedExpenseId || null : existing.linkedExpenseId,
        linkedIncomeId: body.linkedIncomeId !== undefined ? body.linkedIncomeId || null : existing.linkedIncomeId,
      },
      include: {
        fromAccount: { select: ACCOUNT_SELECT },
        toAccount: { select: ACCOUNT_SELECT },
        linkedExpense: { select: { id: true, name: true } },
        linkedIncome: { select: { id: true, name: true } },
        createdBy: { select: { id: true, name: true, role: true } },
      },
    });

    return NextResponse.json({ status: 'ok', transfer: updated });
  } catch (error: unknown) {
    console.error('Failed to update transfer:', error);
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

    const existing = await prisma.transfer.findUnique({ where: { id } });
    if (!existing || existing.householdId !== auth.user.householdId) {
      return NextResponse.json({ status: 'error', message: 'Transfer not found' }, { status: 404 });
    }

    await prisma.transfer.delete({ where: { id } });

    logAudit({
      householdId: auth.user.householdId as string,
      actorId: auth.user.id,
      actorName: auth.user.name,
      action: 'DELETE',
      entityType: 'Transfer',
      entityLabel: existing.externalLabel || existing.note || formatCurrency(existing.amount, existing.currency as CurrencyCode),
    });

    return NextResponse.json({ status: 'ok', deletedId: id });
  } catch (error: unknown) {
    console.error('Failed to delete transfer:', error);
    return NextResponse.json(
      { status: 'error', message: getErrorMessage(error, 'Failed to delete record') },
      { status: 500 }
    );
  }
}
