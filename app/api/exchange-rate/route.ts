import { NextResponse } from 'next/server';
import { requireHouseholdUser } from '@/src/lib/auth';
import { getErrorMessage } from '@/src/lib/errors';

const VALID_CODES = ['EUR', 'GBP', 'USD', 'CAD', 'AUD', 'JPY'];

export async function GET(request: Request) {
  const auth = await requireHouseholdUser();
  if ('error' in auth) return auth.error;

  const { searchParams } = new URL(request.url);
  const from = (searchParams.get('from') || '').toUpperCase();
  const to = (searchParams.get('to') || '').toUpperCase();

  if (!VALID_CODES.includes(from) || !VALID_CODES.includes(to)) {
    return NextResponse.json(
      { status: 'error', message: 'Unsupported currency code.' },
      { status: 400 }
    );
  }

  if (from === to) {
    return NextResponse.json({ status: 'ok', rate: 1, date: new Date().toISOString().split('T')[0], source: 'same-currency' });
  }

  try {
    // Frankfurter is a free, keyless exchange-rate API backed by daily
    // European Central Bank reference rates — no scraping required.
    const res = await fetch(`https://api.frankfurter.app/latest?from=${from}&to=${to}`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) throw new Error('Rate lookup failed');
    const data = await res.json();
    const rate = data?.rates?.[to];
    if (typeof rate !== 'number') throw new Error('Rate not found in response');

    return NextResponse.json({ status: 'ok', rate, date: data.date as string, source: 'ecb' });
  } catch (error) {
    return NextResponse.json(
      { status: 'error', message: getErrorMessage(error, 'Could not fetch a live exchange rate right now.') },
      { status: 502 }
    );
  }
}
