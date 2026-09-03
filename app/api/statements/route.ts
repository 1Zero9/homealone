import { NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';
import { getErrorMessage } from '@/src/lib/errors';
import { requireHouseholdUser } from '@/src/lib/auth';
import {
  normalizeDescription,
  matchTransaction,
  findRecurringUnmatched,
  type StatementTxDirection,
} from '@/src/lib/statementMatching';

export async function GET() {
  const auth = await requireHouseholdUser();
  if ('error' in auth) return auth.error;

  try {
    const imports = await prisma.statementImport.findMany({
      where: { householdId: auth.user.householdId },
      orderBy: { createdAt: 'desc' },
      include: {
        createdBy: { select: { id: true, name: true, role: true } },
        account: { select: { id: true, name: true, type: true, institution: true } },
        transactions: { select: { status: true } },
      },
    });

    const results = imports.map(({ transactions, ...rest }) => ({
      ...rest,
      total: transactions.length,
      matched: transactions.filter((t) => t.status === 'MATCHED').length,
      unmatched: transactions.filter((t) => t.status === 'UNMATCHED').length,
      ignored: transactions.filter((t) => t.status === 'IGNORED').length,
    }));

    return NextResponse.json({ status: 'ok', imports: results });
  } catch (error: unknown) {
    console.error('Failed to fetch statement imports:', error);
    return NextResponse.json(
      { status: 'error', message: getErrorMessage(error, 'Database error') },
      { status: 500 }
    );
  }
}

interface IncomingRow {
  date: string;
  rawDescription: string;
  amount: number;
  currency?: string;
  direction?: string;
}

export async function POST(request: Request) {
  const auth = await requireHouseholdUser();
  if ('error' in auth) return auth.error;

  try {
    const body = await request.json();
    const label =
      typeof body.label === 'string' && body.label.trim()
        ? body.label.trim()
        : `Statement import — ${new Date().toLocaleDateString('en-GB')}`;
    const fileName = typeof body.fileName === 'string' ? body.fileName : null;
    const rawRows: IncomingRow[] = Array.isArray(body.transactions) ? body.transactions : [];

    let accountId: string | null = typeof body.accountId === 'string' && body.accountId ? body.accountId : null;
    if (accountId) {
      const account = await prisma.account.findUnique({ where: { id: accountId } });
      if (!account || account.householdId !== auth.user.householdId) {
        accountId = null;
      }
    }

    const rows = rawRows.filter(
      (r) => r && typeof r.date === 'string' && r.date && typeof r.rawDescription === 'string' && r.rawDescription.trim() && typeof r.amount === 'number' && !Number.isNaN(r.amount) && r.amount !== 0
    );

    if (rows.length === 0) {
      return NextResponse.json({ status: 'error', message: 'No valid transactions to import.' }, { status: 400 });
    }
    if (rows.length > 2000) {
      return NextResponse.json(
        { status: 'error', message: 'That statement has too many rows (max 2000 per import).' },
        { status: 400 }
      );
    }

    const [expenses, transfers, aliases] = await Promise.all([
      prisma.expense.findMany({
        where: {
          householdId: auth.user.householdId,
          isActive: true,
          // Scoped to the chosen account when known — an expense either
          // isn't linked to any account yet, or must match this one, so we
          // don't cross-match a bill paid from a different account.
          ...(accountId ? { OR: [{ paymentAccountId: accountId }, { paymentAccountId: null }] } : {}),
        },
        select: { id: true, name: true, vendor: true, amount: true, currency: true, renewalDay: true },
      }),
      prisma.transfer.findMany({
        where: {
          householdId: auth.user.householdId,
          // A transfer only makes sense as a match for this statement if it
          // actually touches the account the statement came from.
          ...(accountId ? { OR: [{ fromAccountId: accountId }, { toAccountId: accountId }] } : {}),
        },
        select: { id: true, amount: true, currency: true, date: true, externalLabel: true },
      }),
      prisma.merchantAlias.findMany({
        where: { householdId: auth.user.householdId },
        select: { id: true, pattern: true, vendorName: true, expenseId: true },
      }),
    ]);

    const statementImport = await prisma.statementImport.create({
      data: {
        label,
        fileName,
        accountId,
        createdById: auth.user.id,
        householdId: auth.user.householdId,
      },
    });

    const prepared = rows.map((r) => {
      const normalizedDescription = normalizeDescription(r.rawDescription);
      const direction: StatementTxDirection = r.direction === 'CREDIT' ? 'CREDIT' : 'DEBIT';
      const currency = r.currency || 'EUR';
      const amount = Math.abs(r.amount);
      const match = matchTransaction(
        { normalizedDescription, amount, currency, date: r.date, direction },
        { expenses, transfers, aliases }
      );
      return { row: r, normalizedDescription, direction, currency, amount, match };
    });

    const recurringFlags = findRecurringUnmatched(
      prepared.map((p, idx) => ({ id: String(idx), normalizedDescription: p.normalizedDescription, status: p.match.status }))
    );

    const created = await prisma.$transaction(
      prepared.map((p, idx) =>
        prisma.statementTransaction.create({
          data: {
            importId: statementImport.id,
            householdId: auth.user.householdId,
            date: p.row.date,
            rawDescription: p.row.rawDescription,
            normalizedDescription: p.normalizedDescription,
            amount: p.amount,
            currency: p.currency,
            direction: p.direction,
            status: p.match.status,
            matchedExpenseId: p.match.matchedExpenseId || null,
            matchedTransferId: p.match.matchedTransferId || null,
            matchConfidence: p.match.matchConfidence ?? null,
            notes: recurringFlags.has(String(idx))
              ? 'Appears more than once and looks untracked — worth checking.'
              : p.match.suggestedVendorName
              ? `Possibly ${p.match.suggestedVendorName}`
              : null,
          },
          include: {
            matchedExpense: { select: { id: true, name: true, vendor: true, category: true } },
            matchedTransfer: { select: { id: true, externalLabel: true } },
          },
        })
      )
    );

    return NextResponse.json({ status: 'ok', import: statementImport, transactions: created });
  } catch (error: unknown) {
    console.error('Failed to import statement:', error);
    return NextResponse.json(
      { status: 'error', message: getErrorMessage(error, 'Failed to import statement') },
      { status: 500 }
    );
  }
}
