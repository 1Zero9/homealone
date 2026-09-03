import React from 'react';
import type { ExpenseItem, CurrencyCode } from '../types/expense';
import { CATEGORIES } from '../data/categories';
import { getDaysUntilRenewal } from '../utils/calculations';
import { formatCurrency, formatBillingCycle, formatDate } from '../utils/formatters';
import { Plus, Edit2, CheckCircle2, Clock, AlertTriangle } from 'lucide-react';

interface PlannedExpensesSectionProps {
  expenses: ExpenseItem[];
  currency: CurrencyCode;
  onEditExpense: (expense: ExpenseItem) => void;
  onOpenAddModal: () => void;
  onActivate: (id: string) => void;
}

export const PlannedExpensesSection: React.FC<PlannedExpensesSectionProps> = ({
  expenses,
  currency,
  onEditExpense,
  onOpenAddModal,
  onActivate,
}) => {
  const plannedItems = expenses.filter((e) => e.isPending);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* Header Banner */}
      <div className="ha-card" style={{ padding: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
              <span className="ha-badge" style={{ backgroundColor: '#fdf2e3', color: '#B45309' }}>
                Stand-alone list
              </span>
            </div>
            <h2 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--ha-ink)', lineHeight: 1.1 }}>
              Planned expenses
            </h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--ha-muted)', maxWidth: '600px', marginTop: '0.25rem' }}>
              Costs you know are coming but aren&apos;t required yet — like college fees. These sit here on their own and don&apos;t count towards totals, bills or insights until you activate them.
            </p>
          </div>

          <button onClick={onOpenAddModal} className="btn btn-primary">
            <Plus size={15} />
            <span>Add planned expense</span>
          </button>
        </div>
      </div>

      {/* Planned Ledger */}
      <div className="ha-card" style={{ overflow: 'hidden' }}>
        <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--ha-line)' }}>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--ha-ink)' }}>
            Planned ({plannedItems.length})
          </h3>
        </div>

        {plannedItems.length === 0 ? (
          <div style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--ha-muted)' }}>
            <Clock size={28} color="var(--ha-muted)" style={{ marginBottom: '0.5rem' }} />
            <p style={{ fontSize: '0.9rem' }}>Nothing planned yet — add a future cost to track it here without affecting your figures.</p>
          </div>
        ) : (
          <div>
            {plannedItems.map((item) => {
              const catInfo = CATEGORIES[item.category];
              const daysLeft = item.nextRenewalDate
                ? getDaysUntilRenewal(item.nextRenewalDate, item.billingCycle)
                : null;
              const dueSoon = daysLeft !== null && daysLeft <= 30;
              const goal = item.linkedGoal;
              const goalPct = goal && goal.targetAmount > 0
                ? Math.min(100, Math.round((goal.currentAmount / goal.targetAmount) * 100))
                : null;

              return (
                <div key={item.id} style={{ borderBottom: '1px solid var(--ha-line)', padding: '1rem 1.5rem' }}>
                  <div className="ha-ledger-row" style={{ borderBottom: 'none', padding: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                      <span className="ha-color-marker" style={{ backgroundColor: item.color || catInfo?.color || '#B45309' }} />
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                          <span style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--ha-ink)' }}>
                            {item.name}
                          </span>
                          {dueSoon && (
                            <span
                              className="ha-badge"
                              style={{ backgroundColor: '#fdf2e3', color: '#B45309', fontSize: '0.68rem', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}
                            >
                              <AlertTriangle size={11} />
                              {daysLeft! < 0 ? 'Overdue — consider activating' : daysLeft === 0 ? 'Due today — consider activating' : `Due in ${daysLeft} day${daysLeft === 1 ? '' : 's'} — consider activating`}
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--ha-muted)' }}>
                          {catInfo?.name || item.category}
                          {item.nextRenewalDate && <> • Expected {formatDate(item.nextRenewalDate)}</>}
                        </div>
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <div className="tabular-nums" style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--ha-ink)' }}>
                        {formatCurrency(item.amount, item.currency || currency)}
                        <span style={{ fontSize: '0.75rem', color: 'var(--ha-muted)', fontWeight: 400, marginLeft: '2px' }}>
                          {formatBillingCycle(item.billingCycle)}
                        </span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <button
                        onClick={() => {
                          if (window.confirm(`Activate "${item.name}"? It will start counting towards your totals, bills and insights.`)) {
                            onActivate(item.id);
                          }
                        }}
                        className="btn btn-secondary"
                        style={{ fontSize: '0.78rem', padding: '0.35rem 0.6rem' }}
                        title="Activate — start counting this towards your figures"
                      >
                        <CheckCircle2 size={14} />
                        <span>Activate</span>
                      </button>
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

                  {goal && goalPct !== null && (
                    <div style={{ marginTop: '0.75rem', paddingLeft: '1.7rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
                        <span style={{ fontSize: '0.75rem', color: 'var(--ha-muted)' }}>
                          Saving towards <strong style={{ color: 'var(--ha-ink)' }}>{goal.name}</strong> — {formatCurrency(goal.currentAmount, goal.currency || currency)} of {formatCurrency(goal.targetAmount, goal.currency || currency)}
                        </span>
                        <span className="tabular-nums" style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--ha-ink)' }}>
                          {goalPct}%
                        </span>
                      </div>
                      <div style={{ height: '6px', borderRadius: '999px', backgroundColor: 'var(--ha-line)', overflow: 'hidden' }}>
                        <div style={{
                          height: '100%',
                          width: `${goalPct}%`,
                          borderRadius: '999px',
                          backgroundColor: goalPct >= 100 ? 'var(--ha-lime)' : 'var(--ha-blue)',
                          transition: 'width 0.3s ease',
                        }} />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
