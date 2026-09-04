import type { CategoryInfo, BuiltinExpenseCategory, CustomCategoryItem } from '../types/expense';

export const CATEGORIES: Record<BuiltinExpenseCategory, CategoryInfo> = {
  'education': {
    id: 'education',
    name: 'Education & Schooling',
    description: 'College tuition, school fees, transport, books, uniform & lunches',
    color: '#3155D9', // Ultramarine
    bgColor: '#eef2fc',
    borderColor: '#d0daf7',
    icon: 'GraduationCap',
  },
  'lifestyle': {
    id: 'lifestyle',
    name: 'Sports & Activities',
    description: 'Sports clubs, football/swimming coaching, gym, fitness & extracurriculars',
    color: '#202124', // Graphite
    bgColor: '#f4f5f6',
    borderColor: '#e7e8ea',
    icon: 'Dumbbell',
  },
  'utilities': {
    id: 'utilities',
    name: 'Home Utilities',
    description: 'Electricity, Gas/Heating, Water, Fibre Broadband & Mobile bills',
    color: '#1a3299', // Deep Blue
    bgColor: '#eef2fc',
    borderColor: '#d0daf7',
    icon: 'Zap',
  },
  'housing': {
    id: 'housing',
    name: 'Housing & Property',
    description: 'Rent/Mortgage, Council & Property Tax, Home Insurance, TV Licence',
    color: '#676B73', // Mid Grey
    bgColor: '#f1f2f4',
    borderColor: '#e7e8ea',
    icon: 'Home',
  },
  'ai-tech': {
    id: 'ai-tech',
    name: 'AI & Tech Services',
    description: 'ChatGPT Plus, Claude Pro, Cursor, Midjourney, Copilot & cloud services',
    color: '#3155D9',
    bgColor: '#e8ecfa',
    borderColor: '#c6d3f7',
    icon: 'Bot',
  },
  'entertainment': {
    id: 'entertainment',
    name: 'Streaming & Media',
    description: 'Netflix, Spotify, Apple TV+, Disney+, YouTube & entertainment subscriptions',
    color: '#F04E3E', // Tomato Red
    bgColor: '#fef2f1',
    borderColor: '#fcd3cf',
    icon: 'Tv',
  },
  'shopping': {
    id: 'shopping',
    name: 'Shopping & Groceries',
    description: 'One monthly total for groceries and general shopping — no itemizing',
    color: '#8A5CF6', // Violet
    bgColor: '#f4effe',
    borderColor: '#ded0fb',
    icon: 'ShoppingCart',
  },
  'big-ticket': {
    id: 'big-ticket',
    name: 'Mortgage, Loans & Big Purchases',
    description: 'Mortgage repayments, car & personal loans, holidays and other major financed purchases',
    color: '#B45309', // Amber/Gold
    bgColor: '#fdf2e3',
    borderColor: '#f6dfb8',
    icon: 'Landmark',
  },
  'insurance': {
    id: 'insurance',
    name: 'Insurance, Motor Tax & NCT',
    description: 'Car, life & health insurance, motor tax and NCT — vehicle and personal cover kept separate from household bills',
    color: '#0E7490', // Teal
    bgColor: '#e7f5f8',
    borderColor: '#bfe3ea',
    icon: 'ShieldCheck',
  },
};

export const CATEGORY_LIST = Object.values(CATEGORIES);

export function isBuiltinCategory(id: string): id is BuiltinExpenseCategory {
  return Object.prototype.hasOwnProperty.call(CATEGORIES, id);
}

// A rotating palette used to auto-assign a color to newly created custom
// categories, so households don't have to pick one — cycles by count of
// existing custom categories at creation time.
export const CUSTOM_CATEGORY_PALETTE: { color: string; bgColor: string; borderColor: string }[] = [
  { color: '#0E7490', bgColor: '#e7f5f8', borderColor: '#bfe3ea' }, // Teal
  { color: '#B45309', bgColor: '#fdf2e3', borderColor: '#f6dfb8' }, // Amber
  { color: '#8A5CF6', bgColor: '#f4effe', borderColor: '#ded0fb' }, // Violet
  { color: '#F04E3E', bgColor: '#fef2f1', borderColor: '#fcd3cf' }, // Tomato
  { color: '#3155D9', bgColor: '#eef2fc', borderColor: '#d0daf7' }, // Ultramarine
  { color: '#676B73', bgColor: '#f1f2f4', borderColor: '#e7e8ea' }, // Grey
];

export function pickCustomCategoryColors(existingCustomCount: number) {
  return CUSTOM_CATEGORY_PALETTE[existingCustomCount % CUSTOM_CATEGORY_PALETTE.length];
}

const FALLBACK_META: CategoryInfo = {
  id: 'utilities',
  name: 'Other',
  description: 'Uncategorized',
  color: '#676B73',
  bgColor: '#f1f2f4',
  borderColor: '#e7e8ea',
  icon: 'Tag',
};

/**
 * Resolves display metadata (name/icon/color) for any category id — built-in
 * or household-defined custom — falling back gracefully if the id isn't
 * recognized (e.g. a custom category was since deleted).
 */
export function getCategoryMeta(
  id: string | null | undefined,
  customCategories?: CustomCategoryItem[]
): CategoryInfo {
  if (!id) return FALLBACK_META;
  if (isBuiltinCategory(id)) return CATEGORIES[id];
  const custom = customCategories?.find((c) => c.id === id);
  if (custom) {
    return {
      id: custom.id,
      name: custom.name,
      description: custom.name,
      color: custom.color,
      bgColor: custom.bgColor,
      borderColor: custom.borderColor,
      icon: custom.icon,
    };
  }
  return { ...FALLBACK_META, id, name: id };
}
