import { NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';
import { getErrorMessage } from '@/src/lib/errors';
import { requireHouseholdUser } from '@/src/lib/auth';
import { encryptOptional, isEncryptionConfigured } from '@/src/lib/crypto';

const SENSITIVE_FIELDS = [
  'accountNumber',
  'routingNumber',
  'iban',
  'bic',
  'loginUsername',
  'loginPassword',
  'loginUrl',
  'securityNotes',
] as const;

/**
 * Never select the raw *Enc columns for list responses — only a boolean
 * "has this field" flag, plus a masked last-4 hint for the account number
 * (handy for telling accounts apart without a reveal call).
 */
function toPublicAccount(account: Record<string, unknown>) {
  const { accountNumberEnc, routingNumberEnc, ibanEnc, bicEnc, loginUsernameEnc, loginPasswordEnc, loginUrlEnc, securityNotesEnc, ...rest } =
    account as {
      accountNumberEnc: string | null;
      routingNumberEnc: string | null;
      ibanEnc: string | null;
      bicEnc: string | null;
      loginUsernameEnc: string | null;
      loginPasswordEnc: string | null;
      loginUrlEnc: string | null;
      securityNotesEnc: string | null;
      [key: string]: unknown;
    };

  return {
    ...rest,
    hasAccountNumber: !!accountNumberEnc,
    hasRoutingNumber: !!routingNumberEnc,
    hasIban: !!ibanEnc,
    hasBic: !!bicEnc,
    hasLoginUsername: !!loginUsernameEnc,
    hasLoginPassword: !!loginPasswordEnc,
    hasLoginUrl: !!loginUrlEnc,
    hasSecurityNotes: !!securityNotesEnc,
  };
}

export async function GET() {
  const auth = await requireHouseholdUser();
  if ('error' in auth) return auth.error;

  try {
    const accounts = await prisma.account.findMany({
      where: { householdId: auth.user.householdId },
      orderBy: { createdAt: 'asc' },
      include: {
        createdBy: { select: { id: true, name: true, role: true } },
        _count: { select: { expenses: true, incomes: true } },
      },
    });

    return NextResponse.json({
      status: 'ok',
      accounts: accounts.map(toPublicAccount),
      encryptionConfigured: isEncryptionConfigured(),
    });
  } catch (error: unknown) {
    console.error('Failed to fetch accounts from PostgreSQL:', error);
    return NextResponse.json(
      { status: 'error', message: getErrorMessage(error, 'Database error') },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const auth = await requireHouseholdUser();
  if ('error' in auth) return auth.error;

  try {
    const body = await request.json();

    const hasSensitiveInput = SENSITIVE_FIELDS.some((f) => typeof body[f] === 'string' && body[f].trim() !== '');
    if (hasSensitiveInput && !isEncryptionConfigured()) {
      return NextResponse.json(
        {
          status: 'error',
          message:
            'Credential storage is not configured on this server. Set CREDENTIALS_ENCRYPTION_KEY before saving account numbers or login details.',
        },
        { status: 400 }
      );
    }

    if (!body.name || typeof body.name !== 'string') {
      return NextResponse.json({ status: 'error', message: 'Account name is required' }, { status: 400 });
    }

    const newAccount = await prisma.account.create({
      data: {
        name: body.name,
        institution: body.institution || null,
        type: body.type || 'OTHER',
        currency: body.currency || 'EUR',
        notes: body.notes || null,
        isActive: typeof body.isActive === 'boolean' ? body.isActive : true,

        accountNumberEnc: encryptOptional(body.accountNumber),
        routingNumberEnc: encryptOptional(body.routingNumber),
        ibanEnc: encryptOptional(body.iban),
        bicEnc: encryptOptional(body.bic),
        loginUsernameEnc: encryptOptional(body.loginUsername),
        loginPasswordEnc: encryptOptional(body.loginPassword),
        loginUrlEnc: encryptOptional(body.loginUrl),
        securityNotesEnc: encryptOptional(body.securityNotes),

        originalAmount: body.originalAmount != null ? Number(body.originalAmount) : null,
        interestRate: body.interestRate != null ? Number(body.interestRate) : null,
        termMonths: body.termMonths != null ? Number(body.termMonths) : null,
        payoffDate: body.payoffDate || null,

        createdById: auth.user.id,
        householdId: auth.user.householdId,
      },
      include: {
        createdBy: { select: { id: true, name: true, role: true } },
        _count: { select: { expenses: true, incomes: true } },
      },
    });

    return NextResponse.json({ status: 'ok', account: toPublicAccount(newAccount) });
  } catch (error: unknown) {
    console.error('Failed to create account:', error);
    return NextResponse.json(
      { status: 'error', message: getErrorMessage(error, 'Failed to create record') },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  const auth = await requireHouseholdUser();
  if ('error' in auth) return auth.error;

  try {
    const body = await request.json();
    if (!body.id) {
      return NextResponse.json({ status: 'error', message: 'Missing account id' }, { status: 400 });
    }

    const existing = await prisma.account.findUnique({ where: { id: body.id } });
    if (!existing || existing.householdId !== auth.user.householdId) {
      return NextResponse.json({ status: 'error', message: 'Account not found' }, { status: 404 });
    }

    const hasSensitiveInput = SENSITIVE_FIELDS.some((f) => typeof body[f] === 'string' && body[f].trim() !== '');
    if (hasSensitiveInput && !isEncryptionConfigured()) {
      return NextResponse.json(
        {
          status: 'error',
          message:
            'Credential storage is not configured on this server. Set CREDENTIALS_ENCRYPTION_KEY before saving account numbers or login details.',
        },
        { status: 400 }
      );
    }

    // Sensitive fields: undefined = leave untouched, '' = clear, non-empty = re-encrypt.
    const sensitiveUpdates: Record<string, string | null> = {};
    const fieldToColumn: Record<(typeof SENSITIVE_FIELDS)[number], string> = {
      accountNumber: 'accountNumberEnc',
      routingNumber: 'routingNumberEnc',
      iban: 'ibanEnc',
      bic: 'bicEnc',
      loginUsername: 'loginUsernameEnc',
      loginPassword: 'loginPasswordEnc',
      loginUrl: 'loginUrlEnc',
      securityNotes: 'securityNotesEnc',
    };
    for (const field of SENSITIVE_FIELDS) {
      if (body[field] === undefined) continue;
      const column = fieldToColumn[field];
      sensitiveUpdates[column] = body[field] === '' ? null : encryptOptional(body[field]);
    }

    const updated = await prisma.account.update({
      where: { id: body.id },
      data: {
        name: body.name ?? existing.name,
        institution: body.institution !== undefined ? body.institution || null : existing.institution,
        type: body.type ?? existing.type,
        currency: body.currency ?? existing.currency,
        notes: body.notes !== undefined ? body.notes || null : existing.notes,
        isActive: typeof body.isActive === 'boolean' ? body.isActive : existing.isActive,

        originalAmount: body.originalAmount !== undefined ? (body.originalAmount != null ? Number(body.originalAmount) : null) : existing.originalAmount,
        interestRate: body.interestRate !== undefined ? (body.interestRate != null ? Number(body.interestRate) : null) : existing.interestRate,
        termMonths: body.termMonths !== undefined ? (body.termMonths != null ? Number(body.termMonths) : null) : existing.termMonths,
        payoffDate: body.payoffDate !== undefined ? body.payoffDate || null : existing.payoffDate,

        ...sensitiveUpdates,
      },
      include: {
        createdBy: { select: { id: true, name: true, role: true } },
        _count: { select: { expenses: true, incomes: true } },
      },
    });

    return NextResponse.json({ status: 'ok', account: toPublicAccount(updated) });
  } catch (error: unknown) {
    console.error('Failed to update account:', error);
    return NextResponse.json(
      { status: 'error', message: getErrorMessage(error, 'Failed to update record') },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  const auth = await requireHouseholdUser();
  if ('error' in auth) return auth.error;

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ status: 'error', message: 'Missing id query parameter' }, { status: 400 });
    }

    const existing = await prisma.account.findUnique({ where: { id } });
    if (!existing || existing.householdId !== auth.user.householdId) {
      return NextResponse.json({ status: 'error', message: 'Account not found' }, { status: 404 });
    }

    await prisma.account.delete({ where: { id } });

    return NextResponse.json({ status: 'ok', deletedId: id });
  } catch (error: unknown) {
    console.error('Failed to delete account:', error);
    return NextResponse.json(
      { status: 'error', message: getErrorMessage(error, 'Failed to delete record') },
      { status: 500 }
    );
  }
}
