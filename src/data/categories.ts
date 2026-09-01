import type { CategoryInfo, ExpenseCategory } from '../types/expense';

export const CATEGORIES: Record<ExpenseCategory, CategoryInfo> = {
  'utilities': {
    id: 'utilities',
    name: 'Home Utilities',
    description: 'Electricity, Gas/Heating, Water, Fiber Broadband & Mobile bills',
    color: '#3155D9', // Ultramarine
    bgColor: '#eef2fc',
    borderColor: '#d0daf7',
    icon: 'Zap',
  },
  'housing': {
    id: 'housing',
    name: 'Housing & Bills',
    description: 'Rent/Mortgage, Council & Property Tax, Home Insurance, TV Licence',
    color: '#202124', // Graphite
    bgColor: '#f1f2f4',
    borderColor: '#e7e8ea',
    icon: 'Home',
  },
  'ai-tech': {
    id: 'ai-tech',
    name: 'AI Services & Tech',
    description: 'ChatGPT Plus, Claude Pro, Cursor, Midjourney, Copilot & cloud services',
    color: '#1a3299', // Deep Ultramarine
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
  'lifestyle': {
    id: 'lifestyle',
    name: 'Lifestyle & Wellness',
    description: 'Gym memberships, Fitness apps, Health subscriptions & meal delivery',
    color: '#676B73', // Mid Grey
    bgColor: '#f4f5f6',
    borderColor: '#e7e8ea',
    icon: 'Sparkles',
  },
};

export const CATEGORY_LIST = Object.values(CATEGORIES);
