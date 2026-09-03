export const APP_VERSION = '1.2.0';

export interface ChangelogEntry {
  version: string;
  date: string;
  changes: string[];
}

export const CHANGELOG: ChangelogEntry[] = [
  {
    version: '1.2.0',
    date: '2026-09-03',
    changes: [
      'Added a privacy blur — the dashboard auto-hides after a short idle period or when the window loses focus, plus a manual "blur now" toggle for before you share your screen.',
      'Added a one-off (single payment) billing cycle for expenses that don\'t recur, like a car repair or a doctor\'s visit.',
      'Added an in-app version number and changelog.',
    ],
  },
  {
    version: '1.1.0',
    date: '2026-09-03',
    changes: [
      'Added Money Journey: Goals (savings targets linked to accounts) and Flow (a full transfer/money-movement ledger).',
      'Added AI-powered money-flow insights and spending optimisation suggestions.',
      'Added Money Map — a visual, node-graph view of how money moves through your accounts.',
      'Added encrypted Accounts with reveal-to-view sensitive details, and an encryption key rotation tool.',
      'Rebranded from Home Alone to Tally with a new green design system and logo.',
      'Switched all site copy to Irish/British English spelling.',
      'Reworked Add Expense: category and payment method are now dropdowns, and clicking outside the modal no longer discards your entry.',
      'Added legal/compliance pages (Privacy, Terms, AI Transparency) and hardened authentication security.',
    ],
  },
  {
    version: '1.0.0',
    date: '2026-09-01',
    changes: [
      'Initial release: household expense & subscription tracker with multi-user profiles and PostgreSQL cloud sync.',
      'Magic-code sign-in, session management, and an Admin panel for managing household members.',
      'AI spending assistant, income tracking, and a savings horizon view.',
      'Automatic contract renewal reminders and vendor contact email drafting.',
      'Progressive Web App support for installing on mobile devices.',
    ],
  },
];
