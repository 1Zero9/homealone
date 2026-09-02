import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/src/lib/prisma';
import type { Role } from '@prisma/client';

export const SESSION_COOKIE = 'homealone_session';

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  householdId: string | null;
}

/**
 * Reads the session cookie and returns the authenticated user, or null.
 * This is the ONLY source of truth for "who is making this request" —
 * never trust a userId/householdId/role passed in a request body.
 */
export async function getSessionUser(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const session = await prisma.session.findUnique({
    where: { token },
    include: { user: true },
  });

  if (!session || session.expiresAt < new Date()) return null;

  const { user } = session;
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    householdId: user.householdId,
  };
}

export function unauthorized(message = 'Authentication required') {
  return NextResponse.json({ status: 'error', message }, { status: 401 });
}

export function forbidden(message = 'You do not have permission to do that') {
  return NextResponse.json({ status: 'error', message }, { status: 403 });
}

/**
 * Requires a logged-in user with a household. Returns either the user
 * or a ready-to-return NextResponse describing the failure.
 */
export async function requireUser(): Promise<
  { user: SessionUser } | { error: NextResponse }
> {
  const user = await getSessionUser();
  if (!user) return { error: unauthorized() };
  return { user };
}

export async function requireHouseholdUser(): Promise<
  { user: SessionUser & { householdId: string } } | { error: NextResponse }
> {
  const user = await getSessionUser();
  if (!user) return { error: unauthorized() };
  if (!user.householdId) {
    return {
      error: NextResponse.json(
        { status: 'error', message: 'You are not part of a household yet.' },
        { status: 400 }
      ),
    };
  }
  return { user: user as SessionUser & { householdId: string } };
}

export async function requireAdmin(): Promise<
  { user: SessionUser & { householdId: string } } | { error: NextResponse }
> {
  const result = await requireHouseholdUser();
  if ('error' in result) return result;
  if (result.user.role !== 'ADMIN' && result.user.role !== 'BACKUP_ADMIN') {
    return { error: forbidden('Admin access required') };
  }
  return result;
}
