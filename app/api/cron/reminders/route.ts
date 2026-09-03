import { NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';
import { getErrorMessage } from '@/src/lib/errors';
import { isEmailConfigured, sendContractReminderEmail } from '@/src/lib/mail';
import type { ContractReminderItem } from '@/src/lib/mail';

// Days-out thresholds to alert on. Cron runs once/day, so matching an exact
// day count (rather than "<= N") avoids sending the same reminder repeatedly.
const REMINDER_WINDOWS = [30, 14, 7];

function daysUntil(dateStr: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const [year, month, day] = dateStr.split('-').map(Number);
  const due = new Date(year, (month || 1) - 1, day || 1);
  due.setHours(0, 0, 0, 0);
  return Math.round((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

function getAppUrl(request: Request): string {
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return new URL(request.url).origin;
}

/**
 * Daily cron (see vercel.json) that emails each household a summary of
 * contracts approaching their end date, so someone can call to review,
 * renegotiate or cancel before it auto-renews.
 *
 * Vercel sends `Authorization: Bearer ${CRON_SECRET}` automatically for
 * Cron-triggered requests when the CRON_SECRET env var is set.
 */
export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ status: 'error', message: 'Unauthorized' }, { status: 401 });
    }
  }

  if (!isEmailConfigured()) {
    return NextResponse.json({ status: 'ok', message: 'Email not configured — skipped.', sent: 0 });
  }

  try {
    const expenses = await prisma.expense.findMany({
      where: { isActive: true, isPending: false, contractEndDate: { not: null } },
      include: { household: { include: { users: true } } },
    });

    const dueForReminder = expenses.filter((e) => {
      if (!e.contractEndDate) return false;
      const days = daysUntil(e.contractEndDate);
      return REMINDER_WINDOWS.includes(days);
    });

    const byHousehold = new Map<string, typeof dueForReminder>();
    for (const expense of dueForReminder) {
      if (!expense.householdId) continue;
      const list = byHousehold.get(expense.householdId) || [];
      list.push(expense);
      byHousehold.set(expense.householdId, list);
    }

    const appUrl = getAppUrl(request);
    let sentCount = 0;
    const errors: string[] = [];

    for (const [, items] of byHousehold) {
      const household = items[0].household;
      if (!household) continue;

      const reminderItems: ContractReminderItem[] = items.map((e) => ({
        name: e.name,
        daysLeft: daysUntil(e.contractEndDate as string),
        contractEndDate: e.contractEndDate as string,
        amount: e.amount,
        currency: e.currency,
      }));

      for (const user of household.users) {
        try {
          await sendContractReminderEmail(user.email, {
            householdName: household.name,
            appUrl,
            items: reminderItems,
          });
          sentCount += 1;
        } catch (emailError: unknown) {
          errors.push(getErrorMessage(emailError, `Failed to email ${user.email}`));
        }
      }
    }

    return NextResponse.json({
      status: 'ok',
      householdsNotified: byHousehold.size,
      sent: sentCount,
      errors,
    });
  } catch (error: unknown) {
    console.error('Failed to run contract reminders cron:', error);
    return NextResponse.json(
      { status: 'error', message: getErrorMessage(error, 'Failed to run reminders') },
      { status: 500 }
    );
  }
}
