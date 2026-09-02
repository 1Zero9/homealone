import { Resend } from 'resend';

export function isEmailConfigured(): boolean {
  return !!process.env.RESEND_API_KEY;
}

const FROM_ADDRESS = process.env.RESEND_FROM_EMAIL || 'Home Alone <onboarding@resend.dev>';

function getClient(): Resend {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error('Email is not configured. Set RESEND_API_KEY.');
  }
  return new Resend(apiKey);
}

export async function sendVerificationCodeEmail(to: string, code: string): Promise<void> {
  const resend = getClient();

  await resend.emails.send({
    from: FROM_ADDRESS,
    to,
    subject: `${code} is your Home Alone sign-in code`,
    text: `Your Home Alone sign-in code is ${code}. It expires in 15 minutes. If you didn't request this, you can ignore this email.`,
    html: `
      <div style="font-family: -apple-system, sans-serif; max-width: 480px; margin: 0 auto;">
        <h2 style="color: #111;">Your sign-in code</h2>
        <p style="color: #555; font-size: 15px;">Enter this code to sign in to Home Alone. It expires in 15 minutes.</p>
        <div style="font-size: 32px; font-weight: 700; letter-spacing: 6px; background: #f4f4f0; padding: 16px 24px; border-radius: 8px; text-align: center; margin: 20px 0;">
          ${code}
        </div>
        <p style="color: #999; font-size: 13px;">If you didn't request this, you can safely ignore this email.</p>
      </div>
    `,
  });
}

export interface ContractReminderItem {
  name: string;
  daysLeft: number;
  contractEndDate: string;
  amount: number;
  currency: string;
}

export async function sendContractReminderEmail(
  to: string,
  opts: { householdName: string; appUrl: string; items: ContractReminderItem[] }
): Promise<void> {
  const resend = getClient();
  const { items } = opts;

  const rows = items
    .map((item) => {
      const urgency = item.daysLeft <= 7 ? '#d92626' : '#111';
      return `
        <tr>
          <td style="padding: 8px 0; border-bottom: 1px solid #eee; color: #111; font-weight: 600;">${item.name}</td>
          <td style="padding: 8px 0; border-bottom: 1px solid #eee; color: ${urgency}; text-align: right;">
            ${item.daysLeft <= 0 ? 'Ends today' : `${item.daysLeft} day${item.daysLeft === 1 ? '' : 's'} left`}
          </td>
        </tr>
      `;
    })
    .join('');

  const listText = items
    .map((item) => `- ${item.name}: ${item.daysLeft <= 0 ? 'ends today' : `${item.daysLeft} days left`} (contract end ${item.contractEndDate})`)
    .join('\n');

  await resend.emails.send({
    from: FROM_ADDRESS,
    to,
    subject: `${items.length} contract${items.length === 1 ? '' : 's'} to review — ${opts.householdName}`,
    text: `These contracts on your Home Alone household are coming up for renewal soon. Consider calling to review, renegotiate, or cancel before they auto-renew:\n\n${listText}\n\nView details at ${opts.appUrl}`,
    html: `
      <div style="font-family: -apple-system, sans-serif; max-width: 480px; margin: 0 auto;">
        <h2 style="color: #111;">Contracts to review</h2>
        <p style="color: #555; font-size: 15px;">
          These contracts on <strong>${opts.householdName}</strong> are coming up for renewal soon. Consider calling to review, renegotiate, or cancel before they auto-renew.
        </p>
        <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
          ${rows}
        </table>
        <a href="${opts.appUrl}" style="display: inline-block; margin: 20px 0; padding: 12px 24px; background: #3155D9; color: #fff; text-decoration: none; border-radius: 8px; font-weight: 600;">
          Open Home Alone
        </a>
      </div>
    `,
  });
}

export async function sendInviteEmail(to: string, opts: { inviterName: string; householdName: string; appUrl: string }): Promise<void> {
  const resend = getClient();

  await resend.emails.send({
    from: FROM_ADDRESS,
    to,
    subject: `${opts.inviterName} invited you to ${opts.householdName} on Home Alone`,
    text: `${opts.inviterName} has invited you to join "${opts.householdName}" on Home Alone, a household finance app. Sign in with this email address at ${opts.appUrl} to get started.`,
    html: `
      <div style="font-family: -apple-system, sans-serif; max-width: 480px; margin: 0 auto;">
        <h2 style="color: #111;">You've been invited</h2>
        <p style="color: #555; font-size: 15px;">
          <strong>${opts.inviterName}</strong> has invited you to join <strong>${opts.householdName}</strong> on Home Alone — a simple household finance app for tracking bills, income and savings together.
        </p>
        <a href="${opts.appUrl}" style="display: inline-block; margin: 20px 0; padding: 12px 24px; background: #3155D9; color: #fff; text-decoration: none; border-radius: 8px; font-weight: 600;">
          Sign in to Home Alone
        </a>
        <p style="color: #999; font-size: 13px;">Sign in with this email address (${to}) to access the shared household.</p>
      </div>
    `,
  });
}

/**
 * Sends a human-reviewed email to a vendor/provider on the household's
 * behalf. `replyTo` is set to the sending user's own email so any reply
 * from the vendor goes straight to a real person, not this app.
 */
export async function sendVendorEmail(
  to: string,
  opts: { subject: string; body: string; senderName: string; replyTo: string }
): Promise<void> {
  const resend = getClient();

  await resend.emails.send({
    from: FROM_ADDRESS,
    to,
    replyTo: opts.replyTo,
    subject: opts.subject,
    text: opts.body,
    html: `<div style="font-family: -apple-system, sans-serif; max-width: 560px; margin: 0 auto; white-space: pre-wrap; color: #111; font-size: 15px; line-height: 1.5;">${opts.body.replace(/\n/g, '<br />')}</div>`,
  });
}
