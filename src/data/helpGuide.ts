export interface HelpGuideSection {
  id: string;
  title: string;
  body: string[];
  adminOnly?: boolean;
}

export const HELP_GUIDE_SECTIONS: HelpGuideSection[] = [
  {
    id: 'ask',
    title: 'Ask about your spending',
    body: [
      'Use the search box at the top of the dashboard to ask questions in plain English, like "where can I save" or "what\'s going out this week" — or how-to questions like "how do I import a statement".',
      'Once you have a few entries, quick-question buttons appear under the search box for common questions.',
    ],
  },
  {
    id: 'expenses',
    title: 'Adding expenses & income',
    body: [
      'Click "Add expense" in the top bar to record a bill, subscription or one-off cost. Set the amount, billing cycle, category and payment method.',
      'Use "Catalog" to add common household bills (Netflix, electricity, broadband, etc.) in one click instead of typing them from scratch.',
      'Big one-off costs like a mortgage, loan repayment or large purchase have their own "Mortgage, Loans & Big Purchases" category, kept separate from everyday bills.',
      'Switch to the "Income" tab to record salary, freelance or rental income and see your money in vs money out.',
    ],
  },
  {
    id: 'assign',
    title: 'Assigning a bill to a household member',
    body: [
      'When adding or editing an expense, use the "Assigned Household Member" dropdown to pick who it belongs to instead of leaving it as "Household (Shared)".',
      'Add more household members first from the avatar menu → "Admin & users" → Household Users → "Add household user".',
    ],
  },
  {
    id: 'scan',
    title: 'Scanning a bill or receipt',
    body: [
      'Click the scan icon in the top bar, then paste, drag-and-drop, or upload a screenshot or photo of a bill or receipt.',
      'Tally reads the vendor, amount, date and currency and either pre-fills a new bill for you to review, or matches it to an existing one.',
      'If the bill is in a foreign currency, Tally offers a one-click live conversion to your household currency.',
    ],
  },
  {
    id: 'accounts',
    title: 'Accounts',
    body: [
      'Add your bank accounts, cards and loans in the "Accounts" tab. Sensitive details like account numbers and logins are encrypted and only shown when you click "reveal".',
      'Link your expenses and income to the account they\'re paid from or deposited into — this powers Money Map, statement matching, and the AI money-flow analysis.',
    ],
  },
  {
    id: 'statements',
    title: 'Importing a bank/card statement',
    body: [
      'Open "Flow" → "Statement imports" → "Import statement", then upload a CSV export, a PDF statement, or a photo/screenshot of a paper statement — Tally reads PDFs and photos with AI, so there\'s no need to convert them to CSV first.',
      'For CSV, tell Tally which column is the date, description and amount. Pick which Account the statement is from either way — this keeps matching accurate once you have more than one account. No accounts yet? Use "Add your first account" right there on the import screen — no need to leave and come back.',
      'From a PDF or photo, Tally also pulls out the account number, sort code, IBAN, account holder and statement period if they\'re printed on it, and checks the account number/sort code against what\'s saved for the account you picked — flagging a mismatch, or offering to save it in one click if that account has nothing on file yet. If the statement is from an account you haven\'t added, click "Add a new account" and Tally carries the extracted account number and sort code straight over, encrypted.',
      'Tally suggests matches against your existing bills and transfers, but only ever auto-confirms a merchant it\'s seen you personally confirm before — everything else sits in "Needs review" until you click "Confirm match".',
      'For rows that aren\'t a bill you\'ve tracked, use "Add as expense" to log them with a proper spending category (Tally remembers the category per merchant for next time), or "Log as transfer" for a quick, uncategorized entry.',
      'Click the pencil next to any row\'s description to give that merchant a nickname (e.g. "IEPROS" → "Smyths Toy Shop") — it updates every past and future row from that merchant, not just the one you renamed.',
      'For a merchant with several rows in the same statement (e.g. five Starbucks visits), use "Add all as expense" on that group to pick a category once and log all of them in one go, instead of one at a time.',
      'Clicking outside the import dialog never discards anything — only the visible buttons (Back, Import, Done, the X) can close or navigate it.',
    ],
  },
  {
    id: 'flow',
    title: 'Flow — log every money movement',
    body: [
      'Use "Flow" to log real transfers: income landing in an account, money moving between accounts, or payments going out.',
      'One-off spending (a car repair, a doctor\'s visit) works here too — set "From" to the account that paid, leave "To" as External, and add a note.',
    ],
  },
  {
    id: 'goals',
    title: 'Goals',
    body: [
      'Track savings targets like an emergency fund or a holiday. Link a goal to the account the money is actually sitting in and watch the progress bar fill up.',
      'You can also link a goal from a Planned expense, or from any regular bill — handy for something cheaper paid annually that you can\'t afford in one go, like a subscription. Link a mini goal, top it up monthly, and its progress shows right on that ledger row.',
      'When adding or editing a goal, use "Split into equal payments" to see what the remaining amount works out to per instalment (2, 4, 12, 20, or any custom number) — it\'s just a quick calculator, nothing is saved.',
    ],
  },
  {
    id: 'planned',
    title: 'Planned expenses',
    body: [
      'Got a cost coming up that isn\'t required yet — like college fees? Tick "Planned — not required yet" when adding it, or use "Add planned expense" from the "Planned" tab.',
      'Planned items sit in their own stand-alone list and never count towards totals, bills or insights until you hit "Activate".',
      'Optionally link a planned item to a Goal to track savings progress, and watch for the "consider activating" badge once its date is within 30 days.',
    ],
  },
  {
    id: 'moneymap',
    title: 'Money Map & AI insights',
    body: [
      'The "Money Map" tab visualizes the real journey your money takes, built from your logged Flow entries — or a projected monthly view if you haven\'t logged transfers yet.',
      'In "Insights", click "Analyze my money flow" for an on-demand AI review of idle cash, direct-debit timing risk, account consolidation, and savings opportunities.',
    ],
  },
  {
    id: 'renewals',
    title: 'Contract renewals & reminders',
    body: [
      'If an expense has a contract end date, a badge appears on it once that date is within 60 days.',
      'The household is emailed automatically 30, 14 and 7 days before a contract ends, so nothing renews without you noticing.',
    ],
  },
  {
    id: 'vendor',
    title: 'Contacting a vendor',
    body: [
      'If an expense has a vendor email saved, a mail icon appears next to it in the ledger.',
      'Click it to have a draft email prepared for you (ask for a better rate, cancel, or ask about renewal terms) — review and edit it, then send it yourself. Nothing is ever emailed automatically without you clicking send.',
    ],
  },
  {
    id: 'sharing',
    title: 'Sharing your workspace',
    body: [
      'Click "Share" to invite a partner or family member by email, or copy a shareable link/invite code for them to join your household.',
      'Everyone in the same household sees the same shared ledger.',
    ],
  },
  {
    id: 'export',
    title: 'Export & backup',
    body: [
      'Click "Export" to download your records as a CSV spreadsheet or a JSON backup file at any time.',
    ],
  },
  {
    id: 'admin',
    title: 'Admin & users',
    adminOnly: true,
    body: [
      'As an admin, the "Admin & users" tab lets you manage household member accounts, change roles, and remove accounts that no longer belong.',
      'There must always be at least one Admin in a household — the app won\'t let you remove the last one.',
    ],
  },
];
