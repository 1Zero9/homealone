import React from 'react';
import type { ExpenseItem, CurrencyCode } from '../types/expense';
import { convertCurrency, getMonthlyEquivalent } from '../utils/calculations';
import { formatCurrency, formatBillingCycle } from '../utils/formatters';
import { Plus, Edit2, ShieldCheck } from 'lucide-react';
import { CollapsibleSection } from './CollapsibleSection';

interface InsuranceSectionProps {
  expenses: ExpenseItem[];
  currency: CurrencyCode;
  onEditExpense: (expense: ExpenseItem) => void;
  onOpenAddModal: () => void;
  onOpenAddPreset: (presetId: string) => void;
}

export const InsuranceSection: React.FC<InsuranceSectionProps> = ({
  expenses,
  currency,
  onEditExpense,
  onOpenAddModal,
  onOpenAddPreset,
}) => {
  const insuranceItems = expenses.filter((e) => e.category === 'insurance');
  const activeItems = insuranceItems.filter((e) => e.isActive);
  const pausedItems = insuranceItems.filter((e) => !e.isActive);

  const monthlyTotal = activeItems.reduce((sum, item) => {
    const amountInDisplay = convertCurrency(item.amount, item.currency, currency);
    return sum + getMonthlyEquivalent(amountInDisplay, item.billingCycle);
  }, 0);

  const annualTotal = monthlyTotal * 12;
  const linkedToAccount = activeItems.filter((e) => e.paymentAccount);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* Header Banner */}
      <div className="ha-card" style={{ padding: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
              <span className="ha-badge" style={{ backgroundColor: '#e7f5f8', color: '#0E7490' }}>
                Category review
              </span>
            </div>
            <h2 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--ha-ink)', lineHeight: 1.1 }}>
              Insurance, motor tax & NCT
            </h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--ha-muted)', maxWidth: '600px', marginTop: '0.25rem' }}>
              Car, life & health insurance, motor tax and NCT renewals kept separate here for clarity. They still count toward your total money out and keep their linked accounts — this is just for tidiness.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--ha-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
                Monthly equivalent
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
              <span>Add insurance item</span>
            </button>
          </div>
        </div>
      </div>

      {/* Active Ledger */}
      <CollapsibleSection id="insurance-active" title={`Active policies & renewals (${activeItems.length})`}>
        {activeItems.length === 0 ? (
          <div style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--ha-muted)' }}>
            <ShieldCheck size={28} color="var(--ha-muted)" style={{ marginBottom: '0.5rem' }} />
            <p style={{ fontSize: '0.9rem' }}>No insurance, motor tax or NCT items recorded yet.</p>
          </div>
        ) : (
          <div>
            {activeItems.map((item) => (
              <div key={item.id} className="ha-ledger-row">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                  <span className="ha-color-marker" style={{ backgroundColor: item.color || '#0E7490' }} />
                  <div>
                    <div style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--ha-ink)' }}>
                      {item.name}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--ha-muted)' }}>
                      {item.paymentMethod || 'Direct Debit'} • Due day {item.renewalDay}
                      {item.paymentAccount && (
                        <> • Linked to {item.paymentAccount.name}</>
                      )}
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
        )}
      </CollapsibleSection>

      {/* Paused Items */}
      {pausedItems.length > 0 && (
        <CollapsibleSection id="insurance-paused" title={`Paused / lapsed (${pausedItems.length})`} defaultOpen={false}>
          <div>
            {pausedItems.map((item) => (
              <div key={item.id} className="ha-ledger-row" style={{ opacity: 0.6 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                  <span className="ha-color-marker" style={{ backgroundColor: 'var(--ha-muted)' }} />
                  <div>
                    <div style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--ha-ink)' }}>
                      {item.name}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--ha-muted)' }}>
                      Paused • was {formatCurrency(item.amount, item.currency)}/{formatBillingCycle(item.billingCycle).replace('/', '')}
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => onEditExpense(item)}
                  className="btn btn-ghost"
                  style={{ padding: '0.35rem 0.45rem' }}
                  title="Edit record"
                >
                  <Edit2 size={14} />
                </button>
              </div>
            ))}
          </div>
        </CollapsibleSection>
      )}

      {linkedToAccount.length > 0 && (
        <p style={{ fontSize: '0.75rem', color: 'var(--ha-muted)', textAlign: 'center' }}>
          {linkedToAccount.length} of {activeItems.length} item{activeItems.length === 1 ? '' : 's'} here {linkedToAccount.length === 1 ? 'is' : 'are'} linked to an account in Accounts — payment history and renewal date live there.
        </p>
      )}

      {/* Quick Add Presets */}
      <CollapsibleSection id="insurance-presets" title="Common insurance & motor presets" subtitle="Add standard policies and renewals with prefilled figures" defaultOpen={false} bodyStyle={{ padding: '1.25rem 1.5rem' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
          {[
            { id: 'car-insurance', name: 'Car Insurance' },
            { id: 'motor-tax', name: 'Motor Tax' },
            { id: 'nct-test', name: 'NCT Test Fee' },
            { id: 'life-insurance', name: 'Life Insurance' },
            { id: 'health-insurance', name: 'Health Insurance' },
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
