import { NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';
import { Role } from '@prisma/client';

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

    // Ensure primary household exists
    let household = await prisma.household.findFirst();
    if (!household) {
      household = await prisma.household.create({
        data: {
          name: body.householdName?.trim() || 'Our Household',
          inviteCode: 'home-alone-family',
        },
      });
    }

    // Upsert or create user if first time
    let user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      // Determine role: onezeronine@gmail.com is always ADMIN, everyone else defaults to MEMBER
      const role = email === 'onezeronine@gmail.com' ? Role.ADMIN : Role.MEMBER;
      const defaultName = body.name?.trim() || email.split('@')[0].charAt(0).toUpperCase() + email.split('@')[0].slice(1);

      user = await prisma.user.create({
        data: {
          email,
          name: defaultName,
          role,
          householdId: household.id,
        },
      });
    } else {
      const updateData: any = {};
      if (body.name && body.name.trim()) {
        updateData.name = body.name.trim();
      }
      if (email === 'onezeronine@gmail.com' && user.role !== Role.ADMIN) {
        updateData.role = Role.ADMIN;
      }
      if (!user.householdId && household) {
        updateData.householdId = household.id;
      }
      if (Object.keys(updateData).length > 0) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: updateData,
        });
      }
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
      code, // Included for instant verification
    });
  } catch (error: any) {
    console.error('Failed to send code:', error);
    return NextResponse.json(
      { status: 'error', message: error.message || 'Failed to send code' },
      { status: 500 }
    );
  }
}
