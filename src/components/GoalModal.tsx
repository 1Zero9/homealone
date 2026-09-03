import React, { useState, useEffect } from 'react';
import type { GoalItem, AccountItem, CurrencyCode } from '../types/expense';
import { CURRENCIES } from '../utils/currencies';
import { X } from 'lucide-react';

interface GoalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Record<string, unknown>, existingId?: string) => void;
  editingGoal?: GoalItem | null;
  accounts: AccountItem[];
}

export const GoalModal: React.FC<GoalModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingGoal,
  accounts,
}) => {
  const [name, setName] = useState('');
  const [targetAmount, setTargetAmount] = useState<number | string>('');
  const [currentAmount, setCurrentAmount] = useState<number | string>('');
  const [currency, setCurrency] = useState<CurrencyCode>('EUR');
  const [targetDate, setTargetDate] = useState('');
  const [linkedAccountId, setLinkedAccountId] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (editingGoal) {
      setName(editingGoal.name);
      setTargetAmount(editingGoal.targetAmount);
      setCurrentAmount(editingGoal.currentAmount);
      setCurrency(editingGoal.currency || 'EUR');
      setTargetDate(editingGoal.targetDate || '');
      setLinkedAccountId(editingGoal.linkedAccountId || '');
      setNotes(editingGoal.notes || '');
    } else {
      setName('');
      setTargetAmount('');
      setCurrentAmount('');
      setCurrency('EUR');
      setTargetDate('');
      setLinkedAccountId('');
      setNotes('');
    }
  }, [editingGoal, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    const numTarget = Number(targetAmount) || 0;
    if (numTarget <= 0) return;

    onSave(
      {
        name: name.trim(),
        targetAmount: numTarget,
        currentAmount: Number(currentAmount) || 0,
        currency,
        targetDate: targetDate || null,
        linkedAccountId: linkedAccountId || null,
        notes: notes.trim(),
        isActive: true,
      },
      editingGoal?.id
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
              {editingGoal ? 'Edit goal' : 'Add goal'}
            </h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--ha-muted)', marginTop: '2px' }}>
              Emergency fund, house deposit, or any savings target
            </p>
          </div>
          <button onClick={onClose} className="btn btn-ghost" style={{ padding: '0.35rem' }}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div>
            <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--ha-ink)', display: 'block', marginBottom: '0.35rem' }}>
              Goal name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Emergency fund, House deposit"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="ha-input"
              autoFocus
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--ha-ink)', display: 'block', marginBottom: '0.35rem' }}>
                Target amount *
              </label>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <span style={{ position: 'absolute', left: '0.85rem', fontSize: '1rem', fontWeight: 700, color: 'var(--ha-muted)', pointerEvents: 'none' }}>
                  {currencySymbol}
                </span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  placeholder="0.00"
                  value={targetAmount}
                  onChange={(e) => setTargetAmount(e.target.value)}
                  className="ha-input"
                  style={{ paddingLeft: '1.8rem' }}
                />
              </div>
            </div>
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--ha-ink)', display: 'block', marginBottom: '0.35rem' }}>
                Current amount saved
              </label>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <span style={{ position: 'absolute', left: '0.85rem', fontSize: '1rem', fontWeight: 700, color: 'var(--ha-muted)', pointerEvents: 'none' }}>
                  {currencySymbol}
                </span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={currentAmount}
                  onChange={(e) => setCurrentAmount(e.target.value)}
                  className="ha-input"
                  style={{ paddingLeft: '1.8rem' }}
                />
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--ha-ink)', display: 'block', marginBottom: '0.35rem' }}>
                Currency
              </label>
              <select value={currency} onChange={(e) => setCurrency(e.target.value as CurrencyCode)} className="ha-input">
                {Object.values(CURRENCIES).map((c) => (
                  <option key={c.code} value={c.code}>{c.code} ({c.symbol})</option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ fontSize: '0.78rem', color: 'var(--ha-muted)', display: 'block', marginBottom: '0.35rem' }}>
                Target date (optional)
              </label>
              <input
                type="date"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
                className="ha-input"
                style={{ fontSize: '0.82rem' }}
              />
            </div>
          </div>

          {accounts.length > 0 && (
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--ha-ink)', display: 'block', marginBottom: '0.35rem' }}>
                Linked account (optional)
              </label>
              <select value={linkedAccountId} onChange={(e) => setLinkedAccountId(e.target.value)} className="ha-input">
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
              placeholder="e.g. 6 months of expenses, top-up every payday"
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
              {editingGoal ? 'Save changes' : 'Add goal'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
