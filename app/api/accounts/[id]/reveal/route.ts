import { NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';
import { getErrorMessage } from '@/src/lib/errors';
import { requireAdmin } from '@/src/lib/auth';
import { decryptOptional } from '@/src/lib/crypto';

const FIELD_TO_COLUMN: Record<string, string> = {
  accountNumber: 'accountNumberEnc',
  routingNumber: 'routingNumberEnc',
  iban: 'ibanEnc',
  bic: 'bicEnc',
  loginUsername: 'loginUsernameEnc',
  loginPassword: 'loginPasswordEnc',
  loginUrl: 'loginUrlEnc',
  securityNotes: 'securityNotesEnc',
};

/**
 * Reveals ONE decrypted sensitive field for ONE account, on demand.
 * Gated to admins only — these are bank/login credentials, so we don't
 * decrypt them into any list/summary payload, ever.
 */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin();
  if ('error' in auth) return auth.error;

  try {
    const { id } = await params;
    const body = await request.json();
    const field = body.field as string;

    const column = FIELD_TO_COLUMN[field];
    if (!column) {
      return NextResponse.json({ status: 'error', message: 'Unknown field' }, { status: 400 });
    }

    const account = await prisma.account.findUnique({ where: { id } });
    if (!account || account.householdId !== auth.user.householdId) {
      return NextResponse.json({ status: 'error', message: 'Account not found' }, { status: 404 });
    }

    const encValue = (account as unknown as Record<string, string | null>)[column];
    const value = decryptOptional(encValue);

    return NextResponse.json({ status: 'ok', field, value });
  } catch (error: unknown) {
    console.error('Failed to reveal account field:', error);
    return NextResponse.json(
      { status: 'error', message: getErrorMessage(error, 'Failed to decrypt field') },
      { status: 500 }
    );
  }
}
