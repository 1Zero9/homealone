import React from 'react';
import type { ExpenseItem, CurrencyCode, SpendingSummary, IncomeSummary } from '../types/expense';
import { CATEGORY_LIST } from '../data/categories';
import { convertCurrency, getMonthlyEquivalent, getDaysUntilRenewal } from '../utils/calculations';
import { formatCurrency, formatRenewalCountdown } from '../utils/formatters';
import { TrendingUp, Clock, PiggyBank, ArrowRight, Edit2 } from 'lucide-react';

interface OverviewDashboardProps {
  expenses: ExpenseItem[];
  summary: SpendingSummary;
  incomeSummary: IncomeSummary;
  currency: CurrencyCode;
  onEditExpense: (item: ExpenseItem) => void;
  onFilterCategory: (category: string) => void;
  onOpenAddIncome: () => void;
}

export const OverviewDashboard: React.FC<OverviewDashboardProps> = ({
  expenses,
  summary,
  incomeSummary,
  currency,
  onEditExpense,
  onFilterCategory,
  onOpenAddIncome,
}) => {
  const activeExpenses = expenses.filter((e) => e.isActive);
  const hasIncome = incomeSummary.monthlyTotal > 0;
  const netAfterBills = incomeSummary.monthlyTotal - summary.monthlyTotal;

  const renewals = activeExpenses.map((item) => {
    const daysLeft = getDaysUntilRenewal(item.nextRenewalDate || `${new Date().getFullYear()}-${new Date().getMonth() + 1}-${item.renewalDay}`);
    return { ...item, daysLeft, urgencyInfo: formatRenewalCountdown(daysLeft) };
  }).sort((a, b) => a.daysLeft - b.daysLeft);

  const dueNext7Days = renewals.filter((item) => item.daysLeft <= 7);
  const totalNext7Days = dueNext7Days.reduce((sum, item) => sum + convertCurrency(item.amount, item.currency, currency), 0);
  const upcomingBills = renewals.slice(0, 5);

  const recentlyAdded = [...activeExpenses]
    .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
    .slice(0, 6);

  const categoryData = CATEGORY_LIST.map((cat) => {
    const catItems = activeExpenses.filter((e) => e.category === cat.id);
    const monthlyAmount = catItems.reduce((sum, item) => {
      const amountInDisplay = convertCurrency(item.amount, item.currency, currency);
      return sum + getMonthlyEquivalent(amountInDisplay, item.billingCycle);
    }, 0);
    return { ...cat, monthlyAmount };
  }).filter((c) => c.monthlyAmount > 0).sort((a, b) => b.monthlyAmount - a.monthlyAmount);

  const totalMonthly = categoryData.reduce((sum, c) => sum + c.monthlyAmount, 0);

  let cumulative = 0;
  const gradientStops = categoryData.map((c) => {
    const pct = totalMonthly > 0 ? (c.monthlyAmount / totalMonthly) * 100 : 0;
    const start = cumulative;
    cumulative += pct;
    return `${c.color} ${start}% ${cumulative}%`;
  });
  const donutGradient = gradientStops.length > 0
    ? `conic-gradient(${gradientStops.join(', ')})`
    : 'var(--ha-line)';

  return (
    <div>
      {/* Stat Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '1rem',
        marginBottom: '1.5rem',
      }}>
        <div className="ha-card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <TrendingUp size={16} color="var(--ha-blue)" />
            <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--ha-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              This month spent
            </span>
          </div>
          <div className="tabular-nums" style={{ fontSize: '1.85rem', fontWeight: 700, color: 'var(--ha-ink)', lineHeight: 1.1 }}>
            {formatCurrency(summary.monthlyTotal, currency)}
            <span style={{ fontSize: '0.85rem', color: 'var(--ha-muted)', fontWeight: 500 }}>/mo</span>
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--ha-muted)', marginTop: '0.35rem' }}>
            {summary.activeCount} active bill{summary.activeCount === 1 ? '' : 's'}
          </div>
        </div>

        <div className="ha-card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <Clock size={16} color="var(--ha-lime)" />
            <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--ha-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Coming up
            </span>
          </div>
          <div className="tabular-nums" style={{ fontSize: '1.85rem', fontWeight: 700, color: 'var(--ha-ink)', lineHeight: 1.1 }}>
            {formatCurrency(totalNext7Days, currency)}
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--ha-muted)', marginTop: '0.35rem' }}>
            {dueNext7Days.length} due in the next 7 days
          </div>
        </div>

        <div className="ha-card" style={{
          padding: '1.25rem',
          backgroundColor: hasIncome ? (netAfterBills >= 0 ? 'var(--ha-lime-tint)' : 'var(--ha-red-tint)') : 'var(--ha-white)',
          border: hasIncome ? `1px solid ${netAfterBills >= 0 ? 'var(--ha-lime)' : 'var(--ha-red)'}` : '1px solid var(--ha-line)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <PiggyBank size={16} color="var(--ha-ink)" />
            <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--ha-ink)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Left after bills
            </span>
          </div>
          {hasIncome ? (
            <div className="tabular-nums" style={{ fontSize: '1.85rem', fontWeight: 700, color: 'var(--ha-ink)', lineHeight: 1.1 }}>
              {netAfterBills >= 0 ? '+' : ''}{formatCurrency(netAfterBills, currency)}
              <span style={{ fontSize: '0.85rem', color: 'var(--ha-muted)', fontWeight: 500 }}>/mo</span>
            </div>
          ) : (
            <button onClick={onOpenAddIncome} className="btn btn-secondary" style={{ fontSize: '0.8rem', marginTop: '0.15rem' }}>
              + Add income to see net
            </button>
          )}
        </div>
      </div>

      {/* 2-Column Layout */}
      <div className="ha-overview-grid">
        {/* Left: Recently added */}
        <div className="ha-card" style={{ overflow: 'hidden' }}>
          <div style={{ padding: '1.1rem 1.4rem', borderBottom: '1px solid var(--ha-line)' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--ha-ink)' }}>
              Recently added
            </h3>
          </div>
          {recentlyAdded.length > 0 ? (
            <div>
              {recentlyAdded.map((item) => (
                <div key={item.id} className="ha-ledger-row">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <span className="ha-color-marker" style={{ backgroundColor: item.color || '#3155D9' }} />
                    <div>
                      <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--ha-ink)' }}>
                        {item.name}
                      </div>
                      <div style={{ fontSize: '0.73rem', color: 'var(--ha-muted)' }}>
                        {item.paymentMethod || 'Direct Debit'} • {item.billingCycle}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div className="tabular-nums" style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--ha-ink)' }}>
                      {formatCurrency(item.amount, item.currency)}
                    </div>
                    <button onClick={() => onEditExpense(item)} className="btn btn-ghost" style={{ padding: '0.3rem 0.4rem' }}>
                      <Edit2 size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ padding: '2rem 1.4rem', textAlign: 'center', color: 'var(--ha-muted)', fontSize: '0.85rem' }}>
              No expenses added yet.
            </div>
          )}
        </div>

        {/* Right: Donut chart + Upcoming bills */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="ha-card" style={{ padding: '1.4rem' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--ha-ink)', marginBottom: '1.1rem' }}>
              Spending this month
            </h3>

            {categoryData.length > 0 ? (
              <>
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.25rem' }}>
                  <div style={{
                    position: 'relative',
                    width: '160px',
                    height: '160px',
                    borderRadius: '50%',
                    background: donutGradient,
                  }}>
                    <div style={{
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      transform: 'translate(-50%, -50%)',
                      width: '104px',
                      height: '104px',
                      borderRadius: '50%',
                      backgroundColor: 'var(--ha-white)',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                      <div className="tabular-nums" style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--ha-ink)', lineHeight: 1.1 }}>
                        {formatCurrency(totalMonthly, currency)}
                      </div>
                      <div style={{ fontSize: '0.68rem', color: 'var(--ha-muted)' }}>/month</div>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
                  {categoryData.slice(0, 5).map((cat) => {
                    const pct = totalMonthly > 0 ? Math.round((cat.monthlyAmount / totalMonthly) * 100) : 0;
                    return (
                      <button
                        key={cat.id}
                        onClick={() => onFilterCategory(cat.id)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          background: 'none',
                          border: 'none',
                          padding: 0,
                          cursor: 'pointer',
                          width: '100%',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span className="ha-color-marker" style={{ backgroundColor: cat.color }} />
                          <span style={{ fontSize: '0.82rem', color: 'var(--ha-ink)', fontWeight: 500 }}>{cat.name}</span>
                        </div>
                        <span className="tabular-nums" style={{ fontSize: '0.8rem', color: 'var(--ha-muted)' }}>{pct}%</span>
                      </button>
                    );
                  })}
                </div>
              </>
            ) : (
              <div style={{ textAlign: 'center', color: 'var(--ha-muted)', fontSize: '0.85rem', padding: '1.5rem 0' }}>
                Add an expense to see your spending breakdown.
              </div>
            )}
          </div>

          <div className="ha-card" style={{ overflow: 'hidden' }}>
            <div style={{ padding: '1.1rem 1.4rem', borderBottom: '1px solid var(--ha-line)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--ha-ink)' }}>
                Upcoming bills
              </h3>
              <ArrowRight size={15} color="var(--ha-muted)" />
            </div>
            {upcomingBills.length > 0 ? (
              <div>
                {upcomingBills.map((item) => (
                  <div key={item.id} className="ha-ledger-row">
                    <div>
                      <div style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--ha-ink)' }}>
                        {item.name}
                      </div>
                      <div style={{ fontSize: '0.73rem', color: 'var(--ha-muted)' }}>
                        {item.urgencyInfo.text}
                      </div>
                    </div>
                    <div className="tabular-nums" style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--ha-ink)' }}>
                      {formatCurrency(item.amount, item.currency)}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ padding: '1.5rem 1.4rem', textAlign: 'center', color: 'var(--ha-muted)', fontSize: '0.85rem' }}>
                Nothing scheduled.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
