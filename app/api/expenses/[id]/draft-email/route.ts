import { NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';
import { getErrorMessage } from '@/src/lib/errors';
import { requireHouseholdUser } from '@/src/lib/auth';
import { draftVendorEmail, isAiConfigured } from '@/src/lib/ai';
import type { VendorEmailIntent } from '@/src/lib/ai';
import type { BillingCycle } from '@/src/types/expense';

const VALID_INTENTS: VendorEmailIntent[] = ['negotiate', 'cancel', 'ask'];

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireHouseholdUser();
  if ('error' in auth) return auth.error;

  if (!isAiConfigured()) {
    return NextResponse.json(
      { status: 'error', message: 'The AI assistant is not set up yet. Ask an admin to add a GOOGLE_AI_API_KEY.' },
      { status: 503 }
    );
  }

  try {
    const { id } = await params;
    const body = await request.json();
    const intent = VALID_INTENTS.includes(body.intent) ? (body.intent as VendorEmailIntent) : 'negotiate';

    const expense = await prisma.expense.findUnique({ where: { id } });
    if (!expense || expense.householdId !== auth.user.householdId) {
      return NextResponse.json({ status: 'error', message: 'Expense not found' }, { status: 404 });
    }

    if (!expense.vendorEmail) {
      return NextResponse.json(
        { status: 'error', message: 'No vendor email is set for this expense yet.' },
        { status: 400 }
      );
    }

    const draft = await draftVendorEmail(
      {
        name: expense.name,
        vendor: expense.vendor,
        amount: expense.amount,
        currency: expense.currency,
        billingCycle: expense.billingCycle as BillingCycle,
        contractEndDate: expense.contractEndDate,
      },
      intent,
      auth.user.name
    );

    return NextResponse.json({ status: 'ok', draft, vendorEmail: expense.vendorEmail });
  } catch (error: unknown) {
    console.error('Failed to draft vendor email:', error);
    return NextResponse.json(
      { status: 'error', message: getErrorMessage(error, 'Failed to draft email') },
      { status: 500 }
    );
  }
}
