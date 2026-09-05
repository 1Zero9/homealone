import { NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';
import { getErrorMessage } from '@/src/lib/errors';
import { requireHouseholdUser } from '@/src/lib/auth';
import { isBuiltinCategory } from '@/src/data/categories';

export async function GET() {
  const auth = await requireHouseholdUser();
  if ('error' in auth) return auth.error;

  try {
    const budgets = await prisma.budget.findMany({
      where: { householdId: auth.user.householdId },
      orderBy: { createdAt: 'asc' },
    });

    return NextResponse.json({ status: 'ok', budgets });
  } catch (error: unknown) {
    console.error('Failed to fetch budgets:', error);
    return NextResponse.json(
      { status: 'error', message: getErrorMessage(error, 'Database error') },
      { status: 500 }
    );
  }
}

// Sets (creates or updates) the monthly limit for one category. A household
// only ever has one budget per category — @@unique([householdId, category])
// — so this is always an upsert, never a plain create.
export async function POST(request: Request) {
  const auth = await requireHouseholdUser();
  if ('error' in auth) return auth.error;

  try {
    const body = await request.json();
    const category = typeof body.category === 'string' ? body.category.trim() : '';
    const monthlyLimit = Number(body.monthlyLimit);

    if (!category) {
      return NextResponse.json({ status: 'error', message: 'A category is required' }, { status: 400 });
    }
    if (!Number.isFinite(monthlyLimit) || monthlyLimit <= 0) {
      return NextResponse.json({ status: 'error', message: 'Enter a monthly limit greater than zero' }, { status: 400 });
    }

    if (!isBuiltinCategory(category)) {
      const customMatch = await prisma.category.findFirst({
        where: { id: category, householdId: auth.user.householdId },
      });
      if (!customMatch) {
        return NextResponse.json({ status: 'error', message: 'Unknown category' }, { status: 400 });
      }
    }

    const currency = typeof body.currency === 'string' && body.currency ? body.currency : 'EUR';

    const budget = await prisma.budget.upsert({
      where: { householdId_category: { householdId: auth.user.householdId as string, category } },
      create: {
        category,
        monthlyLimit,
        currency,
        householdId: auth.user.householdId,
        createdById: auth.user.id,
      },
      update: {
        monthlyLimit,
        currency,
      },
    });

    return NextResponse.json({ status: 'ok', budget });
  } catch (error: unknown) {
    console.error('Failed to save budget:', error);
    return NextResponse.json(
      { status: 'error', message: getErrorMessage(error, 'Failed to save budget') },
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
      return NextResponse.json({ status: 'error', message: 'Missing budget id' }, { status: 400 });
    }

    const existing = await prisma.budget.findUnique({ where: { id } });
    if (!existing || existing.householdId !== auth.user.householdId) {
      return NextResponse.json({ status: 'error', message: 'Budget not found' }, { status: 404 });
    }

    await prisma.budget.delete({ where: { id } });

    return NextResponse.json({ status: 'ok', deletedId: id });
  } catch (error: unknown) {
    console.error('Failed to delete budget:', error);
    return NextResponse.json(
      { status: 'error', message: getErrorMessage(error, 'Failed to delete budget') },
      { status: 500 }
    );
  }
}
