import React from 'react';
import type { SpendingSummary, CurrencyCode } from '../types/expense';
import { formatCurrency } from '../utils/formatters';
import { ArrowRight } from 'lucide-react';

interface DashboardStatsProps {
  summary: SpendingSummary;
  currency: CurrencyCode;
  onFilterCategory?: (category: string) => void;
}

export const DashboardStats: React.FC<DashboardStatsProps> = ({
  summary,
  currency,
  onFilterCategory,
}) => {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
      gap: '1rem',
      marginBottom: '1.75rem',
    }}>
      {/* 1. Monthly Total (Visually Dominant) */}
      <div className="ha-card" style={{ padding: '1.5rem', position: 'relative' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
          <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--ha-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Monthly Commitments
          </span>
          <span className="ha-badge ha-badge-blue">
            {summary.activeCount} active
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.4rem', marginBottom: '0.5rem' }}>
          <h2 className="tabular-nums" style={{
            fontSize: '2.5rem',
            fontWeight: 700,
            color: 'var(--ha-ink)',
            lineHeight: 1.1,
            fontFamily: 'var(--ha-font-body)',
          }}>
            {formatCurrency(summary.monthlyTotal, currency)}
          </h2>
          <span style={{ fontSize: '0.9rem', color: 'var(--ha-muted)', fontWeight: 500 }}>/month</span>
        </div>

        <div style={{ fontSize: '0.8rem', color: 'var(--ha-muted)', display: 'flex', gap: '0.75rem' }}>
          <span className="tabular-nums">≈ {formatCurrency(summary.dailyAverage, currency)}/day</span>
          <span>•</span>
          <span className="tabular-nums">{formatCurrency(summary.weeklyTotal, currency)}/week</span>
        </div>
      </div>

      {/* 2. Projected Annual Spend */}
      <div className="ha-card" style={{ padding: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
          <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--ha-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Annual Fixed Run Rate
          </span>
          <span className="ha-badge ha-badge-neutral">
            12 months
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.4rem', marginBottom: '0.5rem' }}>
          <h2 className="tabular-nums" style={{
            fontSize: '2.25rem',
            fontWeight: 700,
            color: 'var(--ha-ink)',
            lineHeight: 1.1,
            fontFamily: 'var(--ha-font-body)',
          }}>
            {formatCurrency(summary.annualTotal, currency)}
          </h2>
          <span style={{ fontSize: '0.9rem', color: 'var(--ha-muted)', fontWeight: 500 }}>/year</span>
        </div>

        <div style={{ fontSize: '0.8rem', color: 'var(--ha-muted)' }}>
          Fixed annual household obligations
        </div>
      </div>

      {/* 3. AI & Tech Services Card */}
      <div
        className="ha-card-interactive"
        onClick={() => onFilterCategory?.('ai-tech')}
        style={{ padding: '1.5rem' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
          <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--ha-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            AI & Software Stack
          </span>
          <ArrowRight size={15} color="var(--ha-blue)" />
        </div>

        <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.4rem', marginBottom: '0.5rem' }}>
          <h2 className="tabular-nums" style={{
            fontSize: '2.25rem',
            fontWeight: 700,
            color: 'var(--ha-blue)',
            lineHeight: 1.1,
            fontFamily: 'var(--ha-font-body)',
          }}>
            {formatCurrency(summary.aiTechMonthly, currency)}
          </h2>
          <span style={{ fontSize: '0.9rem', color: 'var(--ha-muted)', fontWeight: 500 }}>/month</span>
        </div>

        <div style={{ fontSize: '0.8rem', color: 'var(--ha-muted)' }}>
          {summary.monthlyTotal > 0
            ? `${Math.round((summary.aiTechMonthly / summary.monthlyTotal) * 100)}% of total monthly spend`
            : 'ChatGPT, Claude, Cursor and cloud'}
        </div>
      </div>

      {/* 4. Home Utilities & Power */}
      <div
        className="ha-card-interactive"
        onClick={() => onFilterCategory?.('utilities')}
        style={{ padding: '1.5rem' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
          <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--ha-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Essential Utilities
          </span>
          <ArrowRight size={15} color="var(--ha-blue)" />
        </div>

        <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.4rem', marginBottom: '0.5rem' }}>
          <h2 className="tabular-nums" style={{
            fontSize: '2.25rem',
            fontWeight: 700,
            color: 'var(--ha-ink)',
            lineHeight: 1.1,
            fontFamily: 'var(--ha-font-body)',
          }}>
            {formatCurrency(summary.utilitiesMonthly, currency)}
          </h2>
          <span style={{ fontSize: '0.9rem', color: 'var(--ha-muted)', fontWeight: 500 }}>/month</span>
        </div>

        <div style={{ fontSize: '0.8rem', color: 'var(--ha-muted)' }}>
          Power, heating, water and fiber broadband
        </div>
      </div>
    </div>
  );
};
