import { NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';
import { getErrorMessage } from '@/src/lib/errors';
import { requireHouseholdUser } from '@/src/lib/auth';
import { convertCurrency } from '@/src/utils/calculations';
import type { CurrencyCode, HistoryPeriod, MonthlyHistoryPoint } from '@/src/types/expense';

const MONTH_LABELS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

function monthKey(dateStr: string): string {
  return dateStr.slice(0, 7);
}

function monthLabel(key: string): string {
  const [y, m] = key.split('-').map(Number);
  return `${MONTH_LABELS[(m || 1) - 1]} ${y}`;
}

export async function GET(request: Request) {
  const auth = await requireHouseholdUser();
  if ('error' in auth) return auth.error;

  try {
    const { searchParams } = new URL(request.url);
    const period = (searchParams.get('period') || '12') as HistoryPeriod;
    const targetCurrency = (searchParams.get('currency') || 'EUR') as CurrencyCode;
    const billsOnly = searchParams.get('billsOnly') === 'true';

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let cutoffDate: string | null = null;
    if (period !== 'all') {
      const monthsBack = Number(period) || 12;
      const cutoff = new Date(today.getFullYear(), today.getMonth() - (monthsBack - 1), 1);
      cutoffDate = cutoff.toISOString().split('T')[0];
    }

    const transfers = await prisma.transfer.findMany({
      where: {
        householdId: auth.user.householdId,
        OR: [
          { linkedExpenseId: { not: null }, ...(billsOnly ? { linkedExpense: { isBill: true } } : {}) },
          { linkedIncomeId: { not: null } },
        ],
        ...(cutoffDate ? { date: { gte: cutoffDate } } : {}),
      },
      select: {
        amount: true,
        currency: true,
        date: true,
        linkedExpenseId: true,
        linkedIncomeId: true,
      },
      orderBy: { date: 'asc' },
    });

    const monthMap = new Map<string, { spending: number; income: number }>();

    // Ensure every month in the requested window is present, even if empty,
    // so charts render a continuous axis rather than skipping gaps.
    if (period !== 'all') {
      const monthsBack = Number(period) || 12;
      for (let i = monthsBack - 1; i >= 0; i -= 1) {
        const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        monthMap.set(key, { spending: 0, income: 0 });
      }
    }

    for (const t of transfers) {
      const key = monthKey(t.date);
      const entry = monthMap.get(key) || { spending: 0, income: 0 };
      const converted = convertCurrency(t.amount, (t.currency as CurrencyCode) || 'EUR', targetCurrency);

      if (t.linkedExpenseId) entry.spending += converted;
      if (t.linkedIncomeId) entry.income += converted;

      monthMap.set(key, entry);
    }

    const months: MonthlyHistoryPoint[] = Array.from(monthMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, val]) => ({
        month: key,
        label: monthLabel(key),
        spending: Math.round(val.spending * 100) / 100,
        income: Math.round(val.income * 100) / 100,
      }));

    return NextResponse.json({
      status: 'ok',
      months,
      hasAnyHistory: transfers.length > 0,
    });
  } catch (error: unknown) {
    console.error('Failed to fetch history:', error);
    return NextResponse.json(
      { status: 'error', message: getErrorMessage(error, 'Database error') },
      { status: 500 }
    );
  }
}
