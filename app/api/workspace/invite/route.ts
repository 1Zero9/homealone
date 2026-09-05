import { NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';
import { getErrorMessage } from '@/src/lib/errors';
import { Role } from '@prisma/client';
import { requireAdmin } from '@/src/lib/auth';
import { isEmailConfigured, sendInviteEmail } from '@/src/lib/mail';

export async function POST(request: Request) {
  const auth = await requireAdmin();
  if ('error' in auth) return auth.error;

  try {
    const body = await request.json();
    const email = (body.email || '').trim().toLowerCase();
    const name = (body.name || '').trim();
    // Only an ADMIN can grant ADMIN; otherwise default to MEMBER.
    const requestedRole = (body.role as Role) || Role.MEMBER;
    const role = requestedRole === Role.ADMIN && auth.user.role === Role.ADMIN ? Role.ADMIN : Role.MEMBER;

    if (!email || !email.includes('@')) {
      return NextResponse.json(
        { status: 'error', message: 'Please enter a valid email address.' },
        { status: 400 }
      );
    }

    // Invites always target the admin's own household.
    const household = await prisma.household.findUnique({ where: { id: auth.user.householdId } });
    if (!household) {
      return NextResponse.json(
        { status: 'error', message: 'Household not found.' },
        { status: 404 }
      );
    }

    // Determine default display name if omitted
    const defaultName = name || email.split('@')[0].charAt(0).toUpperCase() + email.split('@')[0].slice(1);

    // Refuse to silently move someone else's household membership — this
    // email might belong to a real person already settled in a different
    // household, not just an unclaimed invite.
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser && existingUser.householdId && existingUser.householdId !== household.id) {
      return NextResponse.json(
        { status: 'error', message: 'This email already belongs to a different household.' },
        { status: 409 }
      );
    }

    // Upsert or link user
    const user = await prisma.user.upsert({
      where: { email },
      update: {
        householdId: household.id,
        role: role || undefined,
        name: name || undefined,
      },
      create: {
        email,
        name: defaultName,
        role,
        householdId: household.id,
      },
    });

    let emailSent = false;
    if (isEmailConfigured()) {
      try {
        const origin = request.headers.get('origin') || new URL(request.url).origin;
        await sendInviteEmail(email, {
          inviterName: auth.user.name,
          householdName: household.name,
          appUrl: origin,
        });
        emailSent = true;
      } catch (emailError: unknown) {
        console.error('Failed to send invite email:', emailError);
      }
    }

    return NextResponse.json({
      status: 'ok',
      message: emailSent
        ? `Invited ${user.name} (${user.email}) to ${household.name} — an email was sent.`
        : `Invited ${user.name} (${user.email}) to ${household.name}.`,
      user,
    });
  } catch (error: unknown) {
    console.error('Failed to invite to workspace:', error);
    return NextResponse.json(
      { status: 'error', message: getErrorMessage(error, 'Invitation failed') },
      { status: 500 }
    );
  }
}
