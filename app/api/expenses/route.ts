import { NextResponse } from 'next/server';
import { INITIAL_EXPENSES } from '@/src/data/sampleExpenses';

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    app: 'Home Alone',
    version: '1.0.0 (Next.js)',
    currency: 'EUR',
    sampleExpenses: INITIAL_EXPENSES,
  });
}
