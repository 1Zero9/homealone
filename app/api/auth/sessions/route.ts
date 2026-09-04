import { NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';
import { getErrorMessage } from '@/src/lib/errors';
import { requireUser, SESSION_COOKIE } from '@/src/lib/auth';

/**
 * Signs the current user out of every device/browser at once, by deleting
 * all of their Session rows — useful after a lost device or if a session
 * token may have leaked. The current browser is signed out too (its cookie
 * is cleared below), so the caller should redirect to the login screen.
 */
export async function DELETE() {
  const auth = await requireUser();
  if ('error' in auth) return auth.error;

  try {
    await prisma.session.deleteMany({ where: { userId: auth.user.id } });

    const response = NextResponse.json({ status: 'ok' });
    response.cookies.delete(SESSION_COOKIE);
    return response;
  } catch (error: unknown) {
    console.error('Failed to revoke sessions:', error);
    return NextResponse.json(
      { status: 'error', message: getErrorMessage(error, 'Failed to sign out of other devices') },
      { status: 500 }
    );
  }
}
