import { NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';
import { getErrorMessage } from '@/src/lib/errors';
import { isEmailConfigured, sendVerificationCodeEmail } from '@/src/lib/mail';

const CODE_TTL_MS = 15 * 60 * 1000;
const RESEND_COOLDOWN_MS = 30 * 1000;

// This app is single-tenant / invite-only: nobody can self-register. A code
// is only ever issued to an email that already exists as a User record
// (created by an admin via the "Share workspace" invite flow). We still
// return a generic success-shaped message either way so this endpoint can't
// be used to enumerate which emails have accounts.
const GENERIC_MESSAGE = 'If that email has access, a verification code has been sent.';

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

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      // Don't reveal whether the account exists — just look like success.
      return NextResponse.json({ status: 'ok', message: GENERIC_MESSAGE });
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
