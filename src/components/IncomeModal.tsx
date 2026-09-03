import React, { useState, useEffect } from 'react';
import type { IncomeItem, IncomeCategory, BillingCycle, CurrencyCode, UserProfile, AccountItem } from '../types/expense';
import { CURRENCIES } from '../utils/currencies';
import { X } from 'lucide-react';

const INCOME_CATEGORIES: { id: IncomeCategory; label: string }[] = [
  { id: 'salary', label: 'Salary / wages' },
  { id: 'freelance', label: 'Freelance / self-employed' },
  { id: 'rental', label: 'Rental income' },
  { id: 'benefits', label: 'Benefits / support' },
  { id: 'other', label: 'Other' },
];

interface IncomeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (income: Omit<IncomeItem, 'id' | 'createdAt' | 'updatedAt'>, existingId?: string) => void;
  editingIncome?: IncomeItem | null;
  users?: UserProfile[];
  currentUserId?: string;
  accounts?: AccountItem[];
}

export const IncomeModal: React.FC<IncomeModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingIncome,
  users = [],
  currentUserId,
  accounts = [],
}) => {
  const [name, setName] = useState('');
  const [amount, setAmount] = useState<number | string>('');
  const [currency, setCurrency] = useState<CurrencyCode>('EUR');
  const [frequency, setFrequency] = useState<BillingCycle>('monthly');
  const [category, setCategory] = useState<IncomeCategory>('salary');
  const [assignedUserId, setAssignedUserId] = useState<string>('');
  const [notes, setNotes] = useState('');
  const [depositAccountId, setDepositAccountId] = useState<string>('');

  useEffect(() => {
    if (editingIncome) {
      setName(editingIncome.name);
      setAmount(editingIncome.amount);
      setCurrency(editingIncome.currency || 'EUR');
      setFrequency(editingIncome.frequency);
      setCategory(editingIncome.category);
      setAssignedUserId(editingIncome.createdById || currentUserId || '');
      setNotes(editingIncome.notes || '');
      setDepositAccountId(editingIncome.depositAccountId || '');
    } else {
      setName('');
      setAmount('');
      setCurrency('EUR');
      setFrequency('monthly');
      setCategory('salary');
      setAssignedUserId(currentUserId || '');
      setNotes('');
      setDepositAccountId('');
    }
  }, [editingIncome, currentUserId, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    const numAmount = Number(amount) || 0;

    onSave(
      {
        name: name.trim(),
        amount: numAmount,
        currency,
        frequency,
        category,
        isActive: true,
        notes: notes.trim(),
        depositAccountId: depositAccountId || null,
        createdById: assignedUserId || currentUserId,
      },
      editingIncome?.id
    );
    onClose();
  };

  const currencySymbol = CURRENCIES[currency]?.symbol || '€';

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '1.25rem 1.5rem',
          borderBottom: '1px solid var(--ha-line)',
        }}>
          <div>
            <h3 style={{ fontSize: '1.35rem', fontWeight: 700, color: 'var(--ha-ink)', lineHeight: 1.1 }}>
              {editingIncome ? 'Edit income' : 'Add income'}
            </h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--ha-muted)', marginTop: '2px' }}>
              Salary, freelance, rental or any other money coming in
            </p>
          </div>

          <button onClick={onClose} className="btn btn-ghost" style={{ padding: '0.35rem' }}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
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

          <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--ha-ink)', display: 'block', marginBottom: '0.35rem' }}>
                Source *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Salary, Freelance clients, Rental — Apt 2B"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="ha-input"
              />
            </div>

            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--ha-ink)', display: 'block', marginBottom: '0.35rem' }}>
                Frequency
              </label>
              <select
                value={frequency}
                onChange={(e) => setFrequency(e.target.value as BillingCycle)}
                className="ha-input"
              >
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly</option>
                <option value="annual">Annual</option>
              </select>
            </div>
          </div>

          <div>
            <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--ha-ink)', display: 'block', marginBottom: '0.4rem' }}>
              Category
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.5rem' }}>
              {INCOME_CATEGORIES.map((c) => {
                const isSelected = category === c.id;
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setCategory(c.id)}
                    style={{
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
                    {c.label}
                  </button>
                );
              })}
            </div>
          </div>

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

          {accounts.length > 0 && (
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--ha-ink)', display: 'block', marginBottom: '0.35rem' }}>
                Deposited into account (optional)
              </label>
              <select
                value={depositAccountId}
                onChange={(e) => setDepositAccountId(e.target.value)}
                className="ha-input"
              >
                <option value="">Not linked</option>
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>{a.name}{a.institution ? ` — ${a.institution}` : ''}</option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label style={{ fontSize: '0.78rem', color: 'var(--ha-muted)', display: 'block', marginBottom: '0.35rem' }}>
              Notes (optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Net after tax, includes annual bonus"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="ha-input"
              style={{ fontSize: '0.82rem' }}
            />
          </div>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: '0.75rem',
            marginTop: '0.5rem',
            paddingTop: '1rem',
            borderTop: '1px solid var(--ha-line)',
          }}>
            <button type="button" onClick={onClose} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              {editingIncome ? 'Save changes' : 'Add income'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
