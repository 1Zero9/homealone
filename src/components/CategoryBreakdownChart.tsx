import React from 'react';
import type { ExpenseItem, CurrencyCode } from '../types/expense';
import { CATEGORY_LIST } from '../data/categories';
import { convertCurrency, getMonthlyEquivalent } from '../utils/calculations';
import { formatCurrency } from '../utils/formatters';

interface CategoryBreakdownChartProps {
  expenses: ExpenseItem[];
  currency: CurrencyCode;
  selectedCategory: string | null;
  onSelectCategory: (category: string | null) => void;
}

export const CategoryBreakdownChart: React.FC<CategoryBreakdownChartProps> = ({
  expenses,
  currency,
  selectedCategory,
  onSelectCategory,
}) => {
  const activeExpenses = expenses.filter((e) => e.isActive);
  const totalSpend = activeExpenses.reduce((sum, item) => {
    const amountInDisplay = convertCurrency(item.amount, item.currency, currency);
    return sum + getMonthlyEquivalent(amountInDisplay, item.billingCycle);
  }, 0);

  const categoryData = CATEGORY_LIST.map((cat) => {
    const catItems = activeExpenses.filter((e) => e.category === cat.id);
    const monthlyAmount = catItems.reduce((sum, item) => {
      const amountInDisplay = convertCurrency(item.amount, item.currency, currency);
      return sum + getMonthlyEquivalent(amountInDisplay, item.billingCycle);
    }, 0);
    const percentage = totalSpend > 0 ? (monthlyAmount / totalSpend) * 100 : 0;
    return {
      ...cat,
      itemCount: catItems.length,
      monthlyAmount,
      percentage: Math.round(percentage * 10) / 10,
    };
  }).sort((a, b) => b.monthlyAmount - a.monthlyAmount);

  return (
    <div className="ha-card" style={{ padding: '1rem 1.25rem', marginBottom: '1.25rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.65rem', gap: '0.75rem', flexWrap: 'wrap' }}>
        <h3 style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--ha-muted)', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
          Category distribution
        </h3>

        {selectedCategory && (
          <button
            onClick={() => onSelectCategory(null)}
            className="btn btn-secondary"
            style={{ fontSize: '0.75rem', padding: '0.25rem 0.6rem' }}
          >
            Show all categories
          </button>
        )}
      </div>

      {/* Horizontal Stacked Proportion Track */}
      <div style={{
        height: '8px',
        backgroundColor: 'var(--ha-line)',
        borderRadius: 'var(--ha-radius-sm)',
        display: 'flex',
        overflow: 'hidden',
        marginBottom: '0.75rem',
      }}>
        {categoryData.map((cat) => {
          if (cat.percentage <= 0) return null;
          return (
            <div
              key={cat.id}
              style={{
                width: `${cat.percentage}%`,
                height: '100%',
                backgroundColor: cat.color,
                transition: 'width 0.2s ease',
              }}
              title={`${cat.name}: ${cat.percentage}%`}
            />
          );
        })}
      </div>

      {/* Compact Category Legend / Filter Chips */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
        {categoryData.filter((cat) => cat.itemCount > 0).map((cat) => {
          const isSelected = selectedCategory === cat.id;

          return (
            <button
              key={cat.id}
              onClick={() => onSelectCategory(isSelected ? null : cat.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '0.3rem 0.6rem',
                borderRadius: 'var(--ha-radius-sm)',
                backgroundColor: isSelected ? 'var(--ha-blue-light)' : '#fafaf7',
                border: isSelected ? '1px solid var(--ha-blue)' : '1px solid var(--ha-line)',
                cursor: 'pointer',
                transition: 'background-color 0.12s ease',
              }}
            >
              <span className="ha-color-marker" style={{ backgroundColor: cat.color }} />
              <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--ha-ink)' }}>
                {cat.name}
              </span>
              <span className="tabular-nums" style={{ fontSize: '0.78rem', color: 'var(--ha-muted)' }}>
                {formatCurrency(cat.monthlyAmount, currency)}
              </span>
              <span className="tabular-nums" style={{ fontSize: '0.72rem', color: 'var(--ha-muted)' }}>
                {cat.percentage}%
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
