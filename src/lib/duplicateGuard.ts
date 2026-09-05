import { prisma } from '@/src/lib/prisma';

const TOLERANCE_DAYS = 2;

function addDays(dateStr: string, days: number): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, (m || 1) - 1, d || 1);
  date.setDate(date.getDate() + days);
  return date.toISOString().split('T')[0];
}

export interface PossibleDuplicate {
  type: 'expense' | 'transfer';
  id: string;
  label: string;
  date: string;
}

/**
 * Soft duplicate check for a freshly-entered Expense or Transfer: the same
 * real payment can otherwise enter the ledger more than once via manual
 * entry, receipt scan (which shares the same expense-create route), or a
 * statement import creating a Transfer — with nothing today preventing it
 * from being counted twice in Money Map, Insights, or the savings
 * horizons. Deliberately a warning, never a block: same amount/currency,
 * within a small (+-2 day) date tolerance, scoped to the same account when
 * one is known. Checks BOTH tables regardless of which one is being
 * written to, since a manual Expense can collide with an already-logged
 * Transfer and vice versa.
 */
export async function findPossibleDuplicate(params: {
  householdId: string;
  amount: number;
  currency: string;
  date: string;
  accountId?: string | null;
  excludeExpenseId?: string;
  excludeTransferId?: string;
}): Promise<PossibleDuplicate | null> {
  const { householdId, amount, currency, date, accountId, excludeExpenseId, excludeTransferId } = params;
  if (!amount || !date) return null;

  const from = addDays(date, -TOLERANCE_DAYS);
  const to = addDays(date, TOLERANCE_DAYS);

  const matchedExpense = await prisma.expense.findFirst({
    where: {
      householdId,
      currency,
      amount,
      isActive: true,
      nextRenewalDate: { gte: from, lte: to },
      ...(accountId ? { paymentAccountId: accountId } : {}),
      ...(excludeExpenseId ? { NOT: { id: excludeExpenseId } } : {}),
    },
    select: { id: true, name: true, nextRenewalDate: true },
  });
  if (matchedExpense) {
    return { type: 'expense', id: matchedExpense.id, label: matchedExpense.name, date: matchedExpense.nextRenewalDate };
  }

  const matchedTransfer = await prisma.transfer.findFirst({
    where: {
      householdId,
      currency,
      amount,
      date: { gte: from, lte: to },
      ...(accountId ? { OR: [{ fromAccountId: accountId }, { toAccountId: accountId }] } : {}),
      ...(excludeTransferId ? { NOT: { id: excludeTransferId } } : {}),
    },
    select: { id: true, externalLabel: true, note: true, date: true },
  });
  if (matchedTransfer) {
    return {
      type: 'transfer',
      id: matchedTransfer.id,
      label: matchedTransfer.externalLabel || matchedTransfer.note || `${currency} ${amount}`,
      date: matchedTransfer.date,
    };
  }

  return null;
}
