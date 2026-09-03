import React from 'react';
import type { IncomeItem, CurrencyCode } from '../types/expense';
import { convertCurrency, getMonthlyEquivalent, getDaysUntilRenewal } from '../utils/calculations';
import { formatCurrency, formatBillingCycle, formatDate } from '../utils/formatters';
import { Edit2, Trash2, Plus, Wallet, User } from 'lucide-react';

const CATEGORY_LABELS: Record<string, string> = {
  salary: 'Salary / wages',
  freelance: 'Freelance / self-employed',
  rental: 'Rental income',
  benefits: 'Benefits / support',
  other: 'Other',
};

interface IncomeSectionProps {
  incomes: IncomeItem[];
  currency: CurrencyCode;
  onToggleActive: (id: string) => void;
  onEditIncome: (income: IncomeItem) => void;
  onDeleteIncome: (id: string) => void;
  onOpenAddModal: () => void;
}

export const IncomeSection: React.FC<IncomeSectionProps> = ({
  incomes,
  currency,
  onToggleActive,
  onEditIncome,
  onDeleteIncome,
  onOpenAddModal,
}) => {
  const monthlyTotal = incomes
    .filter((i) => i.isActive)
    .reduce((sum, i) => sum + getMonthlyEquivalent(convertCurrency(i.amount, i.currency, currency), i.frequency), 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      <div className="ha-card" style={{ padding: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
              <span className="ha-badge ha-badge-lime">
                Money in
              </span>
            </div>
            <h2 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--ha-ink)', lineHeight: 1.1 }}>
              Household income
            </h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--ha-muted)', maxWidth: '600px', marginTop: '0.25rem' }}>
              Salary, freelance, rental and any other regular income.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--ha-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
                Monthly total
              </div>
              <div className="tabular-nums" style={{ fontSize: '1.65rem', fontWeight: 700, color: 'var(--ha-blue)' }}>
                {formatCurrency(monthlyTotal, currency)}
              </div>
            </div>
            <button onClick={onOpenAddModal} className="btn btn-primary" style={{ fontSize: '0.85rem' }}>
              <Plus size={15} />
              <span>Add income</span>
            </button>
          </div>
        </div>
      </div>

      <div className="ha-card" style={{ overflow: 'hidden' }}>
        {incomes.length === 0 ? (
          <div style={{ padding: '3.5rem 2rem', textAlign: 'center', color: 'var(--ha-muted)' }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              backgroundColor: 'var(--ha-blue-light)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1rem',
            }}>
              <Wallet size={24} color="var(--ha-blue)" />
            </div>
            <h4 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--ha-ink)', marginBottom: '0.35rem' }}>
              No income recorded yet
            </h4>
            <p style={{ fontSize: '0.85rem', color: 'var(--ha-muted)', maxWidth: '440px', margin: '0 auto 1.5rem', lineHeight: 1.5 }}>
              Add salary, freelance or rental income to see your full money in vs money out picture.
            </p>
            <button onClick={onOpenAddModal} className="btn btn-primary" style={{ fontSize: '0.85rem' }}>
              <Plus size={15} />
              <span>+ Add first income source</span>
            </button>
          </div>
        ) : (
          <div>
            {incomes.map((item) => {
              const monthlyAmount = getMonthlyEquivalent(convertCurrency(item.amount, item.currency, currency), item.frequency);
              return (
                <div
                  key={item.id}
                  className="ha-ledger-row"
                  style={{ opacity: item.isActive ? 1 : 0.55 }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', flex: '1 1 280px' }}>
                    <span className="ha-color-marker" style={{ backgroundColor: '#8A5CF6' }} />
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--ha-ink)' }}>
                          {item.name}
                        </span>
                        <span className="ha-badge ha-badge-neutral" style={{ fontSize: '0.7rem' }}>
                          {CATEGORY_LABELS[item.category] || item.category}
                        </span>
                        {item.createdBy && (
                          <span className="ha-badge ha-badge-blue" style={{ fontSize: '0.68rem', display: 'flex', alignItems: 'center', gap: '2px' }}>
                            <User size={10} />
                            <span>{item.createdBy.name.split(' ')[0]}</span>
                          </span>
                        )}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '2px' }}>
                        {item.nextPayDate && (
                          <span style={{ fontSize: '0.75rem', color: 'var(--ha-muted)' }}>
                            Next pay {formatDate(item.nextPayDate)}
                            {(() => {
                              const days = getDaysUntilRenewal(item.nextPayDate!, item.frequency);
                              if (days === 0) return ' — today';
                              if (days === 1) return ' — tomorrow';
                              if (days > 0) return ` — in ${days} days`;
                              return '';
                            })()}
                          </span>
                        )}
                        {item.notes && (
                          <span style={{ fontSize: '0.75rem', color: 'var(--ha-muted)' }}>
                            {item.nextPayDate ? '• ' : ''}{item.notes}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="ha-ledger-amount" style={{ textAlign: 'right', minWidth: '130px' }}>
                    <div className="tabular-nums" style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--ha-ink)' }}>
                      {formatCurrency(item.amount, item.currency)}
                      <span style={{ fontSize: '0.75rem', color: 'var(--ha-muted)', fontWeight: 400, marginLeft: '2px' }}>
                        {formatBillingCycle(item.frequency)}
                      </span>
                    </div>
                    {item.frequency !== 'monthly' && (
                      <div className="tabular-nums" style={{ fontSize: '0.72rem', color: 'var(--ha-muted)' }}>
                        ≈ {formatCurrency(monthlyAmount, currency)}/mo
                      </div>
                    )}
                  </div>

                  <div className="ha-ledger-actions" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginLeft: '1rem' }}>
                    <label className="toggle-switch" title={item.isActive ? 'Active — click to pause' : 'Paused — click to activate'}>
                      <input
                        type="checkbox"
                        checked={item.isActive}
                        onChange={() => onToggleActive(item.id)}
                      />
                      <span className="slider"></span>
                    </label>

                    <button
                      onClick={() => onEditIncome(item)}
                      className="btn btn-ghost"
                      style={{ padding: '0.35rem 0.45rem' }}
                      title="Edit record"
                    >
                      <Edit2 size={14} />
                    </button>

                    <button
                      onClick={() => onDeleteIncome(item.id)}
                      className="btn btn-ghost"
                      style={{ padding: '0.35rem 0.45rem', color: 'var(--ha-red)' }}
                      title="Delete record"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
