import { NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';
import { getErrorMessage } from '@/src/lib/errors';
import { Role } from '@prisma/client';
import { requireAdmin, requireHouseholdUser } from '@/src/lib/auth';
import { logAudit } from '@/src/lib/audit';

export async function GET() {
  const auth = await requireHouseholdUser();
  if ('error' in auth) return auth.error;

  try {
    const users = await prisma.user.findMany({
      where: { householdId: auth.user.householdId },
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        avatarUrl: true,
        createdAt: true,
        _count: {
          select: { expenses: true },
        },
      },
    });

    return NextResponse.json({
      status: 'ok',
      users,
    });
  } catch (error: unknown) {
    console.error('Failed to fetch users:', error);
    return NextResponse.json(
      { status: 'error', message: getErrorMessage(error, 'Database error') },
      { status: 500 }
    );
  }
}

// Adding a new household member goes through POST /api/workspace/invite
// instead — it upserts by email (so re-inviting someone doesn't collide),
// sends the actual invite email when Resend is configured, and refuses to
// silently move an email that already belongs to a different household.

export async function PUT(request: Request) {
  const auth = await requireAdmin();
  if ('error' in auth) return auth.error;

  try {
    const body = await request.json();
    if (!body.id) {
      return NextResponse.json(
        { status: 'error', message: 'User id is required' },
        { status: 400 }
      );
    }

    // Only allow editing members of your own household.
    const target = await prisma.user.findUnique({ where: { id: body.id } });
    if (!target || target.householdId !== auth.user.householdId) {
      return NextResponse.json(
        { status: 'error', message: 'User not found in your household' },
        { status: 404 }
      );
    }

    // Prevent demoting the last remaining admin of the household.
    if (target.role === 'ADMIN' && body.role && body.role !== 'ADMIN') {
      const adminCount = await prisma.user.count({
        where: { householdId: auth.user.householdId, role: 'ADMIN' },
      });
      if (adminCount <= 1) {
        return NextResponse.json(
          { status: 'error', message: 'Cannot remove the last admin of the household.' },
          { status: 400 }
        );
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id: body.id },
      data: {
        name: body.name ? body.name.trim() : undefined,
        role: body.role ? (body.role as Role) : undefined,
      },
    });

    if (body.role && body.role !== target.role) {
      logAudit({
        householdId: auth.user.householdId as string,
        actorId: auth.user.id,
        actorName: auth.user.name,
        action: 'ROLE_CHANGE',
        entityType: 'User',
        entityLabel: `${target.name}: ${target.role} → ${body.role}`,
      });
    }

    return NextResponse.json({
      status: 'ok',
      user: updatedUser,
    });
  } catch (error: unknown) {
    console.error('Failed to update user:', error);
    return NextResponse.json(
      { status: 'error', message: getErrorMessage(error, 'Failed to update user') },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  const auth = await requireAdmin();
  if ('error' in auth) return auth.error;

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { status: 'error', message: 'Missing user id' },
        { status: 400 }
      );
    }

    const target = await prisma.user.findUnique({ where: { id } });
    if (!target || target.householdId !== auth.user.householdId) {
      return NextResponse.json(
        { status: 'error', message: 'User not found in your household' },
        { status: 404 }
      );
    }

    if (target.id === auth.user.id) {
      return NextResponse.json(
        { status: 'error', message: 'You cannot remove your own account.' },
        { status: 400 }
      );
    }

    // Check count to prevent deleting the last admin
    if (target.role === 'ADMIN') {
      const adminCount = await prisma.user.count({
        where: { householdId: auth.user.householdId, role: 'ADMIN' },
      });
      if (adminCount <= 1) {
        return NextResponse.json(
          { status: 'error', message: 'Cannot remove the last admin of the household.' },
          { status: 400 }
        );
      }
    }

    await prisma.user.delete({
      where: { id },
    });

    logAudit({
      householdId: auth.user.householdId as string,
      actorId: auth.user.id,
      actorName: auth.user.name,
      action: 'MEMBER_REMOVED',
      entityType: 'User',
      entityLabel: `${target.name} (${target.email})`,
    });

    return NextResponse.json({
      status: 'ok',
      deletedId: id,
    });
  } catch (error: unknown) {
    console.error('Failed to delete user:', error);
    return NextResponse.json(
      { status: 'error', message: getErrorMessage(error, 'Failed to delete user') },
      { status: 500 }
    );
  }
}
