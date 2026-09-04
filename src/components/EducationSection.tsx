import React from 'react';
import type { ExpenseItem, CurrencyCode } from '../types/expense';
import { convertCurrency, getMonthlyEquivalent } from '../utils/calculations';
import { formatCurrency, formatBillingCycle } from '../utils/formatters';
import { Plus, Edit2, GraduationCap, Trophy, User } from 'lucide-react';
import { CollapsibleSection } from './CollapsibleSection';

interface EducationSectionProps {
  expenses: ExpenseItem[];
  currency: CurrencyCode;
  onEditExpense: (expense: ExpenseItem) => void;
  onOpenAddModal: (category?: string) => void;
  onOpenAddPreset: (presetId: string) => void;
}

export const EducationSection: React.FC<EducationSectionProps> = ({
  expenses,
  currency,
  onEditExpense,
  onOpenAddModal,
  onOpenAddPreset,
}) => {
  const eduItems = expenses.filter((e) => e.category === 'education' || (e.category === 'lifestyle' && (e.name.toLowerCase().includes('club') || e.name.toLowerCase().includes('sport') || e.name.toLowerCase().includes('coaching') || e.name.toLowerCase().includes('swim'))));
  const activeItems = eduItems.filter((e) => e.isActive);

  const monthlyTotal = activeItems.reduce((sum, item) => {
    const amountInDisplay = convertCurrency(item.amount, item.currency, currency);
    return sum + getMonthlyEquivalent(amountInDisplay, item.billingCycle);
  }, 0);

  const annualTotal = monthlyTotal * 12;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* Header Summary */}
      <div className="ha-card" style={{ padding: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
              <span className="ha-badge ha-badge-blue">
                Family & Extracurricular
              </span>
            </div>
            <h2 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--ha-ink)', lineHeight: 1.1 }}>
              Colleges, Schools & Sports
            </h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--ha-muted)', maxWidth: '600px', marginTop: '0.25rem' }}>
              Track higher education tuition fees, school buses, books, youth sports clubs and activity coaching.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--ha-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
                Monthly commitments
              </div>
              <div className="tabular-nums" style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--ha-ink)' }}>
                {formatCurrency(monthlyTotal, currency)}
              </div>
              <div className="tabular-nums" style={{ fontSize: '0.8rem', color: 'var(--ha-muted)' }}>
                {formatCurrency(annualTotal, currency)}/year
              </div>
            </div>

            <button
              onClick={() => onOpenAddModal('education')}
              className="btn btn-primary"
            >
              <Plus size={15} />
              <span>Add education / sport</span>
            </button>
          </div>
        </div>
      </div>

      {/* Ledger Table */}
      <CollapsibleSection id="education-active" title={`Education & Sports Commitments (${activeItems.length})`}>
        {activeItems.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--ha-muted)' }}>
            <p style={{ fontSize: '0.95rem', marginBottom: '1rem' }}>
              No college, school or sports expenses added yet.
            </p>
            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
              <button
                onClick={() => onOpenAddPreset('college-tuition')}
                className="btn btn-secondary"
                style={{ fontSize: '0.8rem' }}
              >
                + Add College Tuition
              </button>
              <button
                onClick={() => onOpenAddPreset('youth-sports-club')}
                className="btn btn-secondary"
                style={{ fontSize: '0.8rem' }}
              >
                + Add Sports Club
              </button>
            </div>
          </div>
        ) : (
          <div>
            {activeItems.map((item) => (
              <div key={item.id} className="ha-ledger-row">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                  <span className="ha-color-marker" style={{ backgroundColor: item.color || '#3155D9' }} />
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--ha-ink)' }}>
                        {item.name}
                      </span>
                      {item.createdBy && (
                        <span className="ha-badge ha-badge-blue" style={{ fontSize: '0.68rem', display: 'flex', alignItems: 'center', gap: '2px' }}>
                          <User size={10} />
                          <span>{item.createdBy.name}</span>
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--ha-muted)', marginTop: '2px' }}>
                      {item.paymentMethod || 'Direct Debit'} • Day {item.renewalDay}
                      {item.notes && <span> • {item.notes}</span>}
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

      {/* Quick Add Presets */}
      <CollapsibleSection id="education-presets" title="Standard Education & Sports Presets" subtitle="Select common items to prefill figures" defaultOpen={false} bodyStyle={{ padding: '1.25rem 1.5rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '0.75rem' }}>
          {[
            { id: 'college-tuition', name: 'University / College Tuition', price: 250.00, icon: GraduationCap },
            { id: 'school-fees-transport', name: 'School Bus & Fees', price: 120.00, icon: GraduationCap },
            { id: 'school-lunches', name: 'School Lunches Program', price: 70.00, icon: GraduationCap },
            { id: 'youth-sports-club', name: 'Youth Sports Club & Coaching', price: 45.00, icon: Trophy },
            { id: 'swimming-lessons', name: 'Swimming Lessons Pass', price: 40.00, icon: Trophy },
            { id: 'music-lessons', name: 'Music Tuition', price: 80.00, icon: GraduationCap },
          ].map((preset) => (
            <div
              key={preset.id}
              onClick={() => onOpenAddPreset(preset.id)}
              className="ha-card-interactive"
              style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}
            >
              <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--ha-ink)' }}>
                {preset.name}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto', paddingTop: '0.5rem', borderTop: '1px solid var(--ha-line)' }}>
                <span className="tabular-nums" style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--ha-ink)' }}>
                  {formatCurrency(preset.price, 'EUR')}/mo
                </span>
                <span style={{ fontSize: '0.75rem', color: 'var(--ha-blue)', fontWeight: 600 }}>
                  + Add
                </span>
              </div>
            </div>
          ))}
        </div>
      </CollapsibleSection>
    </div>
  );
};
