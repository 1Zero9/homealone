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
    <div className="ha-card" style={{ padding: '1.5rem', marginBottom: '1.75rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
        <div>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--ha-ink)', marginBottom: '0.15rem' }}>
            Category distribution
          </h3>
          <p style={{ fontSize: '0.82rem', color: 'var(--ha-muted)' }}>
            Monthly obligations by category
          </p>
        </div>

        {selectedCategory && (
          <button
            onClick={() => onSelectCategory(null)}
            className="btn btn-secondary"
            style={{ fontSize: '0.8rem', padding: '0.35rem 0.75rem' }}
          >
            Show all categories
          </button>
        )}
      </div>

      {/* Horizontal Stacked Proportion Track */}
      <div style={{
        height: '10px',
        backgroundColor: 'var(--ha-line)',
        borderRadius: 'var(--ha-radius-sm)',
        display: 'flex',
        overflow: 'hidden',
        marginBottom: '1.5rem',
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

      {/* Category Rows with Horizontal Relative Bars */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {categoryData.map((cat) => {
          const isSelected = selectedCategory === cat.id;
          const maxAmount = categoryData[0]?.monthlyAmount || 1;
          const relativeBarWidth = (cat.monthlyAmount / maxAmount) * 100;

          return (
            <div
              key={cat.id}
              onClick={() => onSelectCategory(isSelected ? null : cat.id)}
              style={{
                padding: '0.75rem 1rem',
                borderRadius: 'var(--ha-radius-md)',
                backgroundColor: isSelected ? 'var(--ha-blue-light)' : '#fafaf7',
                border: isSelected ? '1px solid var(--ha-blue)' : '1px solid var(--ha-line)',
                cursor: 'pointer',
                transition: 'background-color 0.12s ease',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                  <span className="ha-color-marker" style={{ backgroundColor: cat.color }} />
                  <div>
                    <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--ha-ink)' }}>
                      {cat.name}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--ha-muted)', marginLeft: '0.5rem' }}>
                      ({cat.itemCount} {cat.itemCount === 1 ? 'item' : 'items'})
                    </span>
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <span className="tabular-nums" style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--ha-ink)' }}>
                    {formatCurrency(cat.monthlyAmount, currency)}
                  </span>
                  <span className="tabular-nums" style={{ fontSize: '0.8rem', color: 'var(--ha-muted)', marginLeft: '0.5rem' }}>
                    {cat.percentage}%
                  </span>
                </div>
              </div>

              {/* Relative bar track */}
              <div style={{
                height: '4px',
                backgroundColor: 'var(--ha-line)',
                borderRadius: '2px',
                overflow: 'hidden',
              }}>
                <div style={{
                  width: `${relativeBarWidth}%`,
                  height: '100%',
                  backgroundColor: cat.color,
                  borderRadius: '2px',
                }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
