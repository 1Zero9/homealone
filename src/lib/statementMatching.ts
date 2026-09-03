/**
 * Pure, dependency-free helpers for the statement reconciliation feature —
 * safe to import from both client components (CSV parsing / column
 * guessing during the import wizard) and server API routes (normalization
 * + matching against the household's real Expenses/Transfers/aliases).
 */

export type StatementTxDirection = 'DEBIT' | 'CREDIT';

// ---------------------------------------------------------------------------
// CSV parsing
// ---------------------------------------------------------------------------

/** RFC4180-ish CSV parser: handles quoted fields, escaped quotes, CRLF. */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let inQuotes = false;

  const pushField = () => {
    row.push(field);
    field = '';
  };
  const pushRow = () => {
    pushField();
    rows.push(row);
    row = [];
  };

  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += c;
      }
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ',') {
      pushField();
    } else if (c === '\r') {
      continue;
    } else if (c === '\n') {
      pushRow();
    } else {
      field += c;
    }
  }
  if (field.length > 0 || row.length > 0) pushRow();

  return rows.filter((r) => r.some((cell) => cell.trim() !== ''));
}

export interface ColumnGuess {
  dateIndex: number | null;
  descriptionIndex: number | null;
  amountIndex: number | null;
  debitIndex: number | null;
  creditIndex: number | null;
}

/** Best-effort guess at which column is which, based on common header names. */
export function guessColumns(headers: string[]): ColumnGuess {
  const norm = headers.map((h) => h.trim().toLowerCase());
  const find = (patterns: string[]): number | null => {
    for (const p of patterns) {
      const idx = norm.findIndex((h) => h.includes(p));
      if (idx !== -1) return idx;
    }
    return null;
  };

  return {
    dateIndex: find(['date', 'posted', 'transaction date', 'value date']),
    descriptionIndex: find(['description', 'details', 'narrative', 'merchant', 'memo', 'particulars', 'payee']),
    amountIndex: find(['amount', 'value']),
    debitIndex: find(['debit', 'withdrawal', 'money out', 'paid out', 'out']),
    creditIndex: find(['credit', 'deposit', 'money in', 'paid in', 'in']),
  };
}

/** Parses a wide range of amount formats: "1,234.56", "1.234,56", "(12.00)", "€12,00". */
export function parseAmount(raw: string): number | null {
  if (!raw) return null;
  let s = raw.trim().replace(/[€£$]/g, '');
  if (!s) return null;

  const negative = /^\(.*\)$/.test(s) || s.trim().startsWith('-');
  s = s.replace(/[()]/g, '').replace(/^-/, '').trim();

  if (s.includes(',') && s.includes('.')) {
    // Whichever separator appears last is the decimal one.
    if (s.lastIndexOf(',') > s.lastIndexOf('.')) {
      s = s.replace(/\./g, '').replace(',', '.');
    } else {
      s = s.replace(/,/g, '');
    }
  } else if (s.includes(',') && !s.includes('.')) {
    const parts = s.split(',');
    if (parts[parts.length - 1].length === 2) {
      s = s.replace(',', '.');
    } else {
      s = s.replace(/,/g, '');
    }
  }

  const n = parseFloat(s);
  if (Number.isNaN(n)) return null;
  return negative ? -n : n;
}

