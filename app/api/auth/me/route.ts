import { NextResponse } from 'next/server';
import { getSessionUser } from '@/src/lib/auth';

export async function GET() {
  try {
    // Routed through getSessionUser() (rather than querying the Session
    // table directly) so this endpoint also benefits from sliding
    // session expiration — every "am I still logged in?" check counts
    // as activity that keeps the session alive.
    const user = await getSessionUser();

    if (!user) {
      return NextResponse.json(
        { status: 'unauthenticated' },
        { status: 200 }
      );
    }

    return NextResponse.json({
      status: 'authenticated',
      user,
    });
  } catch (error: unknown) {
    console.error('Session check failed:', error);
    return NextResponse.json(
      { status: 'unauthenticated' },
      { status: 200 }
    );
  }
}
