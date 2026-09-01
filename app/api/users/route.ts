import { NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';

export async function GET() {
  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        avatarUrl: true,
      },
    });

    return NextResponse.json({
      status: 'ok',
      users,
    });
  } catch (error: any) {
    console.error('Failed to fetch users:', error);
    return NextResponse.json(
      {
        status: 'error',
        message: error.message || 'Failed to fetch users',
        users: [
          { id: 'usr-stephen', name: 'Stephen', email: 'scranfield@gmail.com', role: 'ADMIN' },
          { id: 'usr-wife', name: 'Wife / Partner', email: 'wife@homealone.local', role: 'MEMBER' },
          { id: 'usr-backup', name: 'Admin Backup', email: 'backup-admin@homealone.local', role: 'BACKUP_ADMIN' },
        ],
      },
      { status: 200 }
    );
  }
}
