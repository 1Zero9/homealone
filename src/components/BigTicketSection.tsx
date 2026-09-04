import React from 'react';
import type { ExpenseItem, CurrencyCode } from '../types/expense';
import { convertCurrency, getMonthlyEquivalent } from '../utils/calculations';
import { formatCurrency, formatBillingCycle } from '../utils/formatters';
import { Plus, Edit2, Landmark } from 'lucide-react';
import { CollapsibleSection } from './CollapsibleSection';

interface BigTicketSectionProps {
  expenses: ExpenseItem[];
  currency: CurrencyCode;
  onEditExpense: (expense: ExpenseItem) => void;
  onOpenAddModal: () => void;
  onOpenAddPreset: (presetId: string) => void;
}

export const BigTicketSection: React.FC<BigTicketSectionProps> = ({
  expenses,
  currency,
  onEditExpense,
  onOpenAddModal,
  onOpenAddPreset,
}) => {
  const bigTicketItems = expenses.filter((e) => e.category === 'big-ticket');
  const activeItems = bigTicketItems.filter((e) => e.isActive);
  const pausedItems = bigTicketItems.filter((e) => !e.isActive);

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
              <span className="ha-badge" style={{ backgroundColor: '#fdf2e3', color: '#B45309' }}>
                Category review
              </span>
            </div>
            <h2 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--ha-ink)', lineHeight: 1.1 }}>
              Mortgage, loans & big purchases
            </h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--ha-muted)', maxWidth: '600px', marginTop: '0.25rem' }}>
              Mortgage and loan repayments, holidays and other big-ticket items kept separate here for clarity. They still count toward your total money out and keep their linked accounts — this is just for tidiness.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--ha-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
                Monthly repayments
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
              <span>Add big item</span>
            </button>
          </div>
        </div>
      </div>

      {/* Active Ledger */}
      <CollapsibleSection id="bigticket-active" title={`Active repayments & commitments (${activeItems.length})`}>
        {activeItems.length === 0 ? (
          <div style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--ha-muted)' }}>
            <Landmark size={28} color="var(--ha-muted)" style={{ marginBottom: '0.5rem' }} />
            <p style={{ fontSize: '0.9rem' }}>No mortgage, loans or big purchases recorded yet.</p>
          </div>
        ) : (
          <div>
            {activeItems.map((item) => (
              <div key={item.id} className="ha-ledger-row">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                  <span className="ha-color-marker" style={{ backgroundColor: item.color || '#B45309' }} />
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
        <CollapsibleSection id="bigticket-paused" title={`Paused / paid off (${pausedItems.length})`} defaultOpen={false}>
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
          {linkedToAccount.length} of {activeItems.length} item{activeItems.length === 1 ? '' : 's'} here {linkedToAccount.length === 1 ? 'is' : 'are'} linked to an account in Accounts — repayment history, interest rate and payoff date live there.
        </p>
      )}

      {/* Quick Add Presets */}
      <CollapsibleSection id="bigticket-presets" title="Common big-ticket presets" subtitle="Add standard repayments with prefilled figures" defaultOpen={false} bodyStyle={{ padding: '1.25rem 1.5rem' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
          {[
            { id: 'mortgage-repayment', name: 'Mortgage Repayment' },
            { id: 'car-loan-repayment', name: 'Car Loan Repayment' },
            { id: 'personal-loan-repayment', name: 'Personal Loan Repayment' },
            { id: 'holiday-fund', name: 'Holiday & Travel Fund' },
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
