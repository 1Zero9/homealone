import { NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';
import { getErrorMessage } from '@/src/lib/errors';
import { requireAdmin, requireUser } from '@/src/lib/auth';

export async function GET() {
  const auth = await requireUser();
  if ('error' in auth) return auth.error;
  const user = auth.user;

  try {
    // Find household or default primary
    let household = user?.householdId
      ? await prisma.household.findUnique({
          where: { id: user.householdId },
          include: {
            users: {
              select: {
                id: true,
                name: true,
                email: true,
                role: true,
                createdAt: true,
                _count: { select: { expenses: true } },
              },
              orderBy: { createdAt: 'asc' },
            },
            _count: {
              select: { expenses: true, users: true },
            },
          },
        })
      : null;

    if (!household) {
      household = await prisma.household.findFirst({
        include: {
          users: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
              createdAt: true,
              _count: { select: { expenses: true } },
            },
            orderBy: { createdAt: 'asc' },
          },
          _count: {
            select: { expenses: true, users: true },
          },
        },
      });
    }

    if (!household) {
      household = await prisma.household.create({
        data: {
          name: 'Our Household',
        },
        include: {
          users: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
              createdAt: true,
              _count: { select: { expenses: true } },
            },
          },
          _count: {
            select: { expenses: true, users: true },
          },
        },
      });
    }

    return NextResponse.json({
      status: 'ok',
      workspace: household,
    });
  } catch (error: unknown) {
    console.error('Failed to get workspace:', error);
    return NextResponse.json(
      { status: 'error', message: getErrorMessage(error, 'Database error') },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  const auth = await requireAdmin();
  if ('error' in auth) return auth.error;

  try {
    const body = await request.json();
    const { name } = body;

    if (!name) {
      return NextResponse.json(
        { status: 'error', message: 'Workspace name is required' },
        { status: 400 }
      );
    }

    // Admins may only rename their own household.
    const updated = await prisma.household.update({
      where: { id: auth.user.householdId },
      data: { name: name.trim() },
    });

    return NextResponse.json({
      status: 'ok',
      workspace: updated,
    });
  } catch (error: unknown) {
    console.error('Failed to update workspace:', error);
    return NextResponse.json(
      { status: 'error', message: getErrorMessage(error, 'Update failed') },
      { status: 500 }
    );
  }
}
