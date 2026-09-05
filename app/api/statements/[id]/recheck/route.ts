import { NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';
import { getErrorMessage } from '@/src/lib/errors';
import { requireHouseholdUser } from '@/src/lib/auth';
import { normalizeDescription, matchTransaction, findRecurringUnmatched, buildAliasPattern } from '@/src/lib/statementMatching';

const TX_INCLUDE = {
  matchedExpense: { select: { id: true, name: true, vendor: true, category: true } },
  matchedTransfer: { select: { id: true, externalLabel: true } },
} as const;

/**
 * Re-runs normalization and matching against every still-unresolved row in
 * an import, using the household's current Expenses/Transfers/MerchantAlias
 * data. Exists for two reasons: (1) normalizeDescription can improve over
 * time (a bank format it didn't handle well gets fixed), and a row imported
 * before that fix keeps its stale normalizedDescription forever unless
 * something re-derives it; (2) renaming one occurrence of a merchant, or
 * confirming/categorizing it, only updates rows that already share its
 * *current* normalizedDescription — anything that couldn't be recognized as
 * the same merchant at import time (and so wasn't touched by that
 * propagation) needs this to catch up.
 */
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireHouseholdUser();
  if ('error' in auth) return auth.error;

  try {
    const { id } = await params;
    const statementImport = await prisma.statementImport.findUnique({ where: { id } });
    if (!statementImport || statementImport.householdId !== auth.user.householdId) {
      return NextResponse.json({ status: 'error', message: 'Statement import not found' }, { status: 404 });
    }

    const accountId = statementImport.accountId;

    const [rows, expenses, transfers, aliases] = await Promise.all([
      prisma.statementTransaction.findMany({
        where: { importId: id, householdId: auth.user.householdId, status: 'UNMATCHED' },
      }),
      prisma.expense.findMany({
        where: {
          householdId: auth.user.householdId,
          isActive: true,
          ...(accountId ? { OR: [{ paymentAccountId: accountId }, { paymentAccountId: null }] } : {}),
        },
        select: { id: true, name: true, vendor: true, amount: true, currency: true, renewalDay: true },
      }),
      prisma.transfer.findMany({
        where: {
          householdId: auth.user.householdId,
          ...(accountId ? { OR: [{ fromAccountId: accountId }, { toAccountId: accountId }] } : {}),
        },
        select: { id: true, amount: true, currency: true, date: true, externalLabel: true },
      }),
      prisma.merchantAlias.findMany({
        where: { householdId: auth.user.householdId },
        select: { id: true, pattern: true, vendorName: true, expenseId: true, category: true },
      }),
    ]);

    if (rows.length === 0) {
      return NextResponse.json({ status: 'ok', transactions: [], changedCount: 0 });
    }

    const prepared = rows.map((row) => {
      const normalizedDescription = normalizeDescription(row.rawDescription);
      const match = matchTransaction(
        { normalizedDescription, amount: row.amount, currency: row.currency, date: row.date, direction: row.direction },
        { expenses, transfers, aliases }
      );
      return { row, normalizedDescription, match };
    });

    // A rename made before normalizedDescription was corrected (or before
    // this exact bank format was recognized) bakes a stale, over-specific
    // pattern into its MerchantAlias — one that no longer appears as a
    // substring of the newly-corrected description, so the alias-based
    // match in matchTransaction() above can miss it. Falling back to "does
    // any other row now sharing this exact normalizedDescription already
    // have a nickname" catches that case directly, without depending on
    // the alias table at all.
    const vendorByNormalizedDesc = new Map<string, string>();
    for (const p of prepared) {
      if (p.row.vendorName && !vendorByNormalizedDesc.has(p.normalizedDescription)) {
        vendorByNormalizedDesc.set(p.normalizedDescription, p.row.vendorName);
      }
    }

    const recurringFlags = findRecurringUnmatched(
      prepared.map((p) => ({ id: p.row.id, normalizedDescription: p.normalizedDescription, status: p.match.status }))
    );

    let changedCount = 0;
    const updated = await prisma.$transaction(
      prepared.map((p) => {
        const isRecurringFlag = recurringFlags.has(p.row.id);
        const notes = isRecurringFlag ? 'Appears more than once and looks untracked — worth checking.' : null;
        const vendorName = p.row.vendorName || vendorByNormalizedDesc.get(p.normalizedDescription) || p.match.suggestedVendorName || null;
        const changed = p.normalizedDescription !== p.row.normalizedDescription
          || p.match.status !== p.row.status
          || (p.match.matchedExpenseId || null) !== p.row.matchedExpenseId
          || (p.match.matchedTransferId || null) !== p.row.matchedTransferId
          || vendorName !== p.row.vendorName
          || notes !== p.row.notes;
        if (changed) changedCount += 1;

        return prisma.statementTransaction.update({
          where: { id: p.row.id },
          data: {
            normalizedDescription: p.normalizedDescription,
            status: p.match.status,
            matchedExpenseId: p.match.matchedExpenseId || null,
            matchedTransferId: p.match.matchedTransferId || null,
            matchConfidence: p.match.matchConfidence ?? null,
            suggestedCategory: p.match.suggestedCategory ?? p.row.suggestedCategory,
            vendorName,
            notes,
          },
          include: TX_INCLUDE,
        });
      })
    );

    // Best-effort: also repair any MerchantAlias whose pattern was derived
    // from a row's now-stale normalizedDescription, so the NEXT statement
    // import of this same merchant benefits too, not just this recheck.
    const repairs = new Map<string, string>(); // old pattern -> new pattern
    for (const p of prepared) {
      if (!p.row.vendorName) continue;
      const oldPattern = buildAliasPattern(p.row.normalizedDescription);
      const newPattern = buildAliasPattern(p.normalizedDescription);
      if (oldPattern && newPattern && oldPattern !== newPattern) repairs.set(oldPattern, newPattern);
    }
    if (repairs.size > 0 && auth.user.householdId) {
      for (const [oldPattern, newPattern] of repairs) {
        const stale = aliases.find((a) => a.pattern === oldPattern);
        if (!stale) continue;
        const clash = aliases.find((a) => a.pattern === newPattern);
        if (clash) continue; // leave it — an alias already owns the correct pattern
        await prisma.merchantAlias.update({ where: { id: stale.id }, data: { pattern: newPattern } }).catch(() => {});
      }
    }

    return NextResponse.json({ status: 'ok', transactions: updated, changedCount });
  } catch (error: unknown) {
    console.error('Failed to recheck statement matches:', error);
    return NextResponse.json(
      { status: 'error', message: getErrorMessage(error, 'Failed to recheck matches') },
      { status: 500 }
    );
  }
}
