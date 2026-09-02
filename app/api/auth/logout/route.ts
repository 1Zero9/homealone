import { NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';
import { cookies } from 'next/headers';

export async function POST() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('homealone_session')?.value;

    if (token) {
      await prisma.session.deleteMany({
        where: { token },
      });
    }

    const response = NextResponse.json({ status: 'ok' });
    response.cookies.delete('homealone_session');
    return response;
  } catch (error: unknown) {
    console.error('Logout error:', error);
    const response = NextResponse.json({ status: 'ok' });
    response.cookies.delete('homealone_session');
    return response;
  }
}
