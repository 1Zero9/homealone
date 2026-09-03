import { NextResponse } from 'next/server';
import { getErrorMessage } from '@/src/lib/errors';
import { requireHouseholdUser } from '@/src/lib/auth';
import { analyzeStatementDocument, isAiConfigured } from '@/src/lib/ai';

const MAX_FILE_BYTES = 15 * 1024 * 1024; // 15MB — generous for a multi-page statement PDF

export async function POST(request: Request) {
  const auth = await requireHouseholdUser();
  if ('error' in auth) return auth.error;

  if (!isAiConfigured()) {
    return NextResponse.json(
      { status: 'error', message: 'The AI assistant is not set up yet. Ask an admin to add a GOOGLE_AI_API_KEY, or upload a CSV export instead.' },
      { status: 503 }
    );
  }

  try {
    const body = await request.json();
    const fileBase64 = (body.fileBase64 || '') as string;
    const mimeType = (body.mimeType || '') as string;

    const isImage = mimeType.startsWith('image/');
    const isPdf = mimeType === 'application/pdf';

    if (!fileBase64 || (!isImage && !isPdf)) {
      return NextResponse.json(
        { status: 'error', message: 'Please provide a valid PDF or image file.' },
        { status: 400 }
      );
    }

    // Rough size check on the base64 payload (base64 is ~4/3 the size of the raw bytes).
    if (fileBase64.length * 0.75 > MAX_FILE_BYTES) {
      return NextResponse.json(
        { status: 'error', message: 'That file is too large (max 15MB). Try a smaller export, or upload a CSV instead.' },
        { status: 400 }
      );
    }

    const transactions = await analyzeStatementDocument(fileBase64, mimeType);

    if (transactions.length === 0) {
      return NextResponse.json(
        { status: 'error', message: "Couldn't find any transactions in that file. Try a clearer scan, or export as CSV instead." },
        { status: 400 }
      );
    }

    return NextResponse.json({ status: 'ok', transactions });
  } catch (error: unknown) {
    console.error('Statement extraction failed:', error);
    return NextResponse.json(
      { status: 'error', message: getErrorMessage(error, 'Failed to read that statement') },
      { status: 500 }
    );
  }
}
