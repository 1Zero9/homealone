export type ExpenseCategory = 
  | 'entertainment'  // Netflix, Spotify, Apple TV+, Disney+, YouTube
  | 'ai-tech'        // ChatGPT Plus, Claude Pro, Cursor, Midjourney, Copilot, Cloud
  | 'utilities'      // Electricity, Gas/Heating, Water, Broadband, Mobile
  | 'housing'        // Rent/Mortgage, Property Tax, Insurance, TV Licence
  | 'education'      // College Tuition, School Fees, Uniforms, Books, Lunches
  | 'lifestyle';     // Sports Club, Gym, Coaching, Activities, Health

export type BillingCycle = 'monthly' | 'annual' | 'quarterly' | 'weekly' | 'termly';

export type CurrencyCode = 'EUR' | 'GBP' | 'USD' | 'CAD' | 'AUD' | 'JPY';

export type UserRole = 'ADMIN' | 'MEMBER' | 'BACKUP_ADMIN';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatarUrl?: string;
  createdAt?: string;
  updatedAt?: string;
  _count?: {
    expenses: number;
  };
}

export interface CurrencyConfig {
  code: CurrencyCode;
  symbol: string;
  rateAgainstEUR: number;
  label: string;
}

export interface ExpenseItem {
  id: string;
  name: string;
  amount: number;
  currency: CurrencyCode;
  billingCycle: BillingCycle;
  category: ExpenseCategory;
  icon: string;
  color: string;
  renewalDay: number;
  nextRenewalDate: string;
  paymentMethod: string;
  isActive: boolean;
  notes?: string;
  contractEndDate?: string;
  usageRating?: 'high' | 'medium' | 'low';
  isPreset?: boolean;
  createdById?: string;
  createdBy?: {
    id: string;
    name: string;
    role: UserRole;
  };
  createdAt?: string;
  updatedAt?: string;
}

export interface DatabaseBackupRecord {
  id: string;
  createdById?: string;
  recordCount: number;
  notes?: string;
  createdAt: string;
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
  educationMonthly: number;
  lifestyleMonthly: number;
}
