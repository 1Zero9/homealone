import { NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';
import { getErrorMessage } from '@/src/lib/errors';
import { requireHouseholdUser } from '@/src/lib/auth';

const MAX_LABEL_LENGTH = 60;

export async function POST(request: Request) {
  const auth = await requireHouseholdUser();
  if ('error' in auth) return auth.error;

  try {
    const body = await request.json();

    const fromNodeId = typeof body.fromNodeId === 'string' ? body.fromNodeId : '';
    const toNodeId = typeof body.toNodeId === 'string' ? body.toNodeId : '';
    if (!fromNodeId || !toNodeId || fromNodeId === toNodeId) {
      return NextResponse.json({ status: 'error', message: 'Two different nodes are required' }, { status: 400 });
    }

    const [fromNode, toNode] = await Promise.all([
      prisma.mapNode.findUnique({ where: { id: fromNodeId } }),
      prisma.mapNode.findUnique({ where: { id: toNodeId } }),
    ]);
    if (!fromNode || fromNode.householdId !== auth.user.householdId || !toNode || toNode.householdId !== auth.user.householdId) {
      return NextResponse.json({ status: 'error', message: 'Node not found' }, { status: 404 });
    }

    const newEdge = await prisma.mapEdge.create({
      data: {
        fromNodeId,
        toNodeId,
        label: typeof body.label === 'string' && body.label.trim() ? body.label.trim().slice(0, MAX_LABEL_LENGTH) : null,
        amount: typeof body.amount === 'number' && body.amount > 0 ? body.amount : null,
        currency: typeof body.currency === 'string' && body.currency ? body.currency : null,
        householdId: auth.user.householdId,
      },
    });

    return NextResponse.json({ status: 'ok', edge: newEdge });
  } catch (error: unknown) {
    console.error('Failed to create map edge:', error);
    return NextResponse.json(
      { status: 'error', message: getErrorMessage(error, 'Failed to create record') },
      { status: 500 }
    );
  }
}
