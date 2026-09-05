import { NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';
import { getErrorMessage } from '@/src/lib/errors';
import { requireAdmin } from '@/src/lib/auth';
import { Prisma } from '@prisma/client';

// A snapshot's payloadJson holds one plain array per table. Older backups
// (pre-expansion) instead have payloadJson as a bare array of Expense rows —
// restoreLegacyExpensesOnly() below handles those so they stay restorable.
interface BackupPayload {
  accounts?: Record<string, unknown>[];
  goals?: Record<string, unknown>[];
  expenses?: Record<string, unknown>[];
  incomes?: Record<string, unknown>[];
  transfers?: Record<string, unknown>[];
}

export async function GET() {
  const auth = await requireAdmin();
  if ('error' in auth) return auth.error;

  try {
    const backups = await prisma.databaseBackup.findMany({
      where: { householdId: auth.user.householdId },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    return NextResponse.json({
      status: 'ok',
      backups,
    });
  } catch (error: unknown) {
    console.error('Failed to fetch backups:', error);
    return NextResponse.json(
      { status: 'error', message: getErrorMessage(error, 'Database error') },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const auth = await requireAdmin();
  if ('error' in auth) return auth.error;

  try {
    const body = await request.json().catch(() => ({}));
    const householdId = auth.user.householdId;

    const [accounts, goals, expenses, incomes, transfers] = await Promise.all([
      prisma.account.findMany({ where: { householdId } }),
      prisma.goal.findMany({ where: { householdId } }),
      prisma.expense.findMany({ where: { householdId } }),
      prisma.income.findMany({ where: { householdId } }),
      prisma.transfer.findMany({ where: { householdId } }),
    ]);

    const payload: BackupPayload = { accounts, goals, expenses, incomes, transfers };
    const recordCount = accounts.length + goals.length + expenses.length + incomes.length + transfers.length;

    const backup = await prisma.databaseBackup.create({
      data: {
        createdById: auth.user.id,
        householdId,
        payloadJson: payload as unknown as Prisma.InputJsonValue,
        recordCount,
        notes: body.notes || `Snapshot created on ${new Date().toLocaleString()}`,
      },
    });

    return NextResponse.json({
      status: 'ok',
      backup,
    });
  } catch (error: unknown) {
    console.error('Failed to create backup:', error);
    return NextResponse.json(
      { status: 'error', message: getErrorMessage(error, 'Backup failed') },
      { status: 500 }
    );
  }
}

function str(v: unknown, fallback: string | null = null): string | null {
  return v === undefined || v === null ? fallback : String(v);
}
function num(v: unknown, fallback: number): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}
function numOrNull(v: unknown): number | null {
  if (v === undefined || v === null) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}
function bool(v: unknown, fallback = false): boolean {
  return typeof v === 'boolean' ? v : fallback;
}

export async function PUT(request: Request) {
  const auth = await requireAdmin();
  if ('error' in auth) return auth.error;

  try {
    const body = await request.json();
    if (!body.backupId) {
      return NextResponse.json(
        { status: 'error', message: 'Missing backupId' },
        { status: 400 }
      );
    }

    const backup = await prisma.databaseBackup.findUnique({
      where: { id: body.backupId },
    });

    if (!backup || !backup.payloadJson || backup.householdId !== auth.user.householdId) {
      return NextResponse.json(
        { status: 'error', message: 'Backup not found' },
        { status: 404 }
      );
    }

    const householdId = auth.user.householdId;
    const createdById = auth.user.id;

    // Legacy backups: payloadJson is a bare array of Expense rows.
    if (Array.isArray(backup.payloadJson)) {
      const records = backup.payloadJson as Prisma.JsonArray as Record<string, unknown>[];
      const restoredCount = await prisma.$transaction(async (tx) => {
        await tx.expense.deleteMany({ where: { householdId } });
        for (const item of records) {
          await tx.expense.create({
            data: {
              name: str(item.name, 'Untitled') as string,
              amount: num(item.amount, 0),
              currency: str(item.currency, 'EUR') as string,
              billingCycle: str(item.billingCycle, 'monthly') as string,
              category: str(item.category, 'utilities') as string,
              icon: str(item.icon, 'Zap') as string,
              color: str(item.color, '#3155D9') as string,
              renewalDay: num(item.renewalDay, 1),
              nextRenewalDate: str(item.nextRenewalDate, new Date().toISOString().split('T')[0]) as string,
              isPaidThisCycle: bool(item.isPaidThisCycle),
              paymentMethod: str(item.paymentMethod, 'SEPA Direct Debit') as string,
              isActive: bool(item.isActive, true),
              notes: str(item.notes),
              contractEndDate: str(item.contractEndDate),
              usageRating: str(item.usageRating, 'high'),
              householdId,
              createdById,
            },
          });
        }
        return records.length;
      });

      return NextResponse.json({ status: 'ok', restoredCount });
    }

    const payload = backup.payloadJson as unknown as BackupPayload;
    if (typeof payload !== 'object' || payload === null) {
      return NextResponse.json(
        { status: 'error', message: 'Backup payload is invalid' },
        { status: 400 }
      );
    }

    const result = await prisma.$transaction(async (tx) => {
      // Delete this household's rows across every backed-up table before
      // recreating — children first is just tidiness here, since every
      // cross-reference in this set is onDelete: SetNull, not Cascade.
      await tx.transfer.deleteMany({ where: { householdId } });
      await tx.goal.deleteMany({ where: { householdId } });
      await tx.expense.deleteMany({ where: { householdId } });
      await tx.income.deleteMany({ where: { householdId } });
      await tx.account.deleteMany({ where: { householdId } });

      const accountIdMap = new Map<string, string>();
      for (const item of payload.accounts || []) {
        const created = await tx.account.create({
          data: {
            name: str(item.name, 'Untitled account') as string,
            institution: str(item.institution),
            type: (str(item.type, 'OTHER') as Prisma.AccountCreateInput['type']),
            currency: str(item.currency, 'EUR') as string,
            notes: str(item.notes),
            isActive: bool(item.isActive, true),
            balance: numOrNull(item.balance),
            balanceAsOf: str(item.balanceAsOf),
            accountNumberEnc: str(item.accountNumberEnc),
            routingNumberEnc: str(item.routingNumberEnc),
            ibanEnc: str(item.ibanEnc),
            bicEnc: str(item.bicEnc),
            loginUsernameEnc: str(item.loginUsernameEnc),
            loginPasswordEnc: str(item.loginPasswordEnc),
            loginUrlEnc: str(item.loginUrlEnc),
            securityNotesEnc: str(item.securityNotesEnc),
            originalAmount: numOrNull(item.originalAmount),
            interestRate: numOrNull(item.interestRate),
            termMonths: item.termMonths === undefined || item.termMonths === null ? null : Math.round(num(item.termMonths, 0)),
            payoffDate: str(item.payoffDate),
            householdId,
            createdById,
          },
        });
        if (typeof item.id === 'string') accountIdMap.set(item.id, created.id);
      }

      const goalIdMap = new Map<string, string>();
      for (const item of payload.goals || []) {
        const oldAccountId = typeof item.linkedAccountId === 'string' ? item.linkedAccountId : null;
        const created = await tx.goal.create({
          data: {
            name: str(item.name, 'Untitled goal') as string,
            targetAmount: num(item.targetAmount, 0),
            currentAmount: num(item.currentAmount, 0),
            currency: str(item.currency, 'EUR') as string,
            targetDate: str(item.targetDate),
            notes: str(item.notes),
            isActive: bool(item.isActive, true),
            linkedAccountId: oldAccountId ? accountIdMap.get(oldAccountId) || null : null,
            householdId,
            createdById,
          },
        });
        if (typeof item.id === 'string') goalIdMap.set(item.id, created.id);
      }

      const expenseIdMap = new Map<string, string>();
      for (const item of payload.expenses || []) {
        const oldAccountId = typeof item.paymentAccountId === 'string' ? item.paymentAccountId : null;
        const oldGoalId = typeof item.linkedGoalId === 'string' ? item.linkedGoalId : null;
        const created = await tx.expense.create({
          data: {
            name: str(item.name, 'Untitled') as string,
            vendor: str(item.vendor),
            amount: num(item.amount, 0),
            currency: str(item.currency, 'EUR') as string,
            billingCycle: str(item.billingCycle, 'monthly') as string,
            category: str(item.category, 'utilities') as string,
            icon: str(item.icon, 'Zap') as string,
            color: str(item.color, '#3155D9') as string,
            renewalDay: num(item.renewalDay, 1),
            nextRenewalDate: str(item.nextRenewalDate, new Date().toISOString().split('T')[0]) as string,
            isPaidThisCycle: bool(item.isPaidThisCycle),
            lastPaidAt: item.lastPaidAt ? new Date(item.lastPaidAt as string) : null,
            paymentMethod: str(item.paymentMethod, 'SEPA Direct Debit') as string,
            isActive: bool(item.isActive, true),
            isPending: bool(item.isPending),
            notes: str(item.notes),
            contractEndDate: str(item.contractEndDate),
            vendorEmail: str(item.vendorEmail),
            usageRating: str(item.usageRating, 'high'),
            isVariable: bool(item.isVariable),
            isBill: bool(item.isBill, true),
            paymentAccountId: oldAccountId ? accountIdMap.get(oldAccountId) || null : null,
            linkedGoalId: oldGoalId ? goalIdMap.get(oldGoalId) || null : null,
            householdId,
            createdById,
          },
        });
        if (typeof item.id === 'string') expenseIdMap.set(item.id, created.id);
      }

      const incomeIdMap = new Map<string, string>();
      for (const item of payload.incomes || []) {
        const oldAccountId = typeof item.depositAccountId === 'string' ? item.depositAccountId : null;
        const created = await tx.income.create({
          data: {
            name: str(item.name, 'Untitled') as string,
            amount: num(item.amount, 0),
            currency: str(item.currency, 'EUR') as string,
            frequency: str(item.frequency, 'monthly') as string,
            nextPayDate: str(item.nextPayDate),
            category: str(item.category, 'salary') as string,
            isActive: bool(item.isActive, true),
            notes: str(item.notes),
            isReceivedThisCycle: bool(item.isReceivedThisCycle),
            lastReceivedAt: item.lastReceivedAt ? new Date(item.lastReceivedAt as string) : null,
            depositAccountId: oldAccountId ? accountIdMap.get(oldAccountId) || null : null,
            householdId,
            createdById,
          },
        });
        if (typeof item.id === 'string') incomeIdMap.set(item.id, created.id);
      }

      let transferCount = 0;
      for (const item of payload.transfers || []) {
        const oldFrom = typeof item.fromAccountId === 'string' ? item.fromAccountId : null;
        const oldTo = typeof item.toAccountId === 'string' ? item.toAccountId : null;
        const oldExpense = typeof item.linkedExpenseId === 'string' ? item.linkedExpenseId : null;
        const oldIncome = typeof item.linkedIncomeId === 'string' ? item.linkedIncomeId : null;
        await tx.transfer.create({
          data: {
            amount: num(item.amount, 0),
            currency: str(item.currency, 'EUR') as string,
            date: str(item.date, new Date().toISOString().split('T')[0]) as string,
            note: str(item.note),
            externalLabel: str(item.externalLabel),
            fromAccountId: oldFrom ? accountIdMap.get(oldFrom) || null : null,
            toAccountId: oldTo ? accountIdMap.get(oldTo) || null : null,
            linkedExpenseId: oldExpense ? expenseIdMap.get(oldExpense) || null : null,
            linkedIncomeId: oldIncome ? incomeIdMap.get(oldIncome) || null : null,
            householdId,
            createdById,
          },
        });
        transferCount += 1;
      }

      return {
        accounts: accountIdMap.size,
        goals: goalIdMap.size,
        expenses: expenseIdMap.size,
        incomes: incomeIdMap.size,
        transfers: transferCount,
      };
    });

    const restoredCount = result.accounts + result.goals + result.expenses + result.incomes + result.transfers;

    return NextResponse.json({
      status: 'ok',
      restoredCount,
      breakdown: result,
    });
  } catch (error: unknown) {
    console.error('Failed to restore backup:', error);
    return NextResponse.json(
      { status: 'error', message: getErrorMessage(error, 'Restore failed') },
      { status: 500 }
    );
  }
}
