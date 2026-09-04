import type { CurrencyCode, ExpenseItem, CustomCategoryItem } from '../types/expense';
import { INITIAL_EXPENSES } from '../data/sampleExpenses';
import { getCategoryMeta } from '../data/categories';
import { getMonthlyEquivalent, getAnnualEquivalent } from '../utils/calculations';

const STORAGE_KEY_EXPENSES = 'tally_expenses_v3';
const STORAGE_KEY_CURRENCY = 'tally_currency_v3';

// Legacy keys from the app's previous "Home Alone" name — migrated once,
// then cleared, so returning users don't lose locally-cached data.
const LEGACY_STORAGE_KEY_EXPENSES = 'homealone_expenses_v3';
const LEGACY_STORAGE_KEY_CURRENCY = 'homealone_currency_v3';

export function loadExpenses(): ExpenseItem[] {
  try {
    // Clear any obsolete v1 / v2 keys from earlier tests if needed
    if (localStorage.getItem('homealone_expenses_v1')) {
      localStorage.removeItem('homealone_expenses_v1');
      localStorage.removeItem('homealone_currency_v1');
    }
    if (localStorage.getItem('homealone_expenses_v2')) {
      localStorage.removeItem('homealone_expenses_v2');
      localStorage.removeItem('homealone_currency_v2');
    }

    // One-time migration from the old "homealone" key names to "tally".
    if (!localStorage.getItem(STORAGE_KEY_EXPENSES) && localStorage.getItem(LEGACY_STORAGE_KEY_EXPENSES)) {
      const legacyExpenses = localStorage.getItem(LEGACY_STORAGE_KEY_EXPENSES);
      const legacyCurrency = localStorage.getItem(LEGACY_STORAGE_KEY_CURRENCY);
      if (legacyExpenses) localStorage.setItem(STORAGE_KEY_EXPENSES, legacyExpenses);
      if (legacyCurrency) localStorage.setItem(STORAGE_KEY_CURRENCY, legacyCurrency);
      localStorage.removeItem(LEGACY_STORAGE_KEY_EXPENSES);
      localStorage.removeItem(LEGACY_STORAGE_KEY_CURRENCY);
    }

    const raw = localStorage.getItem(STORAGE_KEY_EXPENSES);
    if (!raw) {
      saveExpenses(INITIAL_EXPENSES);
      return INITIAL_EXPENSES;
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      saveExpenses(INITIAL_EXPENSES);
      return INITIAL_EXPENSES;
    }

    // Ensure all items are in EUR
    const sanitized = (parsed as ExpenseItem[]).map((item) => ({
      ...item,
      currency: item.currency === 'GBP' ? 'EUR' : (item.currency || 'EUR'),
    }));
    return sanitized;
  } catch (err) {
    console.error('Failed to load expenses from localStorage:', err);
    return INITIAL_EXPENSES;
  }
}

export function saveExpenses(expenses: ExpenseItem[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_EXPENSES, JSON.stringify(expenses));
  } catch (err) {
    console.error('Failed to save expenses to localStorage:', err);
  }
}

export function loadCurrency(): CurrencyCode {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CURRENCY);
    if (raw && ['EUR', 'GBP', 'USD', 'CAD', 'AUD', 'JPY'].includes(raw)) {
      return raw as CurrencyCode;
    }
    return 'EUR';
  } catch {
    return 'EUR';
  }
}

export function saveCurrency(currency: CurrencyCode): void {
  try {
    localStorage.setItem(STORAGE_KEY_CURRENCY, currency);
  } catch (err) {
    console.error('Failed to save currency to localStorage:', err);
  }
}

export function resetToDefaults(): ExpenseItem[] {
  saveCurrency('EUR');
  saveExpenses(INITIAL_EXPENSES);
  return INITIAL_EXPENSES;
}

export function exportExpensesJSON(expenses: ExpenseItem[]): void {
  const dataStr = JSON.stringify(
    {
      app: 'Tally',
      version: '3.0.0',
      exportedAt: new Date().toISOString(),
      expenses,
    },
    null,
    2
  );
  const blob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `tally-expenses-${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function exportExpensesCSV(expenses: ExpenseItem[], customCategories: CustomCategoryItem[] = []): void {
  const headers = [
    'Name',
    'Category',
    'Amount',
    'Currency',
    'Billing Cycle',
    'Monthly Equivalent',
    'Annual Equivalent',
    'Renewal Day',
    'Next Renewal Date',
    'Payment Method',
    'Status',
    'Usage Rating',
    'Contract End Date',
    'Notes',
  ];

  const rows = expenses.map((item) => [
    `"${item.name.replace(/"/g, '""')}"`,
    `"${getCategoryMeta(item.category, customCategories).name}"`,
    item.amount.toFixed(2),
    item.currency || 'EUR',
    item.billingCycle,
    getMonthlyEquivalent(item.amount, item.billingCycle).toFixed(2),
    getAnnualEquivalent(item.amount, item.billingCycle).toFixed(2),
    item.renewalDay,
    item.nextRenewalDate,
    `"${(item.paymentMethod || '').replace(/"/g, '""')}"`,
    item.isActive ? 'Active' : 'Paused',
    item.usageRating || 'unrated',
    item.contractEndDate || '',
    `"${(item.notes || '').replace(/"/g, '""')}"`,
  ]);

  const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `tally-expenses-${new Date().toISOString().split('T')[0]}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function importExpensesJSON(jsonStr: string): ExpenseItem[] {
  const parsed = JSON.parse(jsonStr);
  const items = Array.isArray(parsed) ? parsed : parsed.expenses;
  if (!Array.isArray(items)) {
    throw new Error('Invalid backup file format: missing expenses array');
  }

  const validated: ExpenseItem[] = items.map((item, idx) => ({
    id: item.id || `exp-import-${Date.now()}-${idx}`,
    name: item.name || 'Untitled Expense',
    amount: Number(item.amount) || 0,
    currency: item.currency || 'EUR',
    billingCycle: item.billingCycle || 'monthly',
    category: item.category || 'utilities',
    icon: item.icon || 'Zap',
    color: item.color || '#3155D9',
    renewalDay: Number(item.renewalDay) || 1,
    nextRenewalDate: item.nextRenewalDate || new Date().toISOString().split('T')[0],
    isPaidThisCycle: typeof item.isPaidThisCycle === 'boolean' ? item.isPaidThisCycle : false,
    lastPaidAt: item.lastPaidAt || null,
    paymentMethod: item.paymentMethod || 'SEPA Direct Debit',
    isActive: typeof item.isActive === 'boolean' ? item.isActive : true,
    notes: item.notes || '',
    contractEndDate: item.contractEndDate || '',
    usageRating: item.usageRating || 'high',
    createdAt: item.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }));

  saveExpenses(validated);
  return validated;
}
