import React from 'react';
import type { CurrencyCode } from '../types/expense';
import { formatCurrency } from '../utils/formatters';
import { ArrowDownRight, ArrowUpRight, Scale } from 'lucide-react';

interface CashFlowSummaryProps {
  monthlyIncome: number;
  monthlyExpenses: number;
  currency: CurrencyCode;
  onOpenAddIncome?: () => void;
}

export const CashFlowSummary: React.FC<CashFlowSummaryProps> = ({
  monthlyIncome,
  monthlyExpenses,
  currency,
  onOpenAddIncome,
}) => {
  const net = monthlyIncome - monthlyExpenses;
  const hasIncome = monthlyIncome > 0;

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
      gap: '1rem',
      marginBottom: '1.75rem',
    }}>
      <div className="ha-card" style={{ padding: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
          <ArrowUpRight size={16} color="var(--ha-blue)" />
          <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--ha-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Money in
          </span>
        </div>
        {hasIncome ? (
          <div className="tabular-nums" style={{ fontSize: '1.85rem', fontWeight: 700, color: 'var(--ha-ink)', lineHeight: 1.1 }}>
            {formatCurrency(monthlyIncome, currency)}
            <span style={{ fontSize: '0.85rem', color: 'var(--ha-muted)', fontWeight: 500 }}>/mo</span>
          </div>
        ) : (
          <button
            onClick={onOpenAddIncome}
            className="btn btn-secondary"
            style={{ fontSize: '0.8rem', marginTop: '0.15rem' }}
          >
            + Add income to see net
          </button>
        )}
      </div>

      <div className="ha-card" style={{ padding: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
          <ArrowDownRight size={16} color="var(--ha-red)" />
          <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--ha-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Money out
          </span>
        </div>
        <div className="tabular-nums" style={{ fontSize: '1.85rem', fontWeight: 700, color: 'var(--ha-ink)', lineHeight: 1.1 }}>
          {formatCurrency(monthlyExpenses, currency)}
          <span style={{ fontSize: '0.85rem', color: 'var(--ha-muted)', fontWeight: 500 }}>/mo</span>
        </div>
      </div>

      {hasIncome && (
        <div className="ha-card" style={{
          padding: '1.25rem',
          backgroundColor: net >= 0 ? 'var(--ha-lime-tint)' : 'var(--ha-red-tint)',
          border: `1px solid ${net >= 0 ? 'var(--ha-lime)' : 'var(--ha-red)'}`,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <Scale size={16} color="var(--ha-ink)" />
            <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--ha-ink)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Net {net >= 0 ? 'surplus' : 'shortfall'}
            </span>
          </div>
          <div className="tabular-nums" style={{ fontSize: '1.85rem', fontWeight: 700, color: 'var(--ha-ink)', lineHeight: 1.1 }}>
            {net >= 0 ? '+' : ''}{formatCurrency(net, currency)}
            <span style={{ fontSize: '0.85rem', color: 'var(--ha-muted)', fontWeight: 500 }}>/mo</span>
          </div>
        </div>
      )}
    </div>
  );
};
