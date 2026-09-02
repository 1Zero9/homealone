import { NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';
import { cookies } from 'next/headers';

async function getAuthUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get('homealone_session')?.value;
  if (!token) return null;

  const session = await prisma.session.findUnique({
    where: { token },
    include: { user: true },
  });

  if (!session || session.expiresAt < new Date()) return null;
  return session.user;
}

export async function GET() {
  try {
    const user = await getAuthUser();

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
          inviteCode: 'home-alone-family',
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
  } catch (error: any) {
    console.error('Failed to get workspace:', error);
    return NextResponse.json(
      { status: 'error', message: error.message || 'Database error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, name } = body;

    if (!id || !name) {
      return NextResponse.json(
        { status: 'error', message: 'Workspace id and name are required' },
        { status: 400 }
      );
    }

    const updated = await prisma.household.update({
      where: { id },
      data: { name: name.trim() },
    });

    return NextResponse.json({
      status: 'ok',
      workspace: updated,
    });
  } catch (error: any) {
    console.error('Failed to update workspace:', error);
    return NextResponse.json(
      { status: 'error', message: error.message || 'Update failed' },
      { status: 500 }
    );
  }
}
