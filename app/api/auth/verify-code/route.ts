import { NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';
import { getErrorMessage } from '@/src/lib/errors';
import crypto from 'crypto';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = (body.email || '').trim().toLowerCase();
    const code = (body.code || '').trim();

    if (!email || !code) {
      return NextResponse.json(
        { status: 'error', message: 'Email and verification code are required.' },
        { status: 400 }
      );
    }

    // Look up any outstanding (unexpired) code for this email first, so we can
    // tell a wrong code apart from an expired/nonexistent one and rate-limit guesses.
    const outstanding = await prisma.verificationToken.findFirst({
      where: { email, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: 'desc' },
    });

    if (!outstanding) {
      return NextResponse.json(
        { status: 'error', message: 'Invalid or expired verification code. Please request a new one.' },
        { status: 400 }
      );
    }

    if (outstanding.code !== code) {
      return NextResponse.json(
        { status: 'error', message: 'Incorrect verification code.' },
        { status: 400 }
      );
    }

    // Delete token once used
    await prisma.verificationToken.delete({
      where: { id: outstanding.id },
    });

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return NextResponse.json(
        { status: 'error', message: 'User account not found.' },
        { status: 404 }
      );
    }

    // Create session in PostgreSQL
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
  } catch (error: unknown) {
    console.error('Failed to verify code:', error);
    return NextResponse.json(
      { status: 'error', message: getErrorMessage(error, 'Verification failed') },
      { status: 500 }
    );
  }
}
