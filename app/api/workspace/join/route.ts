import { NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';
import crypto from 'crypto';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const inviteCode = (body.inviteCode || '').trim();
    const email = (body.email || '').trim().toLowerCase();
    const name = (body.name || '').trim();

    if (!inviteCode || !email) {
      return NextResponse.json(
        { status: 'error', message: 'Invite code and email are required.' },
        { status: 400 }
      );
    }

    const household = await prisma.household.findUnique({
      where: { inviteCode },
    });

    if (!household) {
      return NextResponse.json(
        { status: 'error', message: 'Invalid invite code.' },
        { status: 404 }
      );
    }

    const defaultName = name || email.split('@')[0].charAt(0).toUpperCase() + email.split('@')[0].slice(1);

    const user = await prisma.user.upsert({
      where: { email },
      update: {
        householdId: household.id,
        name: name || undefined,
      },
      create: {
        email,
        name: defaultName,
        role: 'MEMBER',
        householdId: household.id,
      },
    });

    // Create session
    const sessionToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    await prisma.session.create({
      data: {
        token: sessionToken,
        userId: user.id,
        expiresAt,
      },
    });

    const response = NextResponse.json({
      status: 'ok',
      message: `Joined ${household.name}!`,
      user,
      workspace: household,
    });

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
    console.error('Failed to join workspace:', error);
    return NextResponse.json(
      { status: 'error', message: error.message || 'Failed to join workspace' },
      { status: 500 }
    );
  }
}
