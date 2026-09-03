import type { BillingCycle } from '@/src/types/expense';

function parseDateOnly(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, (month || 1) - 1, day || 1);
}

function formatDateOnly(date: Date): string {
  return date.toISOString().split('T')[0];
}

function today(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Advances a YYYY-MM-DD date string forward by one billing cycle.
 * Clamps the day-of-month to 28 to avoid month-length overflow issues.
 */
export function advanceByCycle(dateStr: string, cycle: BillingCycle): string {
  const current = parseDateOnly(dateStr);
  const day = Math.min(current.getDate(), 28);
  let next: Date;

  switch (cycle) {
    case 'once':
      // One-off payments never recur — leave the date as-is.
      return dateStr;
    case 'weekly':
      next = new Date(current.getFullYear(), current.getMonth(), current.getDate() + 7);
      break;
    case 'quarterly':
      next = new Date(current.getFullYear(), current.getMonth() + 3, day);
      break;
    case 'termly':
      next = new Date(current.getFullYear(), current.getMonth() + 4, day);
      break;
    case 'annual':
      next = new Date(current.getFullYear() + 1, current.getMonth(), day);
      break;
    case 'monthly':
    default:
      next = new Date(current.getFullYear(), current.getMonth() + 1, day);
      break;
  }

  return formatDateOnly(next);
}

export interface RolloverInput {
  nextRenewalDate: string;
  billingCycle: BillingCycle;
  isPaidThisCycle: boolean;
}

export interface RolloverResult {
  changed: boolean;
  nextRenewalDate: string;
  isPaidThisCycle: boolean;
}

/**
 * If a bill's due date has passed, roll it forward to the next cycle and
 * reset its paid status — this is what gives us "recurring bills" without
 * a cron job: we lazily catch up whenever the record is read.
 */
export function rolloverIfDue(item: RolloverInput): RolloverResult {
  let { nextRenewalDate, isPaidThisCycle } = item;

  // One-off payments don't recur, so they should never roll forward —
  // once the date passes it just sits there as overdue/unpaid until the
  // user marks it paid or deletes it.
  if (item.billingCycle === 'once') {
    return { changed: false, nextRenewalDate, isPaidThisCycle };
  }

  const t = today();
  let changed = false;
  let guard = 0;

  while (parseDateOnly(nextRenewalDate) < t && guard < 24) {
    nextRenewalDate = advanceByCycle(nextRenewalDate, item.billingCycle);
    isPaidThisCycle = false;
    changed = true;
    guard += 1;
  }

  return { changed, nextRenewalDate, isPaidThisCycle };
}
