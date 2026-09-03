import { NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';
import { getErrorMessage } from '@/src/lib/errors';
import { requireAdmin } from '@/src/lib/auth';
import { decryptOptional } from '@/src/lib/crypto';

export type StatementFieldMatch = 'match' | 'mismatch' | 'not_set' | 'no_data';

function normalize(value: string): string {
  return value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
}

function compareField(extracted: string | null | undefined, encStored: string | null): StatementFieldMatch {
  if (!encStored) return 'not_set';
  if (!extracted) return 'no_data';
  const stored = decryptOptional(encStored);
  if (!stored) return 'no_data';
  const normExtracted = normalize(extracted);
  const normStored = normalize(stored);
  if (!normExtracted || !normStored) return 'no_data';
  // Statements often mask all but the last few digits, so only compare the
  // tail that's realistically printed on both sides.
  const tailLen = Math.min(4, normExtracted.length, normStored.length);
  return normExtracted.slice(-tailLen) === normStored.slice(-tailLen) ? 'match' : 'mismatch';
}

/**
 * Compares account-level details read off an uploaded statement (account
 * number, sort code) against the encrypted details already saved for one of
 * the household's accounts — without ever returning the decrypted stored
 * value itself, only a match/mismatch/not_set signal. Admin-gated, same as
 * the reveal endpoint, since it involves decrypting stored credentials.
 */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin();
  if ('error' in auth) return auth.error;

  try {
    const { id } = await params;
    const body = await request.json();
    const accountNumber = typeof body.accountNumber === 'string' ? body.accountNumber : null;
    const sortCode = typeof body.sortCode === 'string' ? body.sortCode : null;

    const account = await prisma.account.findUnique({ where: { id } });
    if (!account || account.householdId !== auth.user.householdId) {
      return NextResponse.json({ status: 'error', message: 'Account not found' }, { status: 404 });
    }

    return NextResponse.json({
      status: 'ok',
      accountNumber: compareField(accountNumber, account.accountNumberEnc),
      routingNumber: compareField(sortCode, account.routingNumberEnc),
    });
  } catch (error: unknown) {
    console.error('Failed to compare statement account details:', error);
    return NextResponse.json(
      { status: 'error', message: getErrorMessage(error, 'Failed to compare account details') },
      { status: 500 }
    );
  }
}
