import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Kept as a literal (rather than importing SESSION_COOKIE from
// src/lib/auth.ts) so this Edge middleware doesn't pull in Prisma's
// Node-only runtime, which isn't supported in the Edge Runtime.
const SESSION_COOKIE = 'tally_session';

// Cookies have a fixed lifetime once set — they don't know about the
// sliding expiration we apply to the underlying DB session (see
// getSessionUser in src/lib/auth.ts). Without this, a signed-in user's
// browser cookie would still hard-expire 30 days after their *first*
// login, even if they used the app every day since. Refreshing the
// cookie's maxAge here on every request keeps it in step with the DB
// session, so anyone who visits at least once every 30 days stays
// signed in indefinitely.
const SESSION_COOKIE_MAX_AGE = 30 * 24 * 60 * 60;

export function middleware(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const response = NextResponse.next();

  if (token) {
    response.cookies.set({
      name: SESSION_COOKIE,
      value: token,
      httpOnly: true,
      path: '/',
      sameSite: 'lax',
      maxAge: SESSION_COOKIE_MAX_AGE,
      secure: process.env.NODE_ENV === 'production',
    });
  }

  return response;
}

export const config = {
  matcher: '/((?!_next/static|_next/image|favicon.ico).*)',
};
