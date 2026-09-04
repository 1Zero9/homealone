import { NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';
import { getErrorMessage } from '@/src/lib/errors';
import { requireHouseholdUser } from '@/src/lib/auth';

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireHouseholdUser();
  if ('error' in auth) return auth.error;

  try {
    const { id } = await params;
    const existing = await prisma.category.findUnique({ where: { id } });
    if (!existing || existing.householdId !== auth.user.householdId) {
      return NextResponse.json({ status: 'error', message: 'Category not found' }, { status: 404 });
    }

    await prisma.category.delete({ where: { id } });

    return NextResponse.json({ status: 'ok', deletedId: id });
  } catch (error: unknown) {
    console.error('Failed to delete category:', error);
    return NextResponse.json(
      { status: 'error', message: getErrorMessage(error, 'Failed to delete category') },
      { status: 500 }
    );
  }
}
