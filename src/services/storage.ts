import type { CurrencyCode, ExpenseItem, CustomCategoryItem } from '../types/expense';
import { getCategoryMeta } from '../data/categories';
import { getMonthlyEquivalent, getAnnualEquivalent } from '../utils/calculations';

const STORAGE_KEY_CURRENCY = 'tally_currency_v3';

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
