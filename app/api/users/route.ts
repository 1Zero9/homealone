import { NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';
import { Role } from '@prisma/client';

export async function GET() {
  try {
    const users = await prisma.user.findMany({
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
  } catch (error: any) {
    console.error('Failed to fetch users:', error);
    return NextResponse.json(
      { status: 'error', message: error.message || 'Database error' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (!body.name || !body.email) {
      return NextResponse.json(
        { status: 'error', message: 'Name and email are required' },
        { status: 400 }
      );
    }

    const role = (body.role as Role) || Role.MEMBER;

    const user = await prisma.user.create({
      data: {
        name: body.name.trim(),
        email: body.email.trim().toLowerCase(),
        role,
        avatarUrl: body.avatarUrl || null,
      },
    });

    return NextResponse.json({
      status: 'ok',
      user,
    });
  } catch (error: any) {
    console.error('Failed to create user:', error);
    return NextResponse.json(
      { status: 'error', message: error.message || 'Failed to create user' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    if (!body.id) {
      return NextResponse.json(
        { status: 'error', message: 'User id is required' },
        { status: 400 }
      );
    }

    const updatedUser = await prisma.user.update({
      where: { id: body.id },
      data: {
        name: body.name ? body.name.trim() : undefined,
        email: body.email ? body.email.trim().toLowerCase() : undefined,
        role: body.role ? (body.role as Role) : undefined,
      },
    });

    return NextResponse.json({
      status: 'ok',
      user: updatedUser,
    });
  } catch (error: any) {
    console.error('Failed to update user:', error);
    return NextResponse.json(
      { status: 'error', message: error.message || 'Failed to update user' },
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
        { status: 'error', message: 'Missing user id' },
        { status: 400 }
      );
    }

    // Check count to prevent deleting last admin
    const userCount = await prisma.user.count();
    if (userCount <= 1) {
      return NextResponse.json(
        { status: 'error', message: 'Cannot delete the only remaining user in the household.' },
        { status: 400 }
      );
    }

    await prisma.user.delete({
      where: { id },
    });

    return NextResponse.json({
      status: 'ok',
      deletedId: id,
    });
  } catch (error: any) {
    console.error('Failed to delete user:', error);
    return NextResponse.json(
      { status: 'error', message: error.message || 'Failed to delete user' },
      { status: 500 }
    );
  }
}
