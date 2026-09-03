import React, { useState } from 'react';
import type { ExpenseItem, CurrencyCode } from '../types/expense';
import { CATEGORIES, CATEGORY_LIST } from '../data/categories';
import { convertCurrency, getMonthlyEquivalent } from '../utils/calculations';
import { formatCurrency, formatBillingCycle } from '../utils/formatters';
import { Search, ArrowUpDown, Edit2, Trash2, Copy, User, Plus, Sparkles, RefreshCw, Mail } from 'lucide-react';

function isOverdue(dateStr: string): boolean {
  if (!dateStr) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const [year, month, day] = dateStr.split('-').map(Number);
  const due = new Date(year, (month || 1) - 1, day || 1);
  due.setHours(0, 0, 0, 0);
  return due < today;
}

function daysUntilDate(dateStr: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const [year, month, day] = dateStr.split('-').map(Number);
  const due = new Date(year, (month || 1) - 1, day || 1);
  due.setHours(0, 0, 0, 0);
  return Math.round((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

interface ExpenseListProps {
  expenses: ExpenseItem[];
  currency: CurrencyCode;
  selectedCategory: string | null;
  onSelectCategory: (cat: string | null) => void;
  onToggleActive: (id: string) => void;
  onTogglePaid: (id: string) => void;
  onEditExpense: (expense: ExpenseItem) => void;
  onDuplicateExpense: (expense: ExpenseItem) => void;
  onDeleteExpense: (id: string) => void;
  onOpenAddModal: () => void;
  onOpenPresetsModal: () => void;
  onQuickUpdateAmount: (expense: ExpenseItem, newAmount: number) => void;
  onContactVendor: (expense: ExpenseItem) => void;
}

export const ExpenseList: React.FC<ExpenseListProps> = ({
  expenses,
  currency,
  selectedCategory,
  onSelectCategory,
  onToggleActive,
  onTogglePaid,
  onEditExpense,
  onDuplicateExpense,
  onDeleteExpense,
  onOpenAddModal,
  onOpenPresetsModal,
  onQuickUpdateAmount,
  onContactVendor,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'paused'>('all');
  const [sortBy, setSortBy] = useState<'amount-desc' | 'amount-asc' | 'renewal' | 'name'>('amount-desc');

  // Filter items
  const filteredItems = expenses.filter((item) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = item.name.toLowerCase().includes(q);
      const matchNotes = item.notes?.toLowerCase().includes(q);
      const matchMethod = item.paymentMethod.toLowerCase().includes(q);
      const matchCategory = CATEGORIES[item.category]?.name.toLowerCase().includes(q);
      const matchUser = item.createdBy?.name.toLowerCase().includes(q);
      if (!matchName && !matchNotes && !matchMethod && !matchCategory && !matchUser) {
        return false;
      }
    }

    if (selectedCategory && item.category !== selectedCategory) {
      return false;
    }

    if (statusFilter === 'active' && !item.isActive) return false;
    if (statusFilter === 'paused' && item.isActive) return false;

    return true;
  });

  // Sort items
  const sortedItems = [...filteredItems].sort((a, b) => {
    const amountA = getMonthlyEquivalent(convertCurrency(a.amount, a.currency, currency), a.billingCycle);
    const amountB = getMonthlyEquivalent(convertCurrency(b.amount, b.currency, currency), b.billingCycle);

    if (sortBy === 'amount-desc') return amountB - amountA;
    if (sortBy === 'amount-asc') return amountA - amountB;
    if (sortBy === 'renewal') return a.renewalDay - b.renewalDay;
    if (sortBy === 'name') return a.name.localeCompare(b.name);
    return 0;
  });

  return (
    <div className="ha-card" style={{ marginBottom: '2.5rem', overflow: 'hidden' }}>
      {/* Controls Bar */}
      <div style={{
        padding: '1.25rem 1.5rem',
        borderBottom: '1px solid var(--ha-line)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem',
      }}>
        <div>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--ha-ink)' }}>
            Household ledger
          </h3>
          {(() => {
            const overdueCount = expenses.filter((e) => e.isActive && !e.isPaidThisCycle && isOverdue(e.nextRenewalDate)).length;
            return overdueCount > 0 ? (
              <p style={{ fontSize: '0.8rem', color: 'var(--ha-red)', fontWeight: 600 }}>
                {overdueCount} bill{overdueCount === 1 ? '' : 's'} overdue
              </p>
            ) : null;
          })()}
          <p style={{ fontSize: '0.8rem', color: 'var(--ha-muted)' }}>
            {sortedItems.length} of {expenses.length} records shown
          </p>
        </div>

        {/* Search & Sort Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          {/* Search Input */}
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <Search size={15} color="var(--ha-muted)" style={{ position: 'absolute', left: '0.75rem', pointerEvents: 'none' }} />
            <input
              type="text"
              placeholder="Filter expenses, college, sports..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="ha-input"
              style={{
                paddingLeft: '2.2rem',
                paddingRight: searchQuery ? '2rem' : '0.85rem',
                width: '230px',
                fontSize: '0.85rem',
              }}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                style={{
                  position: 'absolute',
                  right: '0.6rem',
                  background: 'none',
                  border: 'none',
                  color: 'var(--ha-muted)',
                  cursor: 'pointer',
                  fontSize: '0.8rem',
                }}
              >
                ✕
              </button>
            )}
          </div>

          {/* Sort Dropdown */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <ArrowUpDown size={14} color="var(--ha-muted)" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'amount-desc' | 'amount-asc' | 'renewal' | 'name')}
              style={{
                backgroundColor: '#fafaf7',
                color: 'var(--ha-ink)',
                border: '1px solid var(--ha-line)',
                borderRadius: 'var(--ha-radius-md)',
                padding: '0.55rem 0.75rem',
                fontSize: '0.85rem',
                outline: 'none',
                cursor: 'pointer',
              }}
            >
              <option value="amount-desc">Highest amount</option>
              <option value="amount-asc">Lowest amount</option>
              <option value="renewal">Renewal day (1–31)</option>
              <option value="name">Name (A–Z)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Filter Tabs / Segmented Controls */}
      <div style={{
        padding: '0.75rem 1.5rem',
        backgroundColor: '#fafaf7',
        borderBottom: '1px solid var(--ha-line)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '0.75rem',
      }}>
        {/* Category filters */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', flexWrap: 'wrap' }}>
          <button
            onClick={() => onSelectCategory(null)}
            style={{
              padding: '0.3rem 0.65rem',
              borderRadius: 'var(--ha-radius-sm)',
              border: '1px solid',
              borderColor: selectedCategory === null ? 'var(--ha-blue)' : 'var(--ha-line)',
              backgroundColor: selectedCategory === null ? 'var(--ha-blue-light)' : 'var(--ha-white)',
              color: selectedCategory === null ? 'var(--ha-blue)' : 'var(--ha-muted)',
              fontSize: '0.78rem',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            All
          </button>

          {CATEGORY_LIST.map((cat) => {
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => onSelectCategory(isSelected ? null : cat.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  padding: '0.3rem 0.65rem',
                  borderRadius: 'var(--ha-radius-sm)',
                  border: '1px solid',
                  borderColor: isSelected ? 'var(--ha-blue)' : 'var(--ha-line)',
                  backgroundColor: isSelected ? 'var(--ha-blue-light)' : 'var(--ha-white)',
                  color: isSelected ? 'var(--ha-blue)' : 'var(--ha-muted)',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                <span className="ha-color-marker" style={{ backgroundColor: cat.color }} />
                <span>{cat.name}</span>
              </button>
            );
          })}
        </div>

        {/* Status filters */}
        <div style={{ display: 'flex', gap: '0.25rem' }}>
          {(['all', 'active', 'paused'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              style={{
                padding: '0.25rem 0.55rem',
                borderRadius: 'var(--ha-radius-sm)',
                border: '1px solid var(--ha-line)',
                fontSize: '0.75rem',
                fontWeight: 600,
                textTransform: 'capitalize',
                backgroundColor: statusFilter === st ? 'var(--ha-ink)' : 'var(--ha-white)',
                color: statusFilter === st ? 'var(--ha-white)' : 'var(--ha-muted)',
                cursor: 'pointer',
              }}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Ledger Table Rows */}
      {expenses.length === 0 ? (
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
            <Sparkles size={24} color="var(--ha-blue)" />
          </div>

          <h4 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--ha-ink)', marginBottom: '0.35rem' }}>
            Your household ledger is clean and ready
          </h4>
          <p style={{ fontSize: '0.85rem', color: 'var(--ha-muted)', maxWidth: '480px', margin: '0 auto 1.5rem', lineHeight: 1.5 }}>
            No test data is present. Start adding your real home utility bills, subscriptions, college fees, and sports memberships.
          </p>

          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              onClick={onOpenAddModal}
              className="btn btn-primary"
              style={{ fontSize: '0.85rem' }}
            >
              <Plus size={15} />
              <span>+ Add first expense</span>
            </button>

            <button
              onClick={onOpenPresetsModal}
              className="btn btn-secondary"
              style={{ fontSize: '0.85rem' }}
            >
              <Sparkles size={15} color="var(--ha-blue)" />
              <span>Browse 1-Click Catalog</span>
            </button>
          </div>
        </div>
      ) : sortedItems.length === 0 ? (
        <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--ha-muted)' }}>
          <p style={{ fontSize: '0.95rem', marginBottom: '1rem' }}>
            No records matched current search filters.
          </p>
          <button
            onClick={() => { setSearchQuery(''); onSelectCategory(null); setStatusFilter('all'); }}
            className="btn btn-secondary"
            style={{ fontSize: '0.8rem' }}
          >
            Clear filters
          </button>
        </div>
      ) : (
        <div>
          {sortedItems.map((item) => {
            const cat = CATEGORIES[item.category] || CATEGORIES.utilities;
            const monthlyAmount = getMonthlyEquivalent(convertCurrency(item.amount, item.currency, currency), item.billingCycle);
            const overdue = item.isActive && !item.isPaidThisCycle && isOverdue(item.nextRenewalDate);
            const daysUntilContractEnd = item.contractEndDate ? daysUntilDate(item.contractEndDate) : null;
            const showContractBadge = item.isActive && daysUntilContractEnd !== null && daysUntilContractEnd <= 60;

            return (
              <div
                key={item.id}
                className="ha-ledger-row"
                style={{
                  opacity: item.isActive ? 1 : 0.55,
                }}
              >
                {/* 1. Category Square Color Marker & Name */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', flex: '1 1 280px' }}>
                  <span
                    className="ha-color-marker"
                    style={{ backgroundColor: item.color || cat.color }}
                    title={cat.name}
                  />

                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--ha-ink)' }}>
                        {item.name}
                      </span>
                      {item.vendor && item.vendor !== item.name && (
                        <span style={{ fontSize: '0.75rem', color: 'var(--ha-muted)' }}>
                          ({item.vendor})
                        </span>
                      )}
                      <span className="ha-badge ha-badge-neutral" style={{ fontSize: '0.7rem' }}>
                        {cat.name}
                      </span>
                      {item.createdBy && (
                        <span className="ha-badge ha-badge-blue" style={{ fontSize: '0.68rem', display: 'flex', alignItems: 'center', gap: '2px' }}>
                          <User size={10} />
                          <span>{item.createdBy.name.split(' ')[0]}</span>
                        </span>
                      )}
                      {showContractBadge && (
                        <span
                          className={`ha-badge ${daysUntilContractEnd! <= 14 ? 'ha-badge-red' : 'ha-badge-lime'}`}
                          style={{ fontSize: '0.68rem' }}
                          title="Contract end date — call to review, renegotiate or cancel before it auto-renews"
                        >
                          {daysUntilContractEnd! < 0
                            ? 'Contract ended — review'
                            : daysUntilContractEnd === 0
                            ? 'Contract ends today'
                            : `Contract ends in ${daysUntilContractEnd} days`}
                        </span>
                      )}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', fontSize: '0.75rem', color: overdue ? 'var(--ha-red)' : 'var(--ha-muted)', marginTop: '2px' }}>
                      <span>{item.paymentMethod || 'Direct Debit'}</span>
                      <span>•</span>
                      <span style={{ fontWeight: overdue ? 700 : 400 }}>
                        {overdue ? 'Overdue — due ' : 'Due '}{item.nextRenewalDate}
                      </span>
                      {item.notes && (
                        <>
                          <span>•</span>
                          <span style={{ color: 'var(--ha-muted)', maxWidth: '240px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {item.notes}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* 2. Tabular Amount */}
                <div className="ha-ledger-amount" style={{ textAlign: 'right', minWidth: '130px' }}>
                  <div className="tabular-nums" style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--ha-ink)' }}>
                    {formatCurrency(item.amount, item.currency)}
                    <span style={{ fontSize: '0.75rem', color: 'var(--ha-muted)', fontWeight: 400, marginLeft: '2px' }}>
                      {formatBillingCycle(item.billingCycle)}
                    </span>
                  </div>
                  {item.billingCycle !== 'monthly' && item.billingCycle !== 'once' && (
                    <div className="tabular-nums" style={{ fontSize: '0.72rem', color: 'var(--ha-muted)' }}>
                      ≈ {formatCurrency(monthlyAmount, currency)}/mo
                    </div>
                  )}
                </div>

                {/* 3. Paid/Active Status Toggles & Inline Actions */}
                <div className="ha-ledger-actions" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginLeft: '1rem' }}>
                  <span
                    className={`ha-badge ${item.isPaidThisCycle ? 'ha-badge-neutral' : overdue ? 'ha-badge-red' : 'ha-badge-blue'}`}
                    style={{ fontSize: '0.68rem', cursor: 'pointer' }}
                    onClick={() => onTogglePaid(item.id)}
                    title={item.isPaidThisCycle ? 'Paid — click to mark unpaid' : 'Unpaid — click to mark paid'}
                  >
                    {item.isPaidThisCycle ? 'Paid' : 'Unpaid'}
                  </span>

                  <label className="toggle-switch" title={item.isActive ? 'Active — click to pause' : 'Paused — click to activate'}>
                    <input
                      type="checkbox"
                      checked={item.isActive}
                      onChange={() => onToggleActive(item.id)}
                    />
                    <span className="slider"></span>
                  </label>

                  {item.isVariable && (
                    <button
                      onClick={() => {
                        const input = window.prompt(`New amount for "${item.name}" this cycle:`, String(item.amount));
                        if (input === null) return;
                        const parsed = Number(input);
                        if (!Number.isFinite(parsed) || parsed < 0) return;
                        onQuickUpdateAmount(item, parsed);
                      }}
                      className="btn btn-ghost"
                      style={{ padding: '0.35rem 0.45rem' }}
                      title="This bill varies — quickly update just the amount"
                    >
                      <RefreshCw size={14} color="var(--ha-blue)" />
                    </button>
                  )}

                  {item.vendorEmail && (
                    <button
                      onClick={() => onContactVendor(item)}
                      className="btn btn-ghost"
                      style={{ padding: '0.35rem 0.45rem' }}
                      title="Draft an email to the vendor about this contract"
                    >
                      <Mail size={14} color="var(--ha-blue)" />
                    </button>
                  )}

                  <button
                    onClick={() => onEditExpense(item)}
                    className="btn btn-ghost"
                    style={{ padding: '0.35rem 0.45rem' }}
                    title="Edit record"
                  >
                    <Edit2 size={14} />
                  </button>

                  <button
                    onClick={() => onDuplicateExpense(item)}
                    className="btn btn-ghost"
                    style={{ padding: '0.35rem 0.45rem' }}
                    title="Duplicate record"
                  >
                    <Copy size={14} />
                  </button>

                  <button
                    onClick={() => onDeleteExpense(item.id)}
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
  );
};
