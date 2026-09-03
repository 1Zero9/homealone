import React from 'react';
import type { UserProfile } from '../types/expense';
import { X, Sparkles, Plus, UserPlus, Download, Bell, Mail, ShieldCheck, Landmark, ArrowLeftRight, Target, Activity, CalendarClock } from 'lucide-react';

interface HelpGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile | null;
}

interface GuideSection {
  icon: React.ReactNode;
  title: string;
  body: string[];
  adminOnly?: boolean;
}

const SECTIONS: GuideSection[] = [
  {
    icon: <Sparkles size={16} color="var(--ha-blue)" />,
    title: 'Ask about your spending',
    body: [
      'Use the search box at the top of the dashboard to ask questions in plain English, like "where can I save" or "what\'s going out this week".',
      'Once you have a few entries, quick-question buttons appear under the search box for common questions.',
    ],
  },
  {
    icon: <Plus size={16} color="var(--ha-blue)" />,
    title: 'Adding expenses & income',
    body: [
      'Click "Add expense" in the top bar to record a bill, subscription or one-off cost. Set the amount, billing cycle, category and payment method.',
      'Use "Catalog" to add common household bills (Netflix, electricity, broadband, etc.) in one click instead of typing them from scratch.',
      'Big one-off costs like a mortgage, loan repayment or large purchase have their own "Mortgage, Loans & Big Purchases" category, kept separate from everyday bills.',
      'Switch to the "Income" tab to record salary, freelance or rental income and see your money in vs money out.',
    ],
  },
  {
    icon: <Landmark size={16} color="var(--ha-blue)" />,
    title: 'Accounts',
    body: [
      'Add your bank accounts, cards and loans in the "Accounts" tab. Sensitive details like account numbers and logins are encrypted and only shown when you click "reveal".',
      'Link your expenses and income to the account they\'re paid from or deposited into — this powers Money Map and the AI money-flow analysis.',
    ],
  },
  {
    icon: <ArrowLeftRight size={16} color="var(--ha-blue)" />,
    title: 'Flow — log every money movement',
    body: [
      'Use "Flow" to log real transfers: income landing in an account, money moving between accounts, or payments going out.',
      'One-off spending (a car repair, a doctor\'s visit) works here too — set "From" to the account that paid, leave "To" as External, and add a note.',
    ],
  },
  {
    icon: <Target size={16} color="var(--ha-blue)" />,
    title: 'Goals',
    body: [
      'Track savings targets like an emergency fund or a holiday. Link a goal to the account the money is actually sitting in and watch the progress bar fill up.',
      'You can also link a goal from a Planned expense, so its progress shows up right there on the planned item.',
    ],
  },
  {
    icon: <CalendarClock size={16} color="var(--ha-blue)" />,
    title: 'Planned expenses',
    body: [
      'Got a cost coming up that isn\'t required yet — like college fees? Tick "Planned — not required yet" when adding it, or use "Add planned expense" from the "Planned" tab.',
      'Planned items sit in their own stand-alone list and never count towards totals, bills or insights until you hit "Activate".',
      'Optionally link a planned item to a Goal to track savings progress, and watch for the "consider activating" badge once its date is within 30 days.',
    ],
  },
  {
    icon: <Activity size={16} color="var(--ha-blue)" />,
    title: 'Money Map & AI insights',
    body: [
      'The "Money Map" tab visualizes the real journey your money takes, built from your logged Flow entries — or a projected monthly view if you haven\'t logged transfers yet.',
      'In "Insights", click "Analyze my money flow" for an on-demand AI review of idle cash, direct-debit timing risk, account consolidation, and savings opportunities.',
    ],
  },
  {
    icon: <Bell size={16} color="var(--ha-blue)" />,
    title: 'Contract renewals & reminders',
    body: [
      'If an expense has a contract end date, a badge appears on it once that date is within 60 days.',
      'The household is emailed automatically 30, 14 and 7 days before a contract ends, so nothing renews without you noticing.',
    ],
  },
  {
    icon: <Mail size={16} color="var(--ha-blue)" />,
    title: 'Contacting a vendor',
    body: [
      'If an expense has a vendor email saved, a mail icon appears next to it in the ledger.',
      'Click it to have a draft email prepared for you (ask for a better rate, cancel, or ask about renewal terms) — review and edit it, then send it yourself. Nothing is ever emailed automatically without you clicking send.',
    ],
  },
  {
    icon: <UserPlus size={16} color="var(--ha-blue)" />,
    title: 'Sharing your workspace',
    body: [
      'Click "Share" to invite a partner or family member by email, or copy a shareable link/invite code for them to join your household.',
      'Everyone in the same household sees the same shared ledger.',
    ],
  },
  {
    icon: <Download size={16} color="var(--ha-blue)" />,
    title: 'Export & backup',
    body: [
      'Click "Export" to download your records as a CSV spreadsheet or a JSON backup file at any time.',
    ],
  },
  {
    icon: <ShieldCheck size={16} color="var(--ha-red)" />,
    title: 'Admin & users',
    adminOnly: true,
    body: [
      'As an admin, the "Admin & users" tab lets you manage household member accounts, change roles, and remove accounts that no longer belong.',
      'There must always be at least one Admin in a household — the app won\'t let you remove the last one.',
    ],
  },
];

export const HelpGuideModal: React.FC<HelpGuideModalProps> = ({ isOpen, onClose, currentUser }) => {
  if (!isOpen) return null;

  const isAdmin = currentUser?.role === 'ADMIN';
  const visibleSections = SECTIONS.filter((s) => !s.adminOnly || isAdmin);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '640px' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '1.25rem 1.5rem',
          borderBottom: '1px solid var(--ha-line)',
        }}>
          <div>
            <h3 style={{ fontSize: '1.35rem', fontWeight: 700, color: 'var(--ha-ink)', lineHeight: 1.1 }}>
              Help guide
            </h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--ha-muted)', marginTop: '2px' }}>
              A quick tour of what you can do in Tally
            </p>
          </div>

          <button onClick={onClose} className="btn btn-ghost" style={{ padding: '0.35rem' }}>
            <X size={18} />
          </button>
        </div>

        <div style={{ padding: '1.25rem 1.5rem 1.75rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {visibleSections.map((section) => (
            <div key={section.title} style={{ display: 'flex', gap: '0.75rem' }}>
              <div style={{
                width: '30px',
                height: '30px',
                borderRadius: 'var(--ha-radius-sm)',
                backgroundColor: 'var(--ha-blue-light)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}>
                {section.icon}
              </div>
              <div>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--ha-ink)', marginBottom: '0.3rem' }}>
                  {section.title}
                </h4>
                {section.body.map((line, idx) => (
                  <p key={idx} style={{ fontSize: '0.85rem', color: 'var(--ha-muted)', lineHeight: 1.5, marginBottom: idx < section.body.length - 1 ? '0.4rem' : 0 }}>
                    {line}
                  </p>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div style={{
          padding: '1rem 1.5rem',
          borderTop: '1px solid var(--ha-line)',
          fontSize: '0.78rem',
          color: 'var(--ha-muted)',
          textAlign: 'center',
        }}>
          Still stuck? Reach out to whoever set up your household workspace.
        </div>
      </div>
    </div>
  );
};
