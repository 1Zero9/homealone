import { NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';
import { cookies } from 'next/headers';
import { SESSION_COOKIE } from '@/src/lib/auth';

export async function POST() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE)?.value;

    if (token) {
      await prisma.session.deleteMany({
        where: { token },
      });
    }

    const response = NextResponse.json({ status: 'ok' });
    response.cookies.delete(SESSION_COOKIE);
    return response;
  } catch (error: unknown) {
    console.error('Logout error:', error);
    const response = NextResponse.json({ status: 'ok' });
    response.cookies.delete(SESSION_COOKIE);
    return response;
  }
}
