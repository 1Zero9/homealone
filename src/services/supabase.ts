import { createClient } from '@supabase/supabase-js';
import type { ExpenseItem } from '../types/expense';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const isCloudSyncConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase = isCloudSyncConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

/**
 * Fetch expenses from Supabase cloud database if configured, or returns null.
 */
export async function fetchExpensesFromCloud(): Promise<ExpenseItem[] | null> {
  if (!supabase) return null;

  try {
    const { data, error } = await supabase
      .from('expenses')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Supabase fetch error:', error.message);
      return null;
    }

    if (data && Array.isArray(data)) {
      return data.map((row: any) => ({
        id: row.id,
        name: row.name,
        amount: Number(row.amount),
        currency: row.currency || 'EUR',
        billingCycle: row.billing_cycle || 'monthly',
        category: row.category || 'utilities',
        icon: row.icon || 'Zap',
        color: row.color || '#3155D9',
        renewalDay: Number(row.renewal_day) || 1,
        nextRenewalDate: row.next_renewal_date,
        paymentMethod: row.payment_method || 'SEPA Direct Debit',
        isActive: Boolean(row.is_active),
        notes: row.notes || '',
        contractEndDate: row.contract_end_date || undefined,
        usageRating: row.usage_rating || 'high',
        createdAt: row.created_at || new Date().toISOString(),
        updatedAt: row.updated_at || new Date().toISOString(),
      }));
    }

    return null;
  } catch (err) {
    console.warn('Cloud sync error:', err);
    return null;
  }
}

/**
 * Syncs an expense item to Supabase cloud database.
 */
export async function syncExpenseToCloud(item: ExpenseItem): Promise<boolean> {
  if (!supabase) return false;

  try {
    const { error } = await supabase.from('expenses').upsert({
      id: item.id,
      name: item.name,
      amount: item.amount,
      currency: item.currency,
      billing_cycle: item.billingCycle,
      category: item.category,
      icon: item.icon,
      color: item.color,
      renewal_day: item.renewalDay,
      next_renewal_date: item.nextRenewalDate,
      payment_method: item.paymentMethod,
      is_active: item.isActive,
      notes: item.notes,
      contract_end_date: item.contractEndDate,
      usage_rating: item.usageRating,
      updated_at: new Date().toISOString(),
    });

    return !error;
  } catch {
    return false;
  }
}

/**
 * Deletes an expense item from Supabase cloud database.
 */
export async function deleteExpenseFromCloud(id: string): Promise<boolean> {
  if (!supabase) return false;

  try {
    const { error } = await supabase.from('expenses').delete().eq('id', id);
    return !error;
  } catch {
    return false;
  }
}
