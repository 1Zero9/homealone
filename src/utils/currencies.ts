import type { CurrencyCode, CurrencyConfig } from '../types/expense';

export const CURRENCIES: Record<CurrencyCode, CurrencyConfig> = {
  EUR: {
    code: 'EUR',
    symbol: '€',
    rateAgainstEUR: 1.0,
    label: 'EUR (€) Euro',
  },
  GBP: {
    code: 'GBP',
    symbol: '£',
    rateAgainstEUR: 0.85,
    label: 'GBP (£) British Pound',
  },
  USD: {
    code: 'USD',
    symbol: '$',
    rateAgainstEUR: 1.09,
    label: 'USD ($) US Dollar',
  },
  CAD: {
    code: 'CAD',
    symbol: 'CA$',
    rateAgainstEUR: 1.48,
    label: 'CAD ($) Canadian Dollar',
  },
  AUD: {
    code: 'AUD',
    symbol: 'A$',
    rateAgainstEUR: 1.64,
    label: 'AUD ($) Australian Dollar',
  },
  JPY: {
    code: 'JPY',
    symbol: '¥',
    rateAgainstEUR: 160.0,
    label: 'JPY (¥) Japanese Yen',
  },
};

export const CURRENCY_LIST = Object.values(CURRENCIES);

/**
 * Overwrites the rateAgainstEUR values above in place with live-fetched
 * numbers (from GET /api/exchange-rate-cache). Every convertCurrency() call
 * reads CURRENCIES[code].rateAgainstEUR at call time, not at import time, so
 * this one mutation makes every existing call site (Overview, Budgets,
 * ExpenseList, category charts, etc.) live with zero changes to any of
 * them. Silently ignores unknown codes or non-finite values; safe to call
 * with an empty or partial object if the cache fetch failed or hasn't
 * populated every currency yet — unmentioned codes simply keep whatever
 * rate they already had (the hardcoded default until the first live fetch).
 */
export function updateLiveRates(rates: Partial<Record<CurrencyCode, number>>): void {
  for (const [code, rate] of Object.entries(rates) as [CurrencyCode, number][]) {
    if (CURRENCIES[code] && typeof rate === 'number' && Number.isFinite(rate) && rate > 0) {
      CURRENCIES[code].rateAgainstEUR = rate;
    }
  }
}
