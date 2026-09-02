import { NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';
import { getErrorMessage } from '@/src/lib/errors';
import { requireHouseholdUser } from '@/src/lib/auth';
import { isEmailConfigured, sendVendorEmail } from '@/src/lib/mail';

/**
 * Sends a vendor email that a human has already reviewed/edited in the UI.
 * This route never generates content itself — it only sends exactly the
 * subject/body the signed-in user submits, with replyTo set to their own
 * email so any vendor reply reaches a real person.
 */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireHouseholdUser();
  if ('error' in auth) return auth.error;

  if (!isEmailConfigured()) {
    return NextResponse.json(
      { status: 'error', message: 'Email is not configured yet. Ask an admin to add a RESEND_API_KEY.' },
      { status: 503 }
    );
  }

  try {
    const { id } = await params;
    const body = await request.json();
    const subject = (body.subject || '').trim();
    const emailBody = (body.body || '').trim();

    if (!subject || !emailBody) {
      return NextResponse.json({ status: 'error', message: 'Subject and body are required.' }, { status: 400 });
    }

    const expense = await prisma.expense.findUnique({ where: { id } });
    if (!expense || expense.householdId !== auth.user.householdId) {
      return NextResponse.json({ status: 'error', message: 'Expense not found' }, { status: 404 });
    }
    if (!expense.vendorEmail) {
      return NextResponse.json(
        { status: 'error', message: 'No vendor email is set for this expense.' },
        { status: 400 }
      );
    }

    await sendVendorEmail(expense.vendorEmail, {
      subject,
      body: emailBody,
      senderName: auth.user.name,
      replyTo: auth.user.email,
    });

    return NextResponse.json({ status: 'ok', message: `Email sent to ${expense.vendorEmail}.` });
  } catch (error: unknown) {
    console.error('Failed to send vendor email:', error);
    return NextResponse.json(
      { status: 'error', message: getErrorMessage(error, 'Failed to send email') },
      { status: 500 }
    );
  }
}
