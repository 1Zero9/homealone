import { NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';
import { requireHouseholdUser } from '@/src/lib/auth';
import { getErrorMessage } from '@/src/lib/errors';

const NON_EUR_CODES = ['GBP', 'USD', 'CAD', 'AUD', 'JPY'];
const STALE_AFTER_MS = 24 * 60 * 60 * 1000;

/**
 * Returns the current EUR-base rate for every supported non-EUR currency,
 * refreshing the cache from Frankfurter first if any row is missing or
 * older than 24h. Self-healing — never depends on a cron having run.
 * See src/utils/currencies.ts's updateLiveRates() for how the client uses
 * this to keep convertCurrency() genuinely live instead of hardcoded.
 */
export async function GET() {
  const auth = await requireHouseholdUser();
  if ('error' in auth) return auth.error;

  try {
    const cached = await prisma.exchangeRate.findMany();
    const now = Date.now();
    const isStale =
      cached.length < NON_EUR_CODES.length ||
      cached.some((row) => now - row.updatedAt.getTime() > STALE_AFTER_MS);

    if (isStale) {
      try {
        const res = await fetch(`https://api.frankfurter.app/latest?from=EUR&to=${NON_EUR_CODES.join(',')}`);
        if (res.ok) {
          const data = await res.json();
          const rates = data?.rates as Record<string, number> | undefined;
          if (rates) {
            await Promise.all(
              Object.entries(rates)
                .filter(([code]) => NON_EUR_CODES.includes(code))
                .map(([code, rateToEur]) =>
                  prisma.exchangeRate.upsert({
                    where: { currency: code },
                    create: { currency: code, rateToEur },
                    update: { rateToEur },
                  })
                )
            );
          }
        }
      } catch (fetchError) {
        // Live fetch failed (e.g. Frankfurter down) — fall through and
        // return whatever's already cached, stale or not, rather than error.
        console.error('Failed to refresh exchange rates, using cached values:', fetchError);
      }
    }

    const current = await prisma.exchangeRate.findMany();
    const rates: Record<string, number> = {};
    for (const row of current) rates[row.currency] = row.rateToEur;

    return NextResponse.json({ status: 'ok', rates });
  } catch (error: unknown) {
    console.error('Failed to load exchange rate cache:', error);
    return NextResponse.json(
      { status: 'error', message: getErrorMessage(error, 'Could not load exchange rates') },
      { status: 500 }
    );
  }
}
