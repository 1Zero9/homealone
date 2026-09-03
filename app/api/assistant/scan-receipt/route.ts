import { NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';
import { getErrorMessage } from '@/src/lib/errors';
import { requireHouseholdUser } from '@/src/lib/auth';
import { analyzeReceiptImage, isAiConfigured } from '@/src/lib/ai';

const MAX_IMAGE_BYTES = 8 * 1024 * 1024; // 8MB — generous for a screenshot/photo

export async function POST(request: Request) {
  const auth = await requireHouseholdUser();
  if ('error' in auth) return auth.error;

  if (!isAiConfigured()) {
    return NextResponse.json(
      { status: 'error', message: 'The AI assistant is not set up yet. Ask an admin to add a GOOGLE_AI_API_KEY.' },
      { status: 503 }
    );
  }

  try {
    const body = await request.json();
    const imageBase64 = (body.imageBase64 || '') as string;
    const mimeType = (body.mimeType || '') as string;

    if (!imageBase64 || !mimeType.startsWith('image/')) {
      return NextResponse.json(
        { status: 'error', message: 'Please provide a valid image.' },
        { status: 400 }
      );
    }

    // Rough size check on the base64 payload (base64 is ~4/3 the size of the raw bytes).
    if (imageBase64.length * 0.75 > MAX_IMAGE_BYTES) {
      return NextResponse.json(
        { status: 'error', message: 'Image is too large. Please use a smaller screenshot (under 8MB).' },
        { status: 400 }
      );
    }

    const expenses = await prisma.expense.findMany({
      where: { householdId: auth.user.householdId, isActive: true },
      include: {
        createdBy: { select: { id: true, name: true, role: true } },
        paymentAccount: { select: { id: true, name: true, type: true, institution: true } },
      },
    });

    const extracted = await analyzeReceiptImage(
      imageBase64,
      mimeType,
      expenses.map((e) => e.name)
    );

    const matchedExpense = extracted.matchedName
      ? expenses.find((e) => e.name === extracted.matchedName) || null
      : null;

    return NextResponse.json({ status: 'ok', extracted, matchedExpense });
  } catch (error: unknown) {
    console.error('Receipt scan failed:', error);
    return NextResponse.json(
      { status: 'error', message: getErrorMessage(error, 'Failed to read that image') },
      { status: 500 }
    );
  }
}
