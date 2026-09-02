import { NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';

export async function GET() {
  try {
    const expenses = await prisma.expense.findMany({
      orderBy: { renewalDay: 'asc' },
      include: {
        createdBy: {
          select: { id: true, name: true, role: true },
        },
      },
    });

    return NextResponse.json({
      status: 'ok',
      expenses,
    });
  } catch (error: any) {
    console.error('Failed to fetch expenses from PostgreSQL:', error);
    return NextResponse.json(
      { status: 'error', message: error.message || 'Database error' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Find default household if not provided
    let householdId = body.householdId;
    if (!householdId) {
      const defaultH = await prisma.household.findFirst();
      householdId = defaultH?.id || null;
    }

    const newExpense = await prisma.expense.create({
      data: {
        id: body.id || undefined,
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
        usageRating: body.usageRating || 'high',
        createdById: body.createdById || null,
        householdId,
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
  } catch (error: any) {
    console.error('Failed to create expense:', error);
    return NextResponse.json(
      { status: 'error', message: error.message || 'Failed to create record' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    if (!body.id) {
      return NextResponse.json(
        { status: 'error', message: 'Missing expense id' },
        { status: 400 }
      );
    }

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
        usageRating: body.usageRating || 'high',
        createdById: body.createdById || undefined,
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
  } catch (error: any) {
    console.error('Failed to update expense:', error);
    return NextResponse.json(
      { status: 'error', message: error.message || 'Failed to update record' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { status: 'error', message: 'Missing id query parameter' },
        { status: 400 }
      );
    }

    await prisma.expense.delete({
      where: { id },
    });

    return NextResponse.json({
      status: 'ok',
      deletedId: id,
    });
  } catch (error: any) {
    console.error('Failed to delete expense:', error);
    return NextResponse.json(
      { status: 'error', message: error.message || 'Failed to delete record' },
      { status: 500 }
    );
  }
}
