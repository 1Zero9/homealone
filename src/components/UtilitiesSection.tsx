import React from 'react';
import type { ExpenseItem, CurrencyCode } from '../types/expense';
import { convertCurrency, getMonthlyEquivalent } from '../utils/calculations';
import { formatCurrency, formatBillingCycle, formatDate } from '../utils/formatters';
import { Plus, Edit2, Calendar } from 'lucide-react';
import { CollapsibleSection } from './CollapsibleSection';

interface UtilitiesSectionProps {
  expenses: ExpenseItem[];
  currency: CurrencyCode;
  onEditExpense: (expense: ExpenseItem) => void;
  onOpenAddModal: () => void;
  onOpenAddPreset: (presetId: string) => void;
}

export const UtilitiesSection: React.FC<UtilitiesSectionProps> = ({
  expenses,
  currency,
  onEditExpense,
  onOpenAddModal,
  onOpenAddPreset,
}) => {
  const utilityItems = expenses.filter((e) => e.category === 'utilities' || e.category === 'housing');
  const activeUtilities = utilityItems.filter((e) => e.isActive);

  const monthlyTotal = activeUtilities.reduce((sum, item) => {
    const amountInDisplay = convertCurrency(item.amount, item.currency, currency);
    return sum + getMonthlyEquivalent(amountInDisplay, item.billingCycle);
  }, 0);

  const annualTotal = monthlyTotal * 12;
  const itemsWithContracts = utilityItems.filter((e) => e.contractEndDate);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* Header Banner */}
      <div className="ha-card" style={{ padding: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
              <span className="ha-badge ha-badge-blue">
                Household essentials
              </span>
            </div>
            <h2 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--ha-ink)', lineHeight: 1.1 }}>
              Utilities & essential bills
            </h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--ha-muted)', maxWidth: '600px', marginTop: '0.25rem' }}>
              Fixed direct debits for electricity, heating, water, fibre broadband and municipal taxes.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--ha-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
                Essential monthly total
              </div>
              <div className="tabular-nums" style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--ha-ink)' }}>
                {formatCurrency(monthlyTotal, currency)}
              </div>
              <div className="tabular-nums" style={{ fontSize: '0.8rem', color: 'var(--ha-muted)' }}>
                {formatCurrency(annualTotal, currency)}/year
              </div>
            </div>

            <button
              onClick={onOpenAddModal}
              className="btn btn-primary"
            >
              <Plus size={15} />
              <span>Add utility</span>
            </button>
          </div>
        </div>
      </div>

      {/* Contract Expiry Dates */}
      {itemsWithContracts.length > 0 && (
        <div style={{
          padding: '1rem 1.25rem',
          backgroundColor: '#fafaf7',
          border: '1px solid var(--ha-line)',
          borderRadius: 'var(--ha-radius-md)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <Calendar size={16} color="var(--ha-blue)" />
            <h4 style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--ha-ink)' }}>
              Contract term dates
            </h4>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
            {itemsWithContracts.map((item) => (
              <div
                key={item.id}
                style={{
                  backgroundColor: 'var(--ha-white)',
                  padding: '0.45rem 0.75rem',
                  borderRadius: 'var(--ha-radius-sm)',
                  border: '1px solid var(--ha-line)',
                  fontSize: '0.8rem',
                }}
              >
                <span style={{ fontWeight: 600, color: 'var(--ha-ink)' }}>{item.name}: </span>
                <span style={{ color: 'var(--ha-muted)' }}>Contract ends {formatDate(item.contractEndDate)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Utilities Ledger */}
      <CollapsibleSection id="utilities-ledger" title={`Household direct debits (${activeUtilities.length})`}>
        <div>
          {activeUtilities.map((item) => (
            <div key={item.id} className="ha-ledger-row">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                <span className="ha-color-marker" style={{ backgroundColor: item.color || '#3155D9' }} />
                <div>
                  <div style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--ha-ink)' }}>
                    {item.name}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--ha-muted)' }}>
                    {item.paymentMethod || 'SEPA Direct Debit'} • Debits on day {item.renewalDay}
                  </div>
                </div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <div className="tabular-nums" style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--ha-ink)' }}>
                  {formatCurrency(item.amount, item.currency)}
                  <span style={{ fontSize: '0.75rem', color: 'var(--ha-muted)', fontWeight: 400, marginLeft: '2px' }}>
                    {formatBillingCycle(item.billingCycle)}
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <button
                  onClick={() => onEditExpense(item)}
                  className="btn btn-ghost"
                  style={{ padding: '0.35rem 0.45rem' }}
                  title="Edit record"
                >
                  <Edit2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </CollapsibleSection>

      {/* Quick Add Utility Preset Pills */}
      <CollapsibleSection
        id="utilities-presets"
        title="Standard utility presets"
        subtitle="Select common bills to prefill standard rates"
        defaultOpen={false}
        bodyStyle={{ padding: '1.25rem 1.5rem' }}
      >
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
          {[
            { id: 'electricity-gas', name: 'Dual Fuel Power & Gas (€155)' },
            { id: 'broadband-fiber', name: 'Fibre Broadband (€39.99)' },
            { id: 'water-utility', name: 'Water & Sewerage (€32.50)' },
            { id: 'municipal-tax', name: 'Municipal Tax (€185)' },
            { id: 'home-insurance', name: 'Home Insurance (€26)' },
          ].map((preset) => (
            <button
              key={preset.id}
              onClick={() => onOpenAddPreset(preset.id)}
              className="btn btn-secondary"
              style={{ fontSize: '0.8rem' }}
            >
              <span>+ {preset.name}</span>
            </button>
          ))}
        </div>
      </CollapsibleSection>
    </div>
  );
};
