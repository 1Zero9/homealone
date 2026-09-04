export const APP_VERSION = '1.20.1';

export interface ChangelogEntry {
  version: string;
  date: string;
  changes: string[];
}

export const CHANGELOG: ChangelogEntry[] = [
  {
    version: '1.20.1',
    date: '2026-09-04',
    changes: [
      'Fixed "Add as expense" and other statement-import actions not showing up in the ledger or Overview until a manual page refresh — resolving a statement row now updates your live data straight away.',
      'Added "Add all as expense" for a merchant group in statement review — pick a category once and it\'s applied to every unmatched row from that merchant in the statement, instead of doing it one row at a time.',
    ],
  },
  {
    version: '1.20.0',
    date: '2026-09-04',
    changes: [
      'Statement import rows can now be given a merchant nickname — click the pencil next to any cryptic bank description (e.g. "IEPROS") and rename it to something recognisable (e.g. "Smyths Toy Shop"). It updates that row plus every past and future row for the same merchant, and groups rows under the nickname too.',
      'Savings goals can now be linked to any bill, not just Planned ones — handy for something cheaper paid annually that you can\'t afford in one go: link a goal, top it up monthly, and watch its progress right on that ledger row.',
    ],
  },
  {
    version: '1.19.0',
    date: '2026-09-03',
    changes: [
      'Statement import is smarter about what it decides on its own: a row only gets auto-marked "Matched" when it fits a merchant you\'ve personally confirmed before — every other suggested match (however confident) now waits in "Needs review" for you to hit "Confirm match" first.',
      'Possible matches against an existing transfer (not just a bill) now show up with their own "Confirm match" button, instead of only bills getting that treatment.',
      'Added "Add as expense" for statement rows that aren\'t linked to a bill — pick a spending category and it\'s logged as a proper one-off expense (not just an anonymous transfer), so it shows up correctly in Spending and category breakdowns.',
      'Tally remembers the category you picked for a merchant and suggests it automatically next time that description shows up on a statement.',
    ],
  },
  {
    version: '1.18.0',
    date: '2026-09-03',
    changes: [
      'PDF/photo statement imports now also read the account number, sort code, IBAN, account holder, statement period and opening/closing balance printed on the statement.',
      'When you pick which account a statement is for, Tally checks the extracted account number and sort code against what\'s saved for that account and flags a mismatch — handy for catching "wrong account" mix-ups before you import.',
      'If an account has no account number or sort code saved yet, you can save the one read off the statement with one click.',
    ],
  },
  {
    version: '1.17.2',
    date: '2026-09-03',
    changes: [
      'Clicking outside the statement import dialog no longer does anything — only the visible Close, Back and Import buttons can close or navigate it, so an accidental click can\'t lose your in-progress import.',
    ],
  },
  {
    version: '1.17.1',
    date: '2026-09-03',
    changes: [
      'Fixed the statement import dialog discarding everything it just read from a PDF/photo the instant you clicked outside it — it now asks first if you have unimported transactions on screen.',
    ],
  },
  {
    version: '1.17.0',
    date: '2026-09-03',
    changes: [
      'Add goal now lets you split the remaining amount into equal payments (2, 4, 12, 20, or any custom number) to quickly see how much to save per instalment.',
    ],
  },
  {
    version: '1.16.0',
    date: '2026-09-03',
    changes: [
      'Statement uploads now accept PDF exports and photos/screenshots as well as CSV — Tally reads the transactions straight off the page using AI, so there\'s no need to convert a bank PDF to CSV first.',
    ],
  },
  {
    version: '1.15.0',
    date: '2026-09-03',
    changes: [
      'Added a new "Insurance, Motor Tax & NCT" category with its own tab, so car/life/health insurance, motor tax and NCT renewals no longer have to be shoehorned into Housing or Big Purchases.',
      'Added quick-add presets for Car Insurance, Motor Tax, NCT Test Fee, Life Insurance and Health Insurance.',
    ],
  },
  {
    version: '1.14.2',
    date: '2026-09-03',
    changes: [
      'Actually fixed the "Money Journey" dropdown jump this time — its open animation and its centering were both fighting over the same CSS transform, snapping it to a new spot right after it opened.',
    ],
  },
  {
    version: '1.14.1',
    date: '2026-09-03',
    changes: [
      'Fixed the "Money Journey" nav dropdown shifting position instead of staying put under the button.',
    ],
  },
  {
    version: '1.14.0',
    date: '2026-09-03',
    changes: [
      'Statement import review now groups transactions from the same merchant together (e.g. all your SuperValu trips) with a running total, instead of listing every single line separately.',
      'Added "Log all" and "Ignore all" bulk actions for a merchant group, so you can clear out repeat charges in one click instead of one at a time.',
    ],
  },
  {
    version: '1.13.0',
    date: '2026-09-03',
    changes: [
      'The "Ask about your spending" box can now answer how-to questions too — try "how do I import a statement" or "how do I assign a bill to someone" alongside your usual spending questions.',
      'Added quick How do I... buttons under the ask box for common setup questions.',
    ],
  },
  {
    version: '1.12.0',
    date: '2026-09-03',
    changes: [
      'Statement imports now ask which account a statement is from — matching is scoped to that account so bills and transfers on other accounts don\'t get cross-matched by mistake, which matters once you\'re importing statements for more than one account.',
      'The account is now shown alongside each past statement import in the list.',
    ],
  },
  {
    version: '1.11.1',
    date: '2026-09-03',
    changes: [
      'Tidied up the top navigation — Flow, Goals, Planned and Money Map are now grouped under a single "Money Journey" menu instead of crowding the main bar.',
      'Removed the blue "Admin workspace" banner that sat above the header for admin accounts.',
    ],
  },
  {
    version: '1.11.0',
    date: '2026-09-03',
    changes: [
      'New: import a bank or credit-card statement (CSV) on the Flow tab to cross-check it against your bills — Tally auto-matches what it recognises, flags recurring-but-untracked charges worth checking, and remembers your confirmations so cryptic statement references get recognised automatically next time.',
    ],
  },
  {
    version: '1.10.0',
    date: '2026-09-03',
    changes: [
      'Scanning a bill in a foreign currency now offers a one-click live conversion to your household currency, using daily ECB exchange rates.',
    ],
  },
  {
    version: '1.9.2',
    date: '2026-09-03',
    changes: [
      'Household ledger filters now include "Unpaid" and "Overdue", each showing a live count, alongside the existing All/Active/Paused.',
    ],
  },
  {
    version: '1.9.1',
    date: '2026-09-03',
    changes: [
      'Tightened up the Add/Edit expense window so it fits on laptop screens with far less scrolling — Save and Cancel now stay pinned in view.',
    ],
  },
  {
    version: '1.9.0',
    date: '2026-09-03',
    changes: [
      'Planned expenses can now link to a savings Goal — see how much you\'ve saved towards it right on the Planned list.',
      'Overview now shows a quiet nudge when planned costs are coming up, linking straight to the Planned list.',
      'Planned items due within 30 days now get a "consider activating" badge as a gentle reminder.',
    ],
  },
  {
    version: '1.8.0',
    date: '2026-09-03',
    changes: [
      'New "Planned" section for costs that aren\'t required yet (e.g. college) — add them ahead of time and they sit in their own stand-alone list, with zero impact on totals, bills or insights until you hit "Activate".',
    ],
  },
  {
    version: '1.7.0',
    date: '2026-09-03',
    changes: [
      'New "Mortgage & loans" spending category to keep big-ticket items (mortgage, car/personal loan repayments, holidays) separate from everyday bills — totals and account links are unaffected.',
    ],
  },
  {
    version: '1.6.0',
    date: '2026-09-03',
    changes: [
      'Spending ledger rows now expand into a quick view on click — see category, billing cycle, renewal day, payment account, vendor email, contract end date, usage and notes without opening the edit form.',
    ],
  },
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

export const MOBILE_APP_VERSION = '1.0.0';

export const MOBILE_CHANGELOG: ChangelogEntry[] = [
  {
    version: '1.0.0',
    date: '2026-09-03',
    changes: [
      'Ledger rows resized so they no longer run oversized on small screens.',
      'Overview stat cards resized to fit mobile screens properly.',
    ],
  },
];
