import type { CategoryInfo, ExpenseCategory } from '../types/expense';

export const CATEGORIES: Record<ExpenseCategory, CategoryInfo> = {
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
    description: 'Electricity, Gas/Heating, Water, Fiber Broadband & Mobile bills',
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
};

export const CATEGORY_LIST = Object.values(CATEGORIES);
