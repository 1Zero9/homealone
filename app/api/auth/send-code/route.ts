import { NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = (body.email || '').trim().toLowerCase();

    if (!email || !email.includes('@')) {
      return NextResponse.json(
        { status: 'error', message: 'Please provide a valid email address.' },
        { status: 400 }
      );
    }

    // Generate 6-digit numeric OTP code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 mins

    // Upsert or create user if first time
    let user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      // Determine default name
      const defaultName = email.split('@')[0];
      const capitalizedName = defaultName.charAt(0).toUpperCase() + defaultName.slice(1);
      user = await prisma.user.create({
        data: {
          email,
          name: capitalizedName,
          role: 'MEMBER',
        },
      });
    }

    // Save verification code
    await prisma.verificationToken.create({
      data: {
        email,
        code,
        expiresAt,
      },
    });

    return NextResponse.json({
      status: 'ok',
      message: `A verification code has been generated for ${email}.`,
      code, // Included so you can sign in directly on any device
    });
  } catch (error: any) {
    console.error('Failed to send code:', error);
    return NextResponse.json(
      { status: 'error', message: error.message || 'Failed to send code' },
      { status: 500 }
    );
  }
}
