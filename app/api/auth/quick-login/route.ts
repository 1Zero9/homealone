import { NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';
import crypto from 'crypto';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const userId = body.userId;

    if (!userId) {
      return NextResponse.json(
        { status: 'error', message: 'Missing userId' },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json(
        { status: 'error', message: 'User not found' },
        { status: 404 }
      );
    }

    // Create session
    const sessionToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

    await prisma.session.create({
      data: {
        token: sessionToken,
        userId: user.id,
        expiresAt,
      },
    });

    const response = NextResponse.json({
      status: 'ok',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });

    // Set secure cookie
    response.cookies.set({
      name: 'homealone_session',
      value: sessionToken,
      httpOnly: true,
      path: '/',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60,
      secure: process.env.NODE_ENV === 'production',
    });

    return response;
  } catch (error: any) {
    console.error('Quick login failed:', error);
    return NextResponse.json(
      { status: 'error', message: error.message || 'Login failed' },
      { status: 500 }
    );
  }
}
