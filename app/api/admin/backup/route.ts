import { NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';
import { getErrorMessage } from '@/src/lib/errors';
import { requireAdmin } from '@/src/lib/auth';
import { Prisma } from '@prisma/client';

export async function GET() {
  const auth = await requireAdmin();
  if ('error' in auth) return auth.error;

  try {
    const backups = await prisma.databaseBackup.findMany({
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
    const allExpenses = await prisma.expense.findMany({
      where: { householdId: auth.user.householdId },
    });

    const backup = await prisma.databaseBackup.create({
      data: {
        createdById: auth.user.id,
        payloadJson: allExpenses as unknown as Prisma.InputJsonValue,
        recordCount: allExpenses.length,
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

    if (!backup || !backup.payloadJson) {
      return NextResponse.json(
        { status: 'error', message: 'Backup not found' },
        { status: 404 }
      );
    }

    if (!Array.isArray(backup.payloadJson)) {
      return NextResponse.json(
        { status: 'error', message: 'Backup payload is invalid' },
        { status: 400 }
      );
    }
    const records = backup.payloadJson as Prisma.JsonArray as Record<string, unknown>[];

    // Only ever restore records into the admin's own household, and only
    // replace that household's expenses — never touch other households.
    await prisma.$transaction(async (tx) => {
      await tx.expense.deleteMany({ where: { householdId: auth.user.householdId } });
      for (const item of records) {
        await tx.expense.create({
          data: {
            name: String(item.name || 'Untitled'),
            amount: Number(item.amount) || 0,
            currency: (item.currency as string) || 'EUR',
            billingCycle: (item.billingCycle as string) || 'monthly',
            category: (item.category as string) || 'utilities',
            icon: (item.icon as string) || 'Zap',
            color: (item.color as string) || '#3155D9',
            renewalDay: Number(item.renewalDay) || 1,
            nextRenewalDate: (item.nextRenewalDate as string) || new Date().toISOString().split('T')[0],
            isPaidThisCycle: Boolean(item.isPaidThisCycle),
            paymentMethod: (item.paymentMethod as string) || 'SEPA Direct Debit',
            isActive: Boolean(item.isActive),
            notes: (item.notes as string) || null,
            contractEndDate: (item.contractEndDate as string) || null,
            usageRating: (item.usageRating as string) || 'high',
            householdId: auth.user.householdId,
            createdById: auth.user.id,
          },
        });
      }
    });

    return NextResponse.json({
      status: 'ok',
      restoredCount: records.length,
    });
  } catch (error: unknown) {
    console.error('Failed to restore backup:', error);
    return NextResponse.json(
      { status: 'error', message: getErrorMessage(error, 'Restore failed') },
      { status: 500 }
    );
  }
}
