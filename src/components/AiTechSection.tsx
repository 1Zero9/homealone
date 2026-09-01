import React from 'react';
import type { ExpenseItem, CurrencyCode } from '../types/expense';
import { convertCurrency, getMonthlyEquivalent } from '../utils/calculations';
import { formatCurrency, formatBillingCycle } from '../utils/formatters';
import { Plus, AlertCircle, Edit2 } from 'lucide-react';

interface AiTechSectionProps {
  expenses: ExpenseItem[];
  currency: CurrencyCode;
  onToggleActive: (id: string) => void;
  onEditExpense: (expense: ExpenseItem) => void;
  onOpenAddPreset: (presetId: string) => void;
  onOpenAddModal: () => void;
}

export const AiTechSection: React.FC<AiTechSectionProps> = ({
  expenses,
  currency,
  onToggleActive,
  onEditExpense,
  onOpenAddPreset,
  onOpenAddModal,
}) => {
  const aiExpenses = expenses.filter((e) => e.category === 'ai-tech');
  const activeAi = aiExpenses.filter((e) => e.isActive);
  const pausedAi = aiExpenses.filter((e) => !e.isActive);

  const monthlyAiSpend = activeAi.reduce((sum, item) => {
    const amountInDisplay = convertCurrency(item.amount, item.currency, currency);
    return sum + getMonthlyEquivalent(amountInDisplay, item.billingCycle);
  }, 0);

  const annualAiSpend = monthlyAiSpend * 12;

  const hasChatGpt = activeAi.some((e) => e.name.toLowerCase().includes('chatgpt') || e.name.toLowerCase().includes('openai'));
  const hasClaude = activeAi.some((e) => e.name.toLowerCase().includes('claude') || e.name.toLowerCase().includes('anthropic'));

  const popularAiPresets = [
    { id: 'chatgpt-plus', name: 'ChatGPT Plus', price: 22.99, tag: 'Reasoning & Multimodal' },
    { id: 'claude-pro', name: 'Claude Pro', price: 22.99, tag: 'Claude 3.5 Sonnet & Projects' },
    { id: 'cursor-pro', name: 'Cursor Pro', price: 20.00, tag: 'IDE AI Assistant' },
    { id: 'midjourney', name: 'Midjourney Standard', price: 28.00, tag: 'Image generation' },
    { id: 'github-copilot', name: 'GitHub Copilot', price: 10.00, tag: 'Code autocomplete' },
    { id: 'perplexity-pro', name: 'Perplexity Pro', price: 22.99, tag: 'Pro search engine' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* Header Summary */}
      <div className="ha-card" style={{ padding: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
              <span className="ha-badge ha-badge-blue">
                Category review
              </span>
            </div>
            <h2 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--ha-ink)', lineHeight: 1.1 }}>
              AI & developer tools
            </h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--ha-muted)', maxWidth: '600px', marginTop: '0.25rem' }}>
              Summary of monthly commitments across language models, coding assistants and cloud services.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--ha-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
                Monthly AI spend
              </div>
              <div className="tabular-nums" style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--ha-ink)' }}>
                {formatCurrency(monthlyAiSpend, currency)}
              </div>
              <div className="tabular-nums" style={{ fontSize: '0.8rem', color: 'var(--ha-muted)' }}>
                {formatCurrency(annualAiSpend, currency)}/year
              </div>
            </div>

            <button
              onClick={onOpenAddModal}
              className="btn btn-primary"
            >
              <Plus size={15} />
              <span>Add tool</span>
            </button>
          </div>
        </div>
      </div>

      {/* Overlap Warning Note */}
      {hasChatGpt && hasClaude && (
        <div style={{
          padding: '1rem 1.25rem',
          backgroundColor: 'var(--ha-red-tint)',
          border: '1px solid rgba(240, 78, 62, 0.25)',
          borderRadius: 'var(--ha-radius-md)',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '0.75rem',
        }}>
          <AlertCircle size={18} color="var(--ha-red)" style={{ flexShrink: 0, marginTop: '2px' }} />
          <div>
            <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--ha-red)', marginBottom: '0.15rem' }}>
              Dual frontier model subscription (ChatGPT + Claude)
            </h4>
            <p style={{ fontSize: '0.82rem', color: 'var(--ha-ink)', lineHeight: 1.45 }}>
              Both ChatGPT Plus ({formatCurrency(22.99, currency)}/mo) and Claude Pro ({formatCurrency(22.99, currency)}/mo) are active simultaneously. Combined cost is <strong>{formatCurrency(45.98 * 12, currency)}/year</strong>. Pausing one when not in use saves {formatCurrency(275.88, currency)} annually.
            </p>
          </div>
        </div>
      )}

      {/* Active AI Ledger */}
      <div className="ha-card" style={{ overflow: 'hidden' }}>
        <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--ha-line)' }}>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--ha-ink)' }}>
            Active subscriptions ({activeAi.length})
          </h3>
        </div>

        {activeAi.length === 0 ? (
          <div style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--ha-muted)' }}>
            <p style={{ fontSize: '0.9rem' }}>No active AI tools recorded.</p>
          </div>
        ) : (
          <div>
            {activeAi.map((item) => (
              <div key={item.id} className="ha-ledger-row">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                  <span className="ha-color-marker" style={{ backgroundColor: item.color || '#3155D9' }} />
                  <div>
                    <div style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--ha-ink)' }}>
                      {item.name}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--ha-muted)' }}>
                      {item.paymentMethod || 'Credit Card'} • Renews day {item.renewalDay}
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

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <label className="toggle-switch" title="Pause or activate">
                    <input
                      type="checkbox"
                      checked={item.isActive}
                      onChange={() => onToggleActive(item.id)}
                    />
                    <span className="slider"></span>
                  </label>

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
      </div>

      {/* Paused AI Subscriptions */}
      {pausedAi.length > 0 && (
        <div className="ha-card" style={{ overflow: 'hidden' }}>
          <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--ha-line)', backgroundColor: '#fafaf7' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--ha-muted)' }}>
              Paused subscriptions ({pausedAi.length})
            </h3>
          </div>
          <div>
            {pausedAi.map((item) => (
              <div key={item.id} className="ha-ledger-row" style={{ opacity: 0.6 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                  <span className="ha-color-marker" style={{ backgroundColor: 'var(--ha-muted)' }} />
                  <div>
                    <div style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--ha-ink)' }}>
                      {item.name}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--ha-muted)' }}>
                      Paused • saving {formatCurrency(item.amount, item.currency)}/month
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      checked={item.isActive}
                      onChange={() => onToggleActive(item.id)}
                    />
                    <span className="slider"></span>
                  </label>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Add Presets */}
      <div className="ha-card" style={{ padding: '1.5rem' }}>
        <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--ha-ink)', marginBottom: '0.25rem' }}>
          Common AI presets
        </h3>
        <p style={{ fontSize: '0.8rem', color: 'var(--ha-muted)', marginBottom: '1rem' }}>
          Add standard subscriptions with prefilled figures
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.75rem' }}>
          {popularAiPresets.map((preset) => (
            <div
              key={preset.id}
              onClick={() => onOpenAddPreset(preset.id)}
              className="ha-card-interactive"
              style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}
            >
              <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--ha-ink)' }}>
                {preset.name}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--ha-muted)' }}>
                {preset.tag}
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
      </div>
    </div>
  );
};
