import { NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';
import { getErrorMessage } from '@/src/lib/errors';
import { requireHouseholdUser } from '@/src/lib/auth';
import { pickCustomCategoryColors } from '@/src/data/categories';

export async function GET() {
  const auth = await requireHouseholdUser();
  if ('error' in auth) return auth.error;

  try {
    const categories = await prisma.category.findMany({
      where: { householdId: auth.user.householdId },
      orderBy: { createdAt: 'asc' },
    });

    return NextResponse.json({ status: 'ok', categories });
  } catch (error: unknown) {
    console.error('Failed to fetch categories:', error);
    return NextResponse.json(
      { status: 'error', message: getErrorMessage(error, 'Database error') },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const auth = await requireHouseholdUser();
  if ('error' in auth) return auth.error;

  try {
    const body = await request.json();
    const name = typeof body.name === 'string' ? body.name.trim() : '';

    if (!name) {
      return NextResponse.json({ status: 'error', message: 'Category name is required' }, { status: 400 });
    }

    const existing = await prisma.category.findFirst({
      where: { householdId: auth.user.householdId, name: { equals: name, mode: 'insensitive' } },
    });
    if (existing) {
      return NextResponse.json({ status: 'ok', category: existing });
    }

    const existingCount = await prisma.category.count({ where: { householdId: auth.user.householdId } });
    const colors = pickCustomCategoryColors(existingCount);

    const category = await prisma.category.create({
      data: {
        name,
        icon: typeof body.icon === 'string' && body.icon ? body.icon : 'Tag',
        color: colors.color,
        bgColor: colors.bgColor,
        borderColor: colors.borderColor,
        householdId: auth.user.householdId,
        createdById: auth.user.id,
      },
    });

    return NextResponse.json({ status: 'ok', category });
  } catch (error: unknown) {
    console.error('Failed to create category:', error);
    return NextResponse.json(
      { status: 'error', message: getErrorMessage(error, 'Failed to create category') },
      { status: 500 }
    );
  }
}
