import { NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';
import { getErrorMessage } from '@/src/lib/errors';
import { requireHouseholdUser } from '@/src/lib/auth';
import { buildAliasPattern } from '@/src/lib/statementMatching';
import { CATEGORIES } from '@/src/data/categories';
import type { ExpenseCategory } from '@/src/types/expense';

const TX_INCLUDE = {
  matchedExpense: { select: { id: true, name: true, vendor: true, category: true } },
  matchedTransfer: { select: { id: true, externalLabel: true } },
} as const;

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string; txId: string }> }
) {
  const auth = await requireHouseholdUser();
  if ('error' in auth) return auth.error;

  try {
    const { id, txId } = await params;
    const body = await request.json();
    const action = body.action as string;

    const tx = await prisma.statementTransaction.findUnique({ where: { id: txId } });
    if (!tx || tx.householdId !== auth.user.householdId || tx.importId !== id) {
      return NextResponse.json({ status: 'error', message: 'Statement transaction not found' }, { status: 404 });
    }

    if (action === 'ignore') {
      const updated = await prisma.statementTransaction.update({
        where: { id: txId },
        data: { status: 'IGNORED', matchedExpenseId: null, matchedTransferId: null, matchConfidence: null },
        include: TX_INCLUDE,
      });
      return NextResponse.json({ status: 'ok', transaction: updated });
    }

    if (action === 'reset') {
      const updated = await prisma.statementTransaction.update({
        where: { id: txId },
        data: { status: 'UNMATCHED', matchedExpenseId: null, matchedTransferId: null, matchConfidence: null },
        include: TX_INCLUDE,
      });
      return NextResponse.json({ status: 'ok', transaction: updated });
    }

    if (action === 'confirm' && !tx.matchedExpenseId && tx.matchedTransferId) {
      // A suggested transfer match (not an expense) — the Transfer already
      // exists, so confirming just accepts the suggested link.
      const updated = await prisma.statementTransaction.update({
        where: { id: txId },
        data: { status: 'MATCHED', matchConfidence: tx.matchConfidence ?? 1 },
        include: TX_INCLUDE,
      });
      return NextResponse.json({ status: 'ok', transaction: updated });
    }

    if (action === 'confirm' || action === 'link_expense') {
      const expenseId = action === 'confirm' ? tx.matchedExpenseId : body.expenseId;
      if (!expenseId) {
        return NextResponse.json({ status: 'error', message: 'An expense must be selected' }, { status: 400 });
      }

      const expense = await prisma.expense.findUnique({ where: { id: expenseId } });
      if (!expense || expense.householdId !== auth.user.householdId) {
        return NextResponse.json({ status: 'error', message: 'Expense not found' }, { status: 404 });
      }

      const updated = await prisma.statementTransaction.update({
        where: { id: txId },
        data: { status: 'MATCHED', matchedExpenseId: expense.id, matchedTransferId: null, matchConfidence: 1 },
        include: TX_INCLUDE,
      });

      if (body.learnAlias !== false) {
        const pattern = buildAliasPattern(tx.normalizedDescription);
        if (pattern && auth.user.householdId) {
          await prisma.merchantAlias.upsert({
            where: { householdId_pattern: { householdId: auth.user.householdId, pattern } },
            create: {
              householdId: auth.user.householdId,
              pattern,
              vendorName: expense.vendor || expense.name,
              category: expense.category,
              expenseId: expense.id,
              matchCount: 1,
            },
            update: {
              expenseId: expense.id,
              vendorName: expense.vendor || expense.name,
              category: expense.category,
              matchCount: { increment: 1 },
            },
          });
        }
      }

      return NextResponse.json({ status: 'ok', transaction: updated });
    }

    if (action === 'log_transfer') {
      const vendorName = typeof body.vendorName === 'string' && body.vendorName.trim() ? body.vendorName.trim() : tx.rawDescription;

      const transfer = await prisma.transfer.create({
        data: {
          amount: tx.amount,
          currency: tx.currency,
          date: tx.date,
          note: 'Logged from statement import',
          externalLabel: vendorName,
          createdById: auth.user.id,
          householdId: auth.user.householdId,
        },
      });

      const updated = await prisma.statementTransaction.update({
        where: { id: txId },
        data: { status: 'MATCHED', matchedTransferId: transfer.id, matchedExpenseId: null, matchConfidence: 1 },
        include: TX_INCLUDE,
      });

      if (body.learnAlias && auth.user.householdId) {
        const pattern = buildAliasPattern(tx.normalizedDescription);
        if (pattern) {
          await prisma.merchantAlias.upsert({
            where: { householdId_pattern: { householdId: auth.user.householdId, pattern } },
            create: { householdId: auth.user.householdId, pattern, vendorName, matchCount: 1 },
            update: { vendorName, matchCount: { increment: 1 } },
          });
        }
      }

      return NextResponse.json({ status: 'ok', transaction: updated, transfer });
    }

    if (action === 'categorize') {
      const category = typeof body.category === 'string' ? (body.category as ExpenseCategory) : null;
      if (!category || !CATEGORIES[category]) {
        return NextResponse.json({ status: 'error', message: 'A valid category must be selected' }, { status: 400 });
      }

      const vendorName = typeof body.vendorName === 'string' && body.vendorName.trim() ? body.vendorName.trim() : tx.rawDescription;
      const meta = CATEGORIES[category];
      const statementImport = await prisma.statementImport.findUnique({ where: { id: tx.importId } });
      const dayOfMonth = new Date(tx.date).getDate();

      const expense = await prisma.expense.create({
        data: {
          name: vendorName,
          vendor: vendorName,
          amount: tx.amount,
          currency: tx.currency,
          billingCycle: 'once',
          category,
          icon: meta.icon,
          color: meta.color,
          renewalDay: Number.isFinite(dayOfMonth) && dayOfMonth > 0 ? dayOfMonth : 1,
          nextRenewalDate: tx.date,
          isActive: true,
          isPaidThisCycle: true,
          lastPaidAt: new Date(tx.date),
          paymentAccountId: statementImport?.accountId ?? null,
          notes: 'Logged from statement import',
          createdById: auth.user.id,
          householdId: auth.user.householdId,
        },
      });

      const updated = await prisma.statementTransaction.update({
        where: { id: txId },
        data: { status: 'MATCHED', matchedExpenseId: expense.id, matchedTransferId: null, matchConfidence: 1 },
        include: TX_INCLUDE,
      });

      if (body.learnAlias !== false && auth.user.householdId) {
        const pattern = buildAliasPattern(tx.normalizedDescription);
        if (pattern) {
          await prisma.merchantAlias.upsert({
            where: { householdId_pattern: { householdId: auth.user.householdId, pattern } },
            create: { householdId: auth.user.householdId, pattern, vendorName, category, matchCount: 1 },
            update: { vendorName, category, matchCount: { increment: 1 } },
          });
        }
      }

      return NextResponse.json({ status: 'ok', transaction: updated, expense });
    }

    return NextResponse.json({ status: 'error', message: 'Unknown action' }, { status: 400 });
  } catch (error: unknown) {
    console.error('Failed to resolve statement transaction:', error);
    return NextResponse.json(
      { status: 'error', message: getErrorMessage(error, 'Failed to update transaction') },
      { status: 500 }
    );
  }
}
