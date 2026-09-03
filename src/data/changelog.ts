export const APP_VERSION = '1.5.0';

export interface ChangelogEntry {
  version: string;
  date: string;
  changes: string[];
}

export const CHANGELOG: ChangelogEntry[] = [
  {
    version: '1.5.0',
    date: '2026-09-03',
    changes: [
      'Overview on mobile is much shorter — Recently Added, Spending and Upcoming Bills are now quick-switch tabs instead of one long stacked page.',
      'Stat cards (This month spent, Coming up, Left after bills) swipe horizontally on mobile instead of stacking.',
    ],
  },
  {
    version: '1.4.0',
    date: '2026-09-03',
    changes: [
      'Income now has a "Next pay date" so monthly, weekly, quarterly and annual income repeats on a specific day, just like bills — Tally rolls it forward automatically after each payday.',
      'Overview dashboard cards now show how many items they\'re displaying out of the total, with "View all" links through to Spending or Bills — makes it clear why Overview shows fewer items than the full ledger.',
    ],
  },
  {
    version: '1.3.0',
    date: '2026-09-03',
    changes: [
      'Added "Scan a bill": paste, drag-and-drop, or upload a screenshot/photo of a bill or receipt anywhere in the app and Tally will read it and match it to an existing bill or pre-fill a new one for you to review.',
      'Added a separate vendor/provider name field on expenses, distinct from the item name and vendor email (e.g. item "Broadband", vendor "Vodafone").',
      'Sessions now stay signed in as long as you use the app at least once a month, instead of requiring a fresh magic-code login every time.',
      'Added a confirmation prompt before logging out, and a floating quick-hide button for instantly blurring the screen.',
      'Recently Added on the Overview dashboard now shows category, paid status and due date at a glance.',
      'You can now mark a bill as paid right when you add it, not just when editing.',
      'Fixed bills showing as "Overdue" in Bills/Overview after already being marked paid in Spending.',
    ],
  },
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
