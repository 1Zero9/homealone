// Force a positive-UTC-offset timezone (Dublin, BST = UTC+1 in summer) so
// the regression test below actually exercises the local-vs-UTC mismatch
// that caused the real bug this guards against — a UTC-only test
// environment would never have caught it.
process.env.TZ = 'Europe/Dublin';

import { describe, it, expect, vi, afterEach } from 'vitest';
import { advanceByCycle, rolloverIfDue } from '../billing';

describe('advanceByCycle', () => {
  it('advances weekly by 7 days', () => {
    expect(advanceByCycle('2026-01-15', 'weekly')).toBe('2026-01-22');
  });

  it('advances monthly by one month, same day', () => {
    expect(advanceByCycle('2026-01-15', 'monthly')).toBe('2026-02-15');
  });

  it('advances quarterly by 3 months', () => {
    expect(advanceByCycle('2026-01-15', 'quarterly')).toBe('2026-04-15');
  });

  it('advances termly by 4 months', () => {
    expect(advanceByCycle('2026-01-15', 'termly')).toBe('2026-05-15');
  });

  it('advances annual by one year', () => {
    expect(advanceByCycle('2026-01-15', 'annual')).toBe('2027-01-15');
  });

  it('never advances a one-off payment', () => {
    expect(advanceByCycle('2026-01-15', 'once')).toBe('2026-01-15');
  });

  it('clamps day-of-month to 28 to avoid month-length overflow', () => {
    // Jan 31 -> clamped to 28 before adding a month, so Feb 28, not Mar 3.
    expect(advanceByCycle('2026-01-31', 'monthly')).toBe('2026-02-28');
  });

  it('clamps correctly across a leap-year February', () => {
    expect(advanceByCycle('2024-01-31', 'monthly')).toBe('2024-02-28');
  });

  it('clamps day-of-month to 28 for every cycle type, not just when the target month needs it', () => {
    // The 28-day clamp is unconditional (applied before the switch), so an
    // annual advance from the 29th also comes back as the 28th even though
    // every target year actually has a 29th of January — a minor
    // over-clamp, but the current, intentional behavior worth pinning down
    // so a future refactor doesn't change it by accident either way.
    expect(advanceByCycle('2024-01-29', 'annual')).toBe('2025-01-28');
  });

  it('regression: does not drift a day backward in a positive-UTC-offset timezone', () => {
    // This is exactly the shape of the real bug: formatDateOnly used to
    // build the string via toISOString() (UTC), while parseDateOnly always
    // built the input Date from local components. In Europe/Dublin during
    // BST (UTC+1), a local midnight Date converted via toISOString() lands
    // on the *previous* calendar day, silently shifting every rollover back
    // by one and compounding on repeated advances.
    const oneMonthLater = advanceByCycle('2026-06-15', 'monthly');
    expect(oneMonthLater).toBe('2026-07-15');
    // Compounding check: three monthly advances from an overdue date should
    // land on exactly the third month, not drift to the 14th.
    let d = '2026-06-15';
    for (let i = 0; i < 3; i++) d = advanceByCycle(d, 'monthly');
    expect(d).toBe('2026-09-15');
  });
});

describe('rolloverIfDue', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('does not roll a bill that is not yet due', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 0, 1)); // 2026-01-01
    const result = rolloverIfDue({ nextRenewalDate: '2026-01-15', billingCycle: 'monthly', isPaidThisCycle: true });
    expect(result).toEqual({ changed: false, nextRenewalDate: '2026-01-15', isPaidThisCycle: true });
  });

  it('does not roll a bill due exactly today (due, not yet overdue)', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 0, 15));
    const result = rolloverIfDue({ nextRenewalDate: '2026-01-15', billingCycle: 'monthly', isPaidThisCycle: false });
    expect(result.changed).toBe(false);
  });

  it('rolls forward once for a bill one cycle overdue and resets paid status', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 1, 1)); // 2026-02-01
    const result = rolloverIfDue({ nextRenewalDate: '2026-01-15', billingCycle: 'monthly', isPaidThisCycle: true });
    expect(result).toEqual({ changed: true, nextRenewalDate: '2026-02-15', isPaidThisCycle: false });
  });

  it('rolls forward multiple cycles for a bill several months overdue', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 4, 20)); // 2026-05-20
    const result = rolloverIfDue({ nextRenewalDate: '2026-01-15', billingCycle: 'monthly', isPaidThisCycle: true });
    // Jan 15 -> Feb 15 -> Mar 15 -> Apr 15 -> May 15 (still before May 20, one more)
    expect(result.nextRenewalDate).toBe('2026-06-15');
    expect(result.changed).toBe(true);
    expect(result.isPaidThisCycle).toBe(false);
  });

  it('never rolls a one-off payment, however overdue', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2027, 0, 1));
    const result = rolloverIfDue({ nextRenewalDate: '2026-01-15', billingCycle: 'once', isPaidThisCycle: false });
    expect(result).toEqual({ changed: false, nextRenewalDate: '2026-01-15', isPaidThisCycle: false });
  });

  it('stops at the 24-iteration guard rather than looping forever on an absurdly overdue weekly bill', () => {
    vi.useFakeTimers();
    // ~10 years overdue on a weekly cycle — thousands of cycles behind.
    vi.setSystemTime(new Date(2036, 0, 1));
    const result = rolloverIfDue({ nextRenewalDate: '2026-01-15', billingCycle: 'weekly', isPaidThisCycle: true });
    expect(result.changed).toBe(true);
    // Guard caps at 24 iterations of +7 days each from the original date.
    expect(result.nextRenewalDate).toBe(advanceByCycle(
      Array.from({ length: 23 }).reduce((d: string) => advanceByCycle(d, 'weekly'), '2026-01-15'),
      'weekly'
    ));
  });
});
