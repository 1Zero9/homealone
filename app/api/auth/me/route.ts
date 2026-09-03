import { NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';
import { cookies } from 'next/headers';
import { SESSION_COOKIE } from '@/src/lib/auth';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE)?.value;

    if (!token) {
      return NextResponse.json(
        { status: 'unauthenticated' },
        { status: 200 }
      );
    }

    const session = await prisma.session.findUnique({
      where: { token },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            avatarUrl: true,
          },
        },
      },
    });

    if (!session || session.expiresAt < new Date()) {
      return NextResponse.json(
        { status: 'unauthenticated' },
        { status: 200 }
      );
    }

    return NextResponse.json({
      status: 'authenticated',
      user: session.user,
    });
  } catch (error: unknown) {
    console.error('Session check failed:', error);
    return NextResponse.json(
      { status: 'unauthenticated' },
      { status: 200 }
    );
  }
}
