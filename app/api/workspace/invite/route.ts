import { NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';
import { Role } from '@prisma/client';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = (body.email || '').trim().toLowerCase();
    const name = (body.name || '').trim();
    const role = (body.role as Role) || Role.MEMBER;
    const workspaceId = body.workspaceId;

    if (!email || !email.includes('@')) {
      return NextResponse.json(
        { status: 'error', message: 'Please enter a valid email address.' },
        { status: 400 }
      );
    }

    // Find workspace
    let household = workspaceId
      ? await prisma.household.findUnique({ where: { id: workspaceId } })
      : await prisma.household.findFirst();

    if (!household) {
      household = await prisma.household.create({
        data: {
          name: 'Our Household',
          inviteCode: 'home-alone-family',
        },
      });
    }

    // Determine default display name if omitted
    const defaultName = name || email.split('@')[0].charAt(0).toUpperCase() + email.split('@')[0].slice(1);

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

    return NextResponse.json({
      status: 'ok',
      message: `Invited ${user.name} (${user.email}) to ${household.name}.`,
      user,
    });
  } catch (error: any) {
    console.error('Failed to invite to workspace:', error);
    return NextResponse.json(
      { status: 'error', message: error.message || 'Invitation failed' },
      { status: 500 }
    );
  }
}
