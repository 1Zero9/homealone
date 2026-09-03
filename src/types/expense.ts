export type ExpenseCategory = 
  | 'entertainment'  // Netflix, Spotify, Apple TV+, Disney+, YouTube
  | 'ai-tech'        // ChatGPT Plus, Claude Pro, Cursor, Midjourney, Copilot, Cloud
  | 'utilities'      // Electricity, Gas/Heating, Water, Broadband, Mobile
  | 'housing'        // Rent/Mortgage, Property Tax, Insurance, TV Licence
  | 'education'      // College Tuition, School Fees, Uniforms, Books, Lunches
  | 'lifestyle'      // Sports Club, Gym, Coaching, Activities, Health
  | 'shopping';      // Groceries & general shopping — one lump total, not itemized

export type IncomeCategory = 'salary' | 'freelance' | 'rental' | 'benefits' | 'other';

export type BillingCycle = 'monthly' | 'annual' | 'quarterly' | 'weekly' | 'termly';

export type CurrencyCode = 'EUR' | 'GBP' | 'USD' | 'CAD' | 'AUD' | 'JPY';

export type UserRole = 'ADMIN' | 'MEMBER' | 'BACKUP_ADMIN';

export type AccountType =
  | 'CHECKING'
  | 'SAVINGS'
  | 'CREDIT_UNION'
  | 'CREDIT_CARD'
  | 'DEBIT_CARD'
  | 'PAYPAL'
  | 'LOAN'
  | 'INVESTMENT'
  | 'OTHER';

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
  isPaidThisCycle: boolean;
  lastPaidAt?: string | null;
  paymentMethod: string;
  isActive: boolean;
  notes?: string;
  contractEndDate?: string;
  vendorEmail?: string;
  usageRating?: 'high' | 'medium' | 'low';
  isVariable?: boolean;
  isPreset?: boolean;
  paymentAccountId?: string | null;
  paymentAccount?: AccountSummary | null;
  createdById?: string;
  createdBy?: {
    id: string;
    name: string;
    role: UserRole;
  };
  createdAt?: string;
  updatedAt?: string;
}

export interface IncomeItem {
  id: string;
  name: string;
  amount: number;
  currency: CurrencyCode;
  frequency: BillingCycle;
  category: IncomeCategory;
  isActive: boolean;
  notes?: string;
  depositAccountId?: string | null;
  depositAccount?: AccountSummary | null;
  createdById?: string;
  createdBy?: {
    id: string;
    name: string;
    role: UserRole;
  };
  createdAt?: string;
  updatedAt?: string;
}

export interface AccountSummary {
  id: string;
  name: string;
  type: AccountType;
  institution?: string | null;
}

export interface AccountItem {
  id: string;
  name: string;
  institution?: string | null;
  type: AccountType;
  currency: CurrencyCode;
  notes?: string | null;
  isActive: boolean;

  hasAccountNumber: boolean;
  hasRoutingNumber: boolean;
  hasLoginUsername: boolean;
  hasLoginPassword: boolean;
  hasLoginUrl: boolean;
  hasSecurityNotes: boolean;

  originalAmount?: number | null;
  interestRate?: number | null;
  termMonths?: number | null;
  payoffDate?: string | null;

  createdById?: string | null;
  createdBy?: {
    id: string;
    name: string;
    role: UserRole;
  } | null;
  _count?: {
    expenses: number;
    incomes: number;
  };
  createdAt?: string;
  updatedAt?: string;
}

export interface TransferItem {
  id: string;
  amount: number;
  currency: CurrencyCode;
  date: string;
  note?: string | null;
  externalLabel?: string | null;

  fromAccountId?: string | null;
  fromAccount?: AccountSummary | null;

  toAccountId?: string | null;
  toAccount?: AccountSummary | null;

  linkedExpenseId?: string | null;
  linkedExpense?: { id: string; name: string } | null;

  linkedIncomeId?: string | null;
  linkedIncome?: { id: string; name: string } | null;

  createdById?: string | null;
  createdBy?: {
    id: string;
    name: string;
    role: UserRole;
  } | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface GoalItem {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  currency: CurrencyCode;
  targetDate?: string | null;
  notes?: string | null;
  isActive: boolean;

  linkedAccountId?: string | null;
  linkedAccount?: AccountSummary | null;

  createdById?: string | null;
  createdBy?: {
    id: string;
    name: string;
    role: UserRole;
  } | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface IncomeSummary {
  monthlyTotal: number;
  annualTotal: number;
  activeCount: number;
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
  shoppingMonthly: number;
}
