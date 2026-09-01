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
