import React from 'react';
import type { ExpenseItem, CurrencyCode } from '../types/expense';
import { convertCurrency, getMonthlyEquivalent } from '../utils/calculations';
import { formatCurrency } from '../utils/formatters';

interface OptimizationInsightsProps {
  expenses: ExpenseItem[];
  currency: CurrencyCode;
}

export const OptimizationInsights: React.FC<OptimizationInsightsProps> = ({
  expenses,
  currency,
}) => {
  const activeItems = expenses.filter((e) => e.isActive);

  // 1. Annual Billing Opportunity
  const monthlyOnlyServices = activeItems.filter((e) => e.billingCycle === 'monthly' && e.amount > 8);
  const potentialAnnualSavings = monthlyOnlyServices.reduce((sum, item) => {
    const amountInDisplay = convertCurrency(item.amount, item.currency, currency);
    // Typical annual plan discount is ~16% (2 months free)
    return sum + (amountInDisplay * 2);
  }, 0);

  // 2. Multiple AI Services Analysis
  const aiItems = activeItems.filter((e) => e.category === 'ai-tech');
  const aiTotalMonthly = aiItems.reduce((sum, item) => {
    return sum + getMonthlyEquivalent(convertCurrency(item.amount, item.currency, currency), item.billingCycle);
  }, 0);

  // 3. Streaming Total
  const streamingItems = activeItems.filter((e) => e.category === 'entertainment');
  const streamingTotalMonthly = streamingItems.reduce((sum, item) => {
    return sum + getMonthlyEquivalent(convertCurrency(item.amount, item.currency, currency), item.billingCycle);
  }, 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* Header Banner */}
      <div className="ha-card" style={{ padding: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
              <span className="ha-badge ha-badge-lime">
                Review & analysis
              </span>
            </div>
            <h2 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--ha-ink)', lineHeight: 1.1 }}>
              Spending optimization
            </h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--ha-muted)', maxWidth: '600px', marginTop: '0.25rem' }}>
              Objective calculations on billing cycles, duplicate services and potential annual reductions.
            </p>
          </div>

          <div style={{
            backgroundColor: 'var(--ha-lime-tint)',
            border: '1px solid var(--ha-lime)',
            padding: '0.75rem 1.25rem',
            borderRadius: 'var(--ha-radius-md)',
            textAlign: 'center',
          }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--ha-ink)', textTransform: 'uppercase', fontWeight: 600 }}>
              Potential annual reduction
            </div>
            <div className="tabular-nums" style={{ fontSize: '1.65rem', fontWeight: 700, color: 'var(--ha-ink)' }}>
              {formatCurrency(potentialAnnualSavings, currency)}
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--ha-muted)' }}>
              via annual billing discounts
            </div>
          </div>
        </div>
      </div>

      {/* Analysis Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem' }}>
        {/* 1. Annual Billing Calculation */}
        <div className="ha-card" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--ha-ink)', marginBottom: '0.5rem' }}>
            Annual plan conversion
          </h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--ha-muted)', marginBottom: '1rem', lineHeight: 1.45 }}>
            You have <strong>{monthlyOnlyServices.length} active monthly subscriptions</strong>. Standard software services offer ~16% discount (equivalent to 2 months free) on annual commitments.
          </p>

          <div style={{
            backgroundColor: '#fafaf7',
            padding: '0.75rem 1rem',
            borderRadius: 'var(--ha-radius-sm)',
            border: '1px solid var(--ha-line)',
          }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--ha-muted)' }}>Estimated annual discount:</div>
            <div className="tabular-nums" style={{ fontSize: '1.35rem', fontWeight: 700, color: 'var(--ha-blue)' }}>
              {formatCurrency(potentialAnnualSavings, currency)}/year
            </div>
          </div>
        </div>

        {/* 2. AI Tool Stack */}
        <div className="ha-card" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--ha-ink)', marginBottom: '0.5rem' }}>
            AI & developer commitments
          </h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--ha-muted)', marginBottom: '1rem', lineHeight: 1.45 }}>
            Total AI software spend is currently <strong>{formatCurrency(aiTotalMonthly, currency)}/month</strong> across {aiItems.length} active tools.
          </p>
          <div style={{ fontSize: '0.82rem', color: 'var(--ha-muted)', lineHeight: 1.45 }}>
            • Cursor Pro includes code autocomplete and project indexing with Claude 3.5 Sonnet.<br />
            • Pausing standalone ChatGPT Plus during low usage saves {formatCurrency(22.99 * 12, currency)}/year.
          </div>
        </div>

        {/* 3. Media Subscriptions */}
        <div className="ha-card" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--ha-ink)', marginBottom: '0.5rem' }}>
            Media & streaming rotation
          </h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--ha-muted)', marginBottom: '1rem', lineHeight: 1.45 }}>
            Total streaming spend is <strong>{formatCurrency(streamingTotalMonthly, currency)}/month</strong> across {streamingItems.length} platforms (Netflix, Spotify, Apple TV+).
          </p>
          <div style={{ fontSize: '0.82rem', color: 'var(--ha-muted)', lineHeight: 1.45 }}>
            Rotating on-demand video services sequentially rather than holding concurrent active subscriptions reduces media spend by over 40%.
          </div>
        </div>
      </div>
    </div>
  );
};
