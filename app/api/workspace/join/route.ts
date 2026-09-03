import { NextResponse } from 'next/server';

/**
 * Disabled: this app is invite-only. Nobody may self-provision an account
 * or session via a publicly-shared invite code. New members can only be
 * added by an existing admin via the authenticated /api/workspace/invite
 * route (see ShareWorkspaceModal's "Directly invite member by email").
 */
export async function POST() {
  return NextResponse.json(
    { status: 'error', message: 'Self-service joining is disabled. Ask an admin to invite you directly.' },
    { status: 410 }
  );
}
