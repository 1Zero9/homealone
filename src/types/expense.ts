export type ExpenseCategory = 
  | 'entertainment'  // Netflix, Spotify, Apple TV+, Disney+, YouTube
  | 'ai-tech'        // ChatGPT Plus, Claude Pro, Cursor, Midjourney, Copilot, Cloud
  | 'utilities'      // Electricity, Gas/Heating, Water, Broadband, Mobile
  | 'housing'        // Rent/Mortgage, Property Tax, Insurance, TV Licence
  | 'lifestyle';     // Gym, Health, Subscriptions, Meal Kits

export type BillingCycle = 'monthly' | 'annual' | 'quarterly' | 'weekly';

export type CurrencyCode = 'EUR' | 'GBP' | 'USD' | 'CAD' | 'AUD' | 'JPY';

export interface CurrencyConfig {
  code: CurrencyCode;
  symbol: string;
  rateAgainstEUR: number; // For live currency toggling relative to EUR base
  label: string;
}

export interface ExpenseItem {
  id: string;
  name: string;
  amount: number;             // Amount in the specified currency
  currency: CurrencyCode;
  billingCycle: BillingCycle;
  category: ExpenseCategory;
  icon: string;               // Icon identifier
  color: string;              // Hex color or accent marker
  renewalDay: number;         // Day of month (1-31)
  nextRenewalDate: string;    // ISO YYYY-MM-DD
  paymentMethod: string;      // e.g. "Direct Debit", "SEPA Debit", "Visa", "Mastercard", "Apple Pay"
  isActive: boolean;          // true = active, false = paused/cancelled
  notes?: string;
  contractEndDate?: string;   // Contract end date
  usageRating?: 'high' | 'medium' | 'low';
  isPreset?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CategoryInfo {
  id: ExpenseCategory;
  name: string;
  description: string;
  color: string;
  bgColor: string;
  borderColor: string;
  icon: string;
}

export interface PresetItem {
  id: string;
  name: string;
  defaultAmount: number;
  category: ExpenseCategory;
  defaultCycle: BillingCycle;
  color: string;
  icon: string;
  description: string;
  defaultPaymentMethod: string;
  popular: boolean;
  notes?: string;
}

export interface SpendingSummary {
  monthlyTotal: number;
  annualTotal: number;
  weeklyTotal: number;
  dailyAverage: number;
  activeCount: number;
  pausedCount: number;
  pausedMonthlySavings: number;
  topCategory: {
    category: ExpenseCategory;
    name: string;
    amount: number;
    percentage: number;
  } | null;
  aiTechMonthly: number;
  utilitiesMonthly: number;
  streamingMonthly: number;
  housingMonthly: number;
  lifestyleMonthly: number;
}
