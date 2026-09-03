import type { BillingCycle, CurrencyCode } from '../types/expense';
import { CURRENCIES } from './currencies';

/**
 * Formats a monetary value according to currency symbol & decimals.
 * Follows clean European style (€123.45).
 */
export function formatCurrency(
  amount: number,
  currency: CurrencyCode = 'EUR',
  includeDecimals: boolean = true
): string {
  const cfg = CURRENCIES[currency] || CURRENCIES.EUR;
  const num = Math.abs(amount);
  
  const formattedNumber = num.toLocaleString('en-IE', {
    minimumFractionDigits: includeDecimals ? 2 : 0,
    maximumFractionDigits: includeDecimals ? 2 : 0,
  });

  return `${cfg.symbol}${formattedNumber}`;
}

/**
 * Formats billing cycle into a human-readable label.
 */
export function formatBillingCycle(cycle: BillingCycle): string {
  switch (cycle) {
    case 'monthly':
      return '/month';
    case 'annual':
      return '/year';
    case 'quarterly':
      return '/quarter';
    case 'weekly':
      return '/week';
    default:
      return '';
  }
}

export function formatCycleTitle(cycle: BillingCycle): string {
  switch (cycle) {
    case 'monthly':
      return 'Monthly';
    case 'annual':
      return 'Annual';
    case 'quarterly':
      return 'Quarterly';
    case 'weekly':
      return 'Weekly';
    case 'once':
      return 'One-off';
    default:
      return cycle;
  }
}

/**
 * Formats a renewal date into relative days badge.
 */
export function formatRenewalCountdown(days: number): {
  text: string;
  urgency: 'critical' | 'warning' | 'normal' | 'distant';
} {
  if (days < 0) {
    return { text: 'Overdue', urgency: 'critical' };
  }
  if (days === 0) {
    return { text: 'Due today', urgency: 'critical' };
  }
  if (days === 1) {
    return { text: 'Due tomorrow', urgency: 'critical' };
  }
  if (days <= 5) {
    return { text: `Due in ${days} days`, urgency: 'warning' };
  }
  if (days <= 14) {
    return { text: `In ${days} days`, urgency: 'normal' };
  }
  return { text: `In ${days} days`, urgency: 'distant' };
}

/**
 * Formats date string into readable date format.
 */
export function formatDate(dateString?: string): string {
  if (!dateString) return '—';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    return d.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return dateString;
  }
}
