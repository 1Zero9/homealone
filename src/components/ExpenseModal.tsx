import React, { useState, useEffect } from 'react';
import type { ExpenseItem, ExpenseCategory, BillingCycle, CurrencyCode } from '../types/expense';
import { CATEGORY_LIST, CATEGORIES } from '../data/categories';
import { PRESETS } from '../data/presets';
import { CURRENCIES } from '../utils/currencies';
import { X } from 'lucide-react';

interface ExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (expense: Omit<ExpenseItem, 'id' | 'createdAt' | 'updatedAt'>, existingId?: string) => void;
  editingExpense?: ExpenseItem | null;
  initialPresetId?: string | null;
}

export const ExpenseModal: React.FC<ExpenseModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingExpense,
  initialPresetId,
}) => {
  const [name, setName] = useState('');
  const [amount, setAmount] = useState<number | string>('');
  const [currency, setCurrency] = useState<CurrencyCode>('EUR');
  const [billingCycle, setBillingCycle] = useState<BillingCycle>('monthly');
  const [category, setCategory] = useState<ExpenseCategory>('utilities');
  const [renewalDay, setRenewalDay] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState('SEPA Direct Debit');
  const [notes, setNotes] = useState('');
  const [contractEndDate, setContractEndDate] = useState('');
  const [usageRating, setUsageRating] = useState<'high' | 'medium' | 'low'>('high');

  useEffect(() => {
    if (editingExpense) {
      setName(editingExpense.name);
      setAmount(editingExpense.amount);
      setCurrency(editingExpense.currency || 'EUR');
      setBillingCycle(editingExpense.billingCycle);
      setCategory(editingExpense.category);
      setRenewalDay(editingExpense.renewalDay || 1);
      setPaymentMethod(editingExpense.paymentMethod || 'SEPA Direct Debit');
      setNotes(editingExpense.notes || '');
      setContractEndDate(editingExpense.contractEndDate || '');
      setUsageRating(editingExpense.usageRating || 'high');
    } else if (initialPresetId) {
      const preset = PRESETS.find((p) => p.id === initialPresetId);
      if (preset) {
        setName(preset.name);
        setAmount(preset.defaultAmount);
        setCurrency('EUR');
        setBillingCycle(preset.defaultCycle);
        setCategory(preset.category);
        setRenewalDay(1);
        setPaymentMethod(preset.defaultPaymentMethod);
        setNotes(preset.description || '');
      }
    } else {
      setName('');
      setAmount('');
      setCurrency('EUR');
      setBillingCycle('monthly');
      setCategory('utilities');
      setRenewalDay(1);
      setPaymentMethod('SEPA Direct Debit');
      setNotes('');
      setContractEndDate('');
      setUsageRating('high');
    }
  }, [editingExpense, initialPresetId, isOpen]);

  if (!isOpen) return null;

  const handleApplyPreset = (presetId: string) => {
    const preset = PRESETS.find((p) => p.id === presetId);
    if (!preset) return;
    setName(preset.name);
    setAmount(preset.defaultAmount);
    setBillingCycle(preset.defaultCycle);
    setCategory(preset.category);
    setPaymentMethod(preset.defaultPaymentMethod);
    setNotes(preset.description || '');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    const numAmount = Number(amount) || 0;

    const now = new Date();
    const renewalDateObj = new Date(now.getFullYear(), now.getMonth(), Math.min(Number(renewalDay) || 1, 28));
    const nextRenewalDate = renewalDateObj.toISOString().split('T')[0];

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
        renewalDay: Number(renewalDay) || 1,
        nextRenewalDate,
        paymentMethod: paymentMethod.trim() || 'SEPA Direct Debit',
        isActive: true,
        notes: notes.trim(),
        contractEndDate: contractEndDate || undefined,
        usageRating,
      },
      editingExpense?.id
    );
    onClose();
  };

  const currencySymbol = CURRENCIES[currency]?.symbol || '€';

  return (
    <div className="modal-overlay" onClick={onClose}>
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
              Record household or subscription spend
            </p>
          </div>

          <button onClick={onClose} className="btn btn-ghost" style={{ padding: '0.35rem' }}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Quick presets strip (only when adding new) */}
          {!editingExpense && (
            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--ha-muted)', textTransform: 'uppercase', marginBottom: '0.4rem', display: 'block', letterSpacing: '0.03em' }}>
                Quick autofill
              </label>
              <div style={{ display: 'flex', gap: '0.4rem', overflowX: 'auto', paddingBottom: '0.2rem' }}>
                {PRESETS.filter((p) => p.popular).slice(0, 6).map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => handleApplyPreset(preset.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      padding: '0.3rem 0.6rem',
                      borderRadius: 'var(--ha-radius-sm)',
                      backgroundColor: '#fafaf7',
                      border: '1px solid var(--ha-line)',
                      color: 'var(--ha-ink)',
                      fontSize: '0.75rem',
                      fontWeight: 500,
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    <span className="ha-color-marker" style={{ backgroundColor: preset.color }} />
                    <span>{preset.name.split(' ')[0]}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Form Rule 1: Amount first & largest input with visible currency prefix */}
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
                Expense description / service name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Netflix, Electricity, ChatGPT"
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
                <option value="annual">Annual</option>
                <option value="quarterly">Quarterly</option>
                <option value="weekly">Weekly</option>
              </select>
            </div>
          </div>

          {/* Form Rule 3: Category as a compact grid of labelled rectangular controls */}
          <div>
            <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--ha-ink)', display: 'block', marginBottom: '0.4rem' }}>
              Category
            </label>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
              gap: '0.5rem',
            }}>
              {CATEGORY_LIST.map((c) => {
                const isSelected = category === c.id;
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setCategory(c.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      padding: '0.6rem 0.75rem',
                      borderRadius: 'var(--ha-radius-sm)',
                      border: '1px solid',
                      borderColor: isSelected ? 'var(--ha-blue)' : 'var(--ha-line)',
                      backgroundColor: isSelected ? 'var(--ha-blue-light)' : '#fafaf7',
                      color: isSelected ? 'var(--ha-blue)' : 'var(--ha-ink)',
                      fontSize: '0.82rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      textAlign: 'left',
                    }}
                  >
                    <span className="ha-color-marker" style={{ backgroundColor: c.color }} />
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {c.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Renewal Day & Payment Method */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '1rem' }}>
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--ha-ink)', display: 'block', marginBottom: '0.35rem' }}>
                Renewal day (1–31)
              </label>
              <input
                type="number"
                min="1"
                max="31"
                value={renewalDay}
                onChange={(e) => setRenewalDay(Math.min(31, Math.max(1, Number(e.target.value))))}
                className="ha-input tabular-nums"
              />
            </div>

            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--ha-ink)', display: 'block', marginBottom: '0.35rem' }}>
                Payment method
              </label>
              <input
                type="text"
                placeholder="e.g. SEPA Direct Debit, Visa, Apple Pay"
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="ha-input"
              />
            </div>
          </div>

          {/* Optional Notes & Contract Date (Form Rule: Visually secondary) */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ fontSize: '0.78rem', color: 'var(--ha-muted)', display: 'block', marginBottom: '0.35rem' }}>
                Notes (optional)
              </label>
              <input
                type="text"
                placeholder="e.g. 500Mbps fiber plan, 2 devices"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="ha-input"
                style={{ fontSize: '0.82rem' }}
              />
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
