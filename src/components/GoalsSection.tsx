import React from 'react';
import type { GoalItem } from '../types/expense';
import { formatCurrency } from '../utils/formatters';
import { Edit2, Trash2, Plus, Target } from 'lucide-react';
import { CollapsibleSection } from './CollapsibleSection';

interface GoalsSectionProps {
  goals: GoalItem[];
  onEditGoal: (goal: GoalItem) => void;
  onDeleteGoal: (id: string) => void;
  onOpenAddModal: () => void;
}

function daysUntil(dateStr: string): number {
  const target = new Date(dateStr).getTime();
  const now = new Date().setHours(0, 0, 0, 0);
  return Math.ceil((target - now) / (1000 * 60 * 60 * 24));
}

export const GoalsSection: React.FC<GoalsSectionProps> = ({
  goals,
  onEditGoal,
  onDeleteGoal,
  onOpenAddModal,
}) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      <div className="ha-card" style={{ padding: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
              <span className="ha-badge ha-badge-blue">Savings targets</span>
            </div>
            <h2 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--ha-ink)', lineHeight: 1.1 }}>
              Goals
            </h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--ha-muted)', maxWidth: '600px', marginTop: '0.25rem' }}>
              Emergency funds, deposits, or anything else you&apos;re saving towards.
            </p>
          </div>
          <button onClick={onOpenAddModal} className="btn btn-primary" style={{ fontSize: '0.85rem' }}>
            <Plus size={15} />
            <span>Add goal</span>
          </button>
        </div>
      </div>

      <CollapsibleSection id="goals-ledger" title={`Goals (${goals.length})`}>
        {goals.length === 0 ? (
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
              <Target size={24} color="var(--ha-blue)" />
            </div>
            <h4 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--ha-ink)', marginBottom: '0.35rem' }}>
              No goals set yet
            </h4>
            <p style={{ fontSize: '0.85rem', color: 'var(--ha-muted)', maxWidth: '440px', margin: '0 auto 1.5rem', lineHeight: 1.5 }}>
              Set a target — an emergency fund, a house deposit, a holiday — and track progress as you save.
            </p>
            <button onClick={onOpenAddModal} className="btn btn-primary" style={{ fontSize: '0.85rem' }}>
              <Plus size={15} />
              <span>+ Add first goal</span>
            </button>
          </div>
        ) : (
          <div>
            {goals.map((item) => {
              const pct = item.targetAmount > 0
                ? Math.min(100, Math.round((item.currentAmount / item.targetAmount) * 100))
                : 0;
              const remaining = Math.max(0, item.targetAmount - item.currentAmount);
              const days = item.targetDate ? daysUntil(item.targetDate) : null;

              return (
                <div key={item.id} style={{ borderBottom: '1px solid var(--ha-line)', padding: '1.1rem 1.25rem', opacity: item.isActive ? 1 : 0.55 }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem' }}>
                    <div style={{ flex: '1 1 280px', minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--ha-ink)' }}>
                          {item.name}
                        </span>
                        {item.linkedAccount && (
                          <span className="ha-badge ha-badge-neutral" style={{ fontSize: '0.7rem' }}>
                            {item.linkedAccount.name}
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--ha-muted)', marginTop: '2px' }}>
                        {formatCurrency(item.currentAmount, item.currency)} of {formatCurrency(item.targetAmount, item.currency)}
                        {' — '}
                        {formatCurrency(remaining, item.currency)} to go
                        {item.targetDate && days !== null && (
                          <>
                            {' • '}
                            {days > 0 ? `${days} day${days === 1 ? '' : 's'} left` : days === 0 ? 'Due today' : `${Math.abs(days)} day${Math.abs(days) === 1 ? '' : 's'} overdue`}
                          </>
                        )}
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexShrink: 0 }}>
                      <span className="tabular-nums" style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--ha-ink)' }}>
                        {pct}%
                      </span>
                      <button
                        onClick={() => onEditGoal(item)}
                        className="btn btn-ghost"
                        style={{ padding: '0.35rem 0.45rem' }}
                        title="Edit record"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        onClick={() => onDeleteGoal(item.id)}
                        className="btn btn-ghost"
                        style={{ padding: '0.35rem 0.45rem', color: 'var(--ha-red)' }}
                        title="Delete record"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  <div style={{ marginTop: '0.6rem', height: '8px', borderRadius: '999px', backgroundColor: 'var(--ha-line)', overflow: 'hidden' }}>
                    <div style={{
                      height: '100%',
                      width: `${pct}%`,
                      borderRadius: '999px',
                      backgroundColor: pct >= 100 ? 'var(--ha-lime)' : 'var(--ha-blue)',
                      transition: 'width 0.3s ease',
                    }} />
                  </div>

                  {item.notes && (
                    <p style={{ fontSize: '0.75rem', color: 'var(--ha-muted)', marginTop: '0.5rem' }}>
                      {item.notes}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CollapsibleSection>
    </div>
  );
};
