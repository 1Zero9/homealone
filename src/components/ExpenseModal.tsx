import React, { useState, useEffect } from 'react';
import type { ExpenseItem, ExpenseCategory, BillingCycle, CurrencyCode, UserProfile, AccountItem } from '../types/expense';
import { CATEGORY_LIST, CATEGORIES } from '../data/categories';
import { PRESETS } from '../data/presets';
import { CURRENCIES } from '../utils/currencies';
import { X } from 'lucide-react';

const PAYMENT_METHODS = [
  'SEPA Direct Debit',
  'Standing Order',
  'Debit Card',
  'Credit Card',
  'Bank Transfer',
  'Cash',
  'PayPal',
  'Cheque',
  'Other',
];

interface ExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (expense: Omit<ExpenseItem, 'id' | 'createdAt' | 'updatedAt'>, existingId?: string) => void;
  editingExpense?: ExpenseItem | null;
  initialPresetId?: string | null;
  initialCategory?: string | null;
  users?: UserProfile[];
  currentUserId?: string;
  accounts?: AccountItem[];
}

export const ExpenseModal: React.FC<ExpenseModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingExpense,
  initialPresetId,
  initialCategory,
  users = [],
  currentUserId,
  accounts = [],
}) => {
  const [name, setName] = useState('');
  const [amount, setAmount] = useState<number | string>('');
  const [currency, setCurrency] = useState<CurrencyCode>('EUR');
  const [billingCycle, setBillingCycle] = useState<BillingCycle>('monthly');
  const [category, setCategory] = useState<ExpenseCategory>('utilities');
  const [nextRenewalDate, setNextRenewalDate] = useState('');
  const [isPaidThisCycle, setIsPaidThisCycle] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('SEPA Direct Debit');
  const [assignedUserId, setAssignedUserId] = useState<string>('');
  const [notes, setNotes] = useState('');
  const [contractEndDate, setContractEndDate] = useState('');
  const [vendorEmail, setVendorEmail] = useState('');
  const [usageRating, setUsageRating] = useState<'high' | 'medium' | 'low'>('high');
  const [isVariable, setIsVariable] = useState(false);
  const [paymentAccountId, setPaymentAccountId] = useState<string>('');

  useEffect(() => {
    if (editingExpense) {
      setName(editingExpense.name);
      setAmount(editingExpense.amount);
      setCurrency(editingExpense.currency || 'EUR');
      setBillingCycle(editingExpense.billingCycle);
      setCategory(editingExpense.category);
      setNextRenewalDate(editingExpense.nextRenewalDate || '');
      setIsPaidThisCycle(!!editingExpense.isPaidThisCycle);
      setPaymentMethod(editingExpense.paymentMethod || 'SEPA Direct Debit');
      setAssignedUserId(editingExpense.createdById || currentUserId || '');
      setNotes(editingExpense.notes || '');
      setContractEndDate(editingExpense.contractEndDate || '');
      setVendorEmail(editingExpense.vendorEmail || '');
      setUsageRating(editingExpense.usageRating || 'high');
      setIsVariable(!!editingExpense.isVariable);
      setPaymentAccountId(editingExpense.paymentAccountId || '');
    } else if (initialPresetId) {
      const preset = PRESETS.find((p) => p.id === initialPresetId);
      if (preset) {
        setName(preset.name);
        setAmount(preset.defaultAmount);
        setCurrency('EUR');
        setBillingCycle(preset.defaultCycle);
        setCategory(preset.category);
        setNextRenewalDate(new Date().toISOString().split('T')[0]);
        setIsPaidThisCycle(false);
        setPaymentMethod(preset.defaultPaymentMethod);
        setAssignedUserId(currentUserId || '');
        setNotes(preset.description || '');
        setIsVariable(preset.category === 'shopping');
        setPaymentAccountId('');
      }
    } else {
      setName('');
      setAmount('');
      setCurrency('EUR');
      setBillingCycle('monthly');
      setCategory((initialCategory as ExpenseCategory) || 'utilities');
      setNextRenewalDate(new Date().toISOString().split('T')[0]);
      setIsPaidThisCycle(false);
      setPaymentMethod('SEPA Direct Debit');
      setAssignedUserId(currentUserId || '');
      setNotes('');
      setContractEndDate('');
      setVendorEmail('');
      setUsageRating('high');
      setIsVariable((initialCategory as ExpenseCategory) === 'shopping');
      setPaymentAccountId('');
    }
  }, [editingExpense, initialPresetId, initialCategory, currentUserId, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    const numAmount = Number(amount) || 0;

    const resolvedNextRenewalDate = nextRenewalDate || new Date().toISOString().split('T')[0];
    const resolvedRenewalDay = Number(resolvedNextRenewalDate.split('-')[2]) || 1;

    const catInfo = CATEGORIES[category];

    onSave(
      {
        name: name.trim(),
        amount: numAmount,
        currency,
        billingCycle,
        category,
        icon: catInfo?.icon || 'Zap',
        color: catInfo?.color || '#3155D9',
        renewalDay: resolvedRenewalDay,
        nextRenewalDate: resolvedNextRenewalDate,
        isPaidThisCycle,
        paymentMethod: paymentMethod.trim() || 'SEPA Direct Debit',
        isActive: true,
        notes: notes.trim(),
        contractEndDate: contractEndDate || undefined,
        vendorEmail: vendorEmail.trim() || undefined,
        usageRating,
        isVariable,
        paymentAccountId: paymentAccountId || null,
        createdById: assignedUserId || currentUserId,
      },
      editingExpense?.id
    );
    onClose();
  };

  const currencySymbol = CURRENCIES[currency]?.symbol || '€';

  return (
    <div className="modal-overlay">
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '1.25rem 1.5rem',
          borderBottom: '1px solid var(--ha-line)',
        }}>
          <div>
            <h3 style={{ fontSize: '1.35rem', fontWeight: 700, color: 'var(--ha-ink)', lineHeight: 1.1 }}>
              {editingExpense ? 'Edit expense' : 'Add expense'}
            </h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--ha-muted)', marginTop: '2px' }}>
              Record household bill, subscription, college, school or sports cost
            </p>
          </div>

          <button onClick={onClose} className="btn btn-ghost" style={{ padding: '0.35rem' }}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Amount first & largest input with visible currency prefix */}
          <div>
            <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--ha-ink)', display: 'block', marginBottom: '0.35rem' }}>
              Amount *
            </label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <span style={{
                position: 'absolute',
                left: '1rem',
                fontSize: '1.4rem',
                fontWeight: 700,
                color: 'var(--ha-muted)',
                pointerEvents: 'none',
              }}>
                {currencySymbol}
              </span>
              <input
                type="number"
                step="0.01"
                min="0"
                required
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="ha-input ha-input-large"
                style={{ paddingLeft: '2.5rem' }}
                autoFocus
              />
            </div>
          </div>

          {/* Expense Name & Billing Cycle */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--ha-ink)', display: 'block', marginBottom: '0.35rem' }}>
                Description / Item Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. College Tuition, Netflix, Electricity, GAA Club"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="ha-input"
              />
            </div>

            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--ha-ink)', display: 'block', marginBottom: '0.35rem' }}>
                Billing cycle
              </label>
              <select
                value={billingCycle}
                onChange={(e) => setBillingCycle(e.target.value as BillingCycle)}
                className="ha-input"
              >
                <option value="monthly">Monthly</option>
                <option value="termly">Termly (3 terms/year)</option>
                <option value="annual">Annual</option>
                <option value="quarterly">Quarterly</option>
                <option value="weekly">Weekly</option>
              </select>
            </div>
          </div>

          {/* Category selection */}
          <div>
            <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--ha-ink)', display: 'block', marginBottom: '0.35rem' }}>
              Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
              className="ha-input"
            >
              {CATEGORY_LIST.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          {/* Member Assignment & Renewal Day */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '1rem' }}>
            {users.length > 0 && (
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--ha-ink)', display: 'block', marginBottom: '0.35rem' }}>
                  Assigned Household Member
                </label>
                <select
                  value={assignedUserId}
                  onChange={(e) => setAssignedUserId(e.target.value)}
                  className="ha-input"
                >
                  <option value="">Household (Shared)</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.role.replace('_', ' ')})
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--ha-ink)', display: 'block', marginBottom: '0.35rem' }}>
                Next due date
              </label>
              <input
                type="date"
                required
                value={nextRenewalDate}
                onChange={(e) => setNextRenewalDate(e.target.value)}
                className="ha-input tabular-nums"
              />
            </div>
          </div>

          {/* Paid this cycle & variable amount toggles */}
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            {editingExpense && (
              <label style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                cursor: 'pointer',
                padding: '0.6rem 0.75rem',
                borderRadius: 'var(--ha-radius-sm)',
                border: '1px solid var(--ha-line)',
                backgroundColor: isPaidThisCycle ? 'var(--ha-blue-light)' : '#fafaf7',
                width: 'fit-content',
              }}>
                <input
                  type="checkbox"
                  checked={isPaidThisCycle}
                  onChange={(e) => setIsPaidThisCycle(e.target.checked)}
                />
                <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--ha-ink)' }}>
                  Paid this cycle
                </span>
              </label>
            )}

            <label style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              cursor: 'pointer',
              padding: '0.6rem 0.75rem',
              borderRadius: 'var(--ha-radius-sm)',
              border: '1px solid var(--ha-line)',
              backgroundColor: isVariable ? 'var(--ha-blue-light)' : '#fafaf7',
              width: 'fit-content',
            }}
              title="For bills that change each cycle, like electric, gas or shopping — lets you quickly update just the amount from the ledger"
            >
              <input
                type="checkbox"
                checked={isVariable}
                onChange={(e) => setIsVariable(e.target.checked)}
              />
              <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--ha-ink)' }}>
                This amount varies each cycle
              </span>
            </label>
          </div>

          {/* Payment Method & Contract End Date */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--ha-ink)', display: 'block', marginBottom: '0.35rem' }}>
                Payment method
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="ha-input"
              >
                {!PAYMENT_METHODS.includes(paymentMethod) && paymentMethod && (
                  <option value={paymentMethod}>{paymentMethod}</option>
                )}
                {PAYMENT_METHODS.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ fontSize: '0.78rem', color: 'var(--ha-muted)', display: 'block', marginBottom: '0.35rem' }}>
                Contract end date (optional)
              </label>
              <input
                type="date"
                value={contractEndDate}
                onChange={(e) => setContractEndDate(e.target.value)}
                className="ha-input"
                style={{ fontSize: '0.82rem' }}
              />
            </div>
          </div>

          {accounts.length > 0 && (
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--ha-ink)', display: 'block', marginBottom: '0.35rem' }}>
                Paid from account (optional)
              </label>
              <select
                value={paymentAccountId}
                onChange={(e) => setPaymentAccountId(e.target.value)}
                className="ha-input"
              >
                <option value="">Not linked</option>
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>{a.name}{a.institution ? ` — ${a.institution}` : ''}</option>
                ))}
              </select>
            </div>
          )}

          {/* Vendor email (for contract-review outreach) */}
          <div>
            <label style={{ fontSize: '0.78rem', color: 'var(--ha-muted)', display: 'block', marginBottom: '0.35rem' }}>
              Vendor / provider email (optional)
            </label>
            <input
              type="email"
              placeholder="e.g. support@provider.com — lets you draft a renewal/cancel email from here"
              value={vendorEmail}
              onChange={(e) => setVendorEmail(e.target.value)}
              className="ha-input"
              style={{ fontSize: '0.82rem' }}
            />
          </div>

          {/* Optional Notes */}
          <div>
            <label style={{ fontSize: '0.78rem', color: 'var(--ha-muted)', display: 'block', marginBottom: '0.35rem' }}>
              Notes (optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Semester 1 fee, Year 2 college student contribution, Friday coaching"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="ha-input"
              style={{ fontSize: '0.82rem' }}
            />
          </div>

          {/* Actions */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: '0.75rem',
            marginTop: '0.5rem',
            paddingTop: '1rem',
            borderTop: '1px solid var(--ha-line)',
          }}>
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
            >
              {editingExpense ? 'Save changes' : 'Add expense'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
