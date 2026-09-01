import { NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';

export async function GET() {
  try {
    const backups = await prisma.databaseBackup.findMany({
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    return NextResponse.json({
      status: 'ok',
      backups,
    });
  } catch (error: any) {
    console.error('Failed to fetch backups:', error);
    return NextResponse.json(
      { status: 'error', message: error.message || 'Database error' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const allExpenses = await prisma.expense.findMany();

    const backup = await prisma.databaseBackup.create({
      data: {
        createdById: body.createdById || null,
        payloadJson: allExpenses as any,
        recordCount: allExpenses.length,
        notes: body.notes || `Snapshot created on ${new Date().toLocaleString()}`,
      },
    });

    return NextResponse.json({
      status: 'ok',
      backup,
    });
  } catch (error: any) {
    console.error('Failed to create backup:', error);
    return NextResponse.json(
      { status: 'error', message: error.message || 'Backup failed' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
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

    const records = backup.payloadJson as any[];
    if (Array.isArray(records)) {
      // Clear and re-populate
      await prisma.expense.deleteMany();
      for (const item of records) {
        await prisma.expense.create({
          data: {
            name: item.name,
            amount: Number(item.amount),
            currency: item.currency || 'EUR',
            billingCycle: item.billingCycle || 'monthly',
            category: item.category || 'utilities',
            icon: item.icon || 'Zap',
            color: item.color || '#3155D9',
            renewalDay: Number(item.renewalDay) || 1,
            nextRenewalDate: item.nextRenewalDate,
            paymentMethod: item.paymentMethod || 'SEPA Direct Debit',
            isActive: Boolean(item.isActive),
            notes: item.notes || null,
            contractEndDate: item.contractEndDate || null,
            usageRating: item.usageRating || 'high',
          },
        });
      }
    }

    return NextResponse.json({
      status: 'ok',
      restoredCount: records.length,
    });
  } catch (error: any) {
    console.error('Failed to restore backup:', error);
    return NextResponse.json(
      { status: 'error', message: error.message || 'Restore failed' },
      { status: 500 }
    );
  }
}