/** Normalizes a wide range of date formats to YYYY-MM-DD. Assumes DD/MM/YYYY for ambiguous slash-formats. */
export function parseDateFlexible(raw: string): string | null {
  const s = (raw || '').trim();
  if (!s) return null;

  let m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (m) return `${m[1]}-${m[2].padStart(2, '0')}-${m[3].padStart(2, '0')}`;

  m = s.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
  if (m) {
    const day = Number(m[1]);
    const month = Number(m[2]);
    // If the first number can't be a month, it's unambiguous DD/MM. Otherwise assume DD/MM (EU convention).
    return `${m[3]}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  }

  m = s.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2})$/);
  if (m) {
    const year = 2000 + Number(m[3]);
    return `${year}-${String(Number(m[2])).padStart(2, '0')}-${String(Number(m[1])).padStart(2, '0')}`;
  }

  const d = new Date(s);
  if (!Number.isNaN(d.getTime())) return d.toISOString().split('T')[0];

  return null;
}

// ---------------------------------------------------------------------------
// Description normalization
// ---------------------------------------------------------------------------

const NOISE_PREFIXES: RegExp[] = [
  /^POS\s+PURCHASE\s*/i,
  /^POS\s+/i,
  /^SQ\s*\*/i,
  /^SQU\s*\*/i,
  /^PAYPAL\s*\*/i,
  /^PP\s*\*/i,
  /^CARD PAYMENT TO\s*/i,
  /^CONTACTLESS\s+/i,
  /^DEBIT CARD PURCHASE\s*/i,
  /^VISA\s+(DEBIT|PURCHASE)?\s*/i,
  /^DD\s+/i,
  /^SO\s+/i,
  /^ONLINE PAYMENT TO\s*/i,
  /^PMT\s+/i,
  /^PAYMENT TO\s*/i,
  /^DIRECT DEBIT\s*/i,
];

/**
 * Strips card references, POS/SQ/PayPal prefixes, transaction IDs, masked
 * card numbers and trailing reference codes, then collapses to a stable,
 * comparable uppercase string of meaningful words.
 */
export function normalizeDescription(raw: string): string {
  let s = (raw || '').trim();

  for (const re of NOISE_PREFIXES) s = s.replace(re, '');

  s = s.replace(/\b\d{1,2}[/-]\d{1,2}[/-]\d{2,4}\b/g, ' ');
  s = s.replace(/\bX{2,}\d{2,}\b/gi, ' ');
  s = s.replace(/\*+\d{3,}\b/g, ' ');
  s = s.replace(/\bREF\s*[:#]?\s*\w+/gi, ' ');
  s = s.replace(/\b\d{6,}\b/g, ' ');
  s = s.replace(/[^A-Za-z0-9&' ]+/g, ' ');
  s = s.replace(/\s+/g, ' ').trim().toUpperCase();

  return s;
}

/** Derives a short, stable alias pattern (a few leading significant words) from a normalized description. */
export function buildAliasPattern(normalizedDescription: string): string {
  const tokens = normalizedDescription
    .split(' ')
    .filter((t) => t.length > 1 && !/^\d+$/.test(t));
  return tokens.slice(0, 3).join(' ').trim();
}

function tokens(s: string): Set<string> {
  return new Set(s.split(' ').filter((t) => t.length > 1));
}

/** 0..1 similarity score between two normalized (uppercase) strings. */
export function stringSimilarity(a: string, b: string): number {
  if (!a || !b) return 0;
  if (a === b) return 1;
  if (a.includes(b) || b.includes(a)) return 0.85;

  const ta = tokens(a);
  const tb = tokens(b);
  if (ta.size === 0 || tb.size === 0) return 0;

  let overlap = 0;
  for (const t of ta) if (tb.has(t)) overlap++;
  return overlap / Math.max(ta.size, tb.size);
}

// ---------------------------------------------------------------------------
// Matching pipeline
// ---------------------------------------------------------------------------

export interface MatchCandidateExpense {
  id: string;
  name: string;
  vendor: string | null;
  amount: number;
  currency: string;
  renewalDay: number;
}

export interface MatchCandidateTransfer {
  id: string;
  amount: number;
  currency: string;
  date: string;
  externalLabel: string | null;
}

export interface MatchCandidateAlias {
  id: string;
  pattern: string;
  vendorName: string;
  expenseId: string | null;
  category: string | null;
}

export interface StatementRowInput {
  normalizedDescription: string;
  amount: number;
  currency: string;
  date: string;
  direction: StatementTxDirection;
}

export interface MatchResult {
  status: 'MATCHED' | 'UNMATCHED';
  matchedExpenseId?: string | null;
  matchedTransferId?: string | null;
  matchConfidence?: number | null;
  suggestedVendorName?: string | null;
  suggestedCategory?: string | null;
}

function daysBetween(a: string, b: string): number {
  const da = new Date(a).getTime();
  const db = new Date(b).getTime();
  if (Number.isNaN(da) || Number.isNaN(db)) return 999;
  return Math.abs(da - db) / (1000 * 60 * 60 * 24);
}

function scoreExpenseMatch(tx: StatementRowInput, expense: MatchCandidateExpense): number {
  if (tx.currency !== expense.currency) return 0;

  const amountTolerance = Math.max(0.5, expense.amount * 0.02);
  if (Math.abs(tx.amount - expense.amount) > amountTolerance) return 0;

  let score = 0.5;

  const nameSim = Math.max(
    stringSimilarity(tx.normalizedDescription, normalizeDescription(expense.name)),
    expense.vendor ? stringSimilarity(tx.normalizedDescription, normalizeDescription(expense.vendor)) : 0
  );
  score += nameSim * 0.4;

  const txDay = new Date(tx.date).getDate();
  const rawDiff = Math.abs(txDay - expense.renewalDay);
  const dayDiff = Math.min(rawDiff, 31 - rawDiff);
  const dateScore = Math.max(0, 1 - dayDiff / 10);
  score += dateScore * 0.1;

  return Math.min(1, score);
}

function scoreTransferMatch(tx: StatementRowInput, transfer: MatchCandidateTransfer): number {
  if (tx.currency !== transfer.currency) return 0;

  const amountTolerance = Math.max(0.5, transfer.amount * 0.02);
  if (Math.abs(tx.amount - transfer.amount) > amountTolerance) return 0;

  if (daysBetween(tx.date, transfer.date) > 5) return 0;

  let score = 0.6;
  if (transfer.externalLabel) {
    score += stringSimilarity(tx.normalizedDescription, normalizeDescription(transfer.externalLabel)) * 0.4;
  }
  return Math.min(1, score);
}

function findAliasMatch(tx: StatementRowInput, aliases: MatchCandidateAlias[]): MatchCandidateAlias | null {
  let best: MatchCandidateAlias | null = null;
  for (const alias of aliases) {
    if (!alias.pattern) continue;
    if (tx.normalizedDescription.includes(alias.pattern)) {
      if (!best || alias.pattern.length > best.pattern.length) best = alias;
    }
  }
  return best;
}

/**
 * Attempts to match a single normalized statement row against the
 * household's learned aliases, active expenses, and existing transfer log
 * (to avoid re-suggesting things already manually logged).
 */
export function matchTransaction(
  tx: StatementRowInput,
  context: {
    expenses: MatchCandidateExpense[];
    transfers: MatchCandidateTransfer[];
    aliases: MatchCandidateAlias[];
  }
): MatchResult {
  const alias = findAliasMatch(tx, context.aliases);
  const suggestedCategory = alias?.category ?? null;

  if (tx.direction === 'DEBIT') {
    // A learned alias that already points at a specific Expense means the
    // household has confirmed this exact merchant pattern before — safe to
    // auto-accept. Everything else below is only ever a *suggestion*: it
    // always lands as UNMATCHED ("needs review") so nothing gets silently
    // logged without an explicit confirm/log/ignore from the household.
    if (alias?.expenseId) {
      const expense = context.expenses.find((e) => e.id === alias.expenseId);
      if (expense) {
        return {
          status: 'MATCHED',
          matchedExpenseId: expense.id,
          matchConfidence: 0.97,
          suggestedVendorName: alias.vendorName,
          suggestedCategory,
        };
      }
    }

    let bestExpense: { id: string; score: number } | null = null;
    for (const expense of context.expenses) {
      const score = scoreExpenseMatch(tx, expense);
      if (!bestExpense || score > bestExpense.score) bestExpense = { id: expense.id, score };
    }

    if (bestExpense && bestExpense.score >= 0.75) {
      return {
        status: 'UNMATCHED',
        matchedExpenseId: bestExpense.id,
        matchConfidence: bestExpense.score,
        suggestedVendorName: alias?.vendorName ?? null,
        suggestedCategory,
      };
    }

    let bestTransfer: { id: string; score: number } | null = null;
    for (const transfer of context.transfers) {
      const score = scoreTransferMatch(tx, transfer);
      if (!bestTransfer || score > bestTransfer.score) bestTransfer = { id: transfer.id, score };
    }

    if (bestTransfer && bestTransfer.score >= 0.75) {
      return {
        status: 'UNMATCHED',
        matchedTransferId: bestTransfer.id,
        matchConfidence: bestTransfer.score,
        suggestedCategory,
      };
    }

    if (bestExpense && bestExpense.score >= 0.5) {
      return {
        status: 'UNMATCHED',
        matchedExpenseId: bestExpense.id,
        matchConfidence: bestExpense.score,
        suggestedVendorName: alias?.vendorName ?? null,
        suggestedCategory,
      };
    }

    return { status: 'UNMATCHED', suggestedVendorName: alias?.vendorName ?? null, suggestedCategory };
  }

  // CREDIT rows: only try to recognize as an already-logged transfer (e.g. salary landing) — a suggestion, never auto-confirmed.
  let bestTransfer: { id: string; score: number } | null = null;
  for (const transfer of context.transfers) {
    const score = scoreTransferMatch(tx, transfer);
    if (!bestTransfer || score > bestTransfer.score) bestTransfer = { id: transfer.id, score };
  }
  if (bestTransfer && bestTransfer.score >= 0.75) {
    return {
      status: 'UNMATCHED',
      matchedTransferId: bestTransfer.id,
      matchConfidence: bestTransfer.score,
      suggestedCategory,
    };
  }
  return { status: 'UNMATCHED', suggestedVendorName: alias?.vendorName ?? null, suggestedCategory };
}

/**
 * Flags rows that share a normalized description with at least one other
 * still-unmatched row in the same batch — a recurring-looking charge that
 * isn't tracked anywhere yet, worth a closer look.
 */
export function findRecurringUnmatched(
  transactions: { id: string; normalizedDescription: string; status: 'MATCHED' | 'UNMATCHED' }[]
): Set<string> {
  const groups = new Map<string, string[]>();
  for (const tx of transactions) {
    if (tx.status !== 'UNMATCHED' || !tx.normalizedDescription) continue;
    const arr = groups.get(tx.normalizedDescription) || [];
    arr.push(tx.id);
    groups.set(tx.normalizedDescription, arr);
  }

  const flagged = new Set<string>();
  for (const ids of groups.values()) {
    if (ids.length >= 2) ids.forEach((id) => flagged.add(id));
  }
  return flagged;
}
