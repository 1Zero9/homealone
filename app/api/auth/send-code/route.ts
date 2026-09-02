import { NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';
import { getErrorMessage } from '@/src/lib/errors';
import { Role, Prisma } from '@prisma/client';
import { isEmailConfigured, sendVerificationCodeEmail } from '@/src/lib/mail';

const CODE_TTL_MS = 15 * 60 * 1000;
const RESEND_COOLDOWN_MS = 30 * 1000;

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

    // Basic anti-spam: refuse to issue a new code if one was just sent.
    const recent = await prisma.verificationToken.findFirst({
      where: { email, createdAt: { gt: new Date(Date.now() - RESEND_COOLDOWN_MS) } },
      orderBy: { createdAt: 'desc' },
    });
    if (recent) {
      return NextResponse.json(
        { status: 'error', message: 'A code was already sent. Please wait a moment before requesting another.' },
        { status: 429 }
      );
    }

    // Generate 6-digit numeric OTP code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + CODE_TTL_MS);

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
      const updateData: Prisma.UserUpdateInput = {};
      if (body.name && body.name.trim()) {
        updateData.name = body.name.trim();
      }
      if (email === 'onezeronine@gmail.com' && user.role !== Role.ADMIN) {
        updateData.role = Role.ADMIN;
      }
      if (!user.householdId && household) {
        updateData.household = { connect: { id: household.id } };
      }
      if (Object.keys(updateData).length > 0) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: updateData,
        });
      }
    }

    // Invalidate any previous outstanding codes for this email, then issue a new one.
    await prisma.verificationToken.deleteMany({ where: { email } });
    await prisma.verificationToken.create({
      data: {
        email,
        code,
        expiresAt,
      },
    });

    // The code must NEVER be returned in the API response or shown in the
    // browser, since that would let anyone sign in as anyone just by knowing
    // their email. Always log server-side as a fallback/debug trail.
    console.log(`[auth] Verification code for ${email}: ${code} (expires ${expiresAt.toISOString()})`);

    if (isEmailConfigured()) {
      try {
        await sendVerificationCodeEmail(email, code);
      } catch (emailError: unknown) {
        console.error('Failed to send verification email:', emailError);
        return NextResponse.json(
          { status: 'error', message: 'Failed to send the verification email. Please try again.' },
          { status: 502 }
        );
      }
    }

    return NextResponse.json({
      status: 'ok',
      message: isEmailConfigured()
        ? `A verification code has been sent to ${email}.`
        : `Email isn't configured yet — check the server logs for the verification code.`,
    });
  } catch (error: unknown) {
    console.error('Failed to send code:', error);
    return NextResponse.json(
      { status: 'error', message: getErrorMessage(error, 'Failed to send code') },
      { status: 500 }
    );
  }
}
