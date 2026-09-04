import React, { useCallback, useEffect, useState } from 'react';
import { FileSpreadsheet, Upload, Trash2, ChevronRight, Edit2, Loader2 } from 'lucide-react';
import type { ExpenseItem, StatementImportSummary, CurrencyCode, AccountItem, CustomCategoryItem } from '../types/expense';
import { StatementImportModal } from './StatementImportModal';
import { CollapsibleSection } from './CollapsibleSection';

interface StatementsSectionProps {
  expenses: ExpenseItem[];
  accounts: AccountItem[];
  householdCurrency: CurrencyCode;
  onExpensesChanged?: () => void;
  customCategories?: CustomCategoryItem[];
  onCategoryCreated?: (category: CustomCategoryItem) => void;
}

export const StatementsSection: React.FC<StatementsSectionProps> = ({ expenses, accounts, householdCurrency, onExpensesChanged, customCategories = [], onCategoryCreated }) => {
  const [imports, setImports] = useState<StatementImportSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [reviewImportId, setReviewImportId] = useState<string | null>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameInput, setRenameInput] = useState('');
  const [isSavingRename, setIsSavingRename] = useState(false);

  const fetchImports = useCallback(() => {
    fetch('/api/statements')
      .then((res) => res.json())
      .then((data) => {
        if (data.status === 'ok') setImports(data.imports);
      })
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    fetchImports();
  }, [fetchImports]);

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this statement import? Any bills or one-off payments you already logged from it will stay.')) return;
    const res = await fetch(`/api/statements/${id}`, { method: 'DELETE' });
    const data = await res.json();
    if (data.status === 'ok') {
      setImports((prev) => prev.filter((i) => i.id !== id));
    }
  };

  const handleSaveRename = async (id: string) => {
    if (!renameInput.trim()) return;
    setIsSavingRename(true);
    try {
      const res = await fetch(`/api/statements/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ label: renameInput.trim() }),
      });
      const data = await res.json();
      if (data.status === 'ok') {
        setImports((prev) => prev.map((i) => (i.id === id ? { ...i, label: data.import.label } : i)));
        setRenamingId(null);
      }
    } finally {
      setIsSavingRename(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div className="ha-card" style={{ padding: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
              <span className="ha-badge ha-badge-blue">Reconcile</span>
            </div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--ha-ink)', lineHeight: 1.1 }}>
              Statement imports
            </h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--ha-muted)', maxWidth: '560px', marginTop: '0.25rem' }}>
              Cross-check a bank or credit-card statement against your bills — catch missed payments, forgotten subscriptions, and ad-hoc spending Tally doesn&apos;t know about yet.
            </p>
          </div>
          <button onClick={() => setIsModalOpen(true)} className="btn btn-primary" style={{ fontSize: '0.85rem' }}>
            <Upload size={15} />
            <span>Import statement</span>
          </button>
        </div>

        {!isLoading && imports.length === 0 && (
          <div style={{ textAlign: 'center', padding: '1.5rem 1rem', color: 'var(--ha-muted)', fontSize: '0.85rem' }}>
            No statements imported yet.
          </div>
        )}
      </div>

      {imports.length > 0 && (
        <CollapsibleSection id="statements-imports" title={`Imported statements (${imports.length})`} bodyStyle={{ padding: '1.25rem 1.5rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {imports.map((imp) => (
            <div
              key={imp.id}
              onClick={() => renamingId !== imp.id && setReviewImportId(imp.id)}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem',
                padding: '0.65rem 0.85rem', borderRadius: 'var(--ha-radius-md)', border: '1px solid var(--ha-line)',
                cursor: renamingId === imp.id ? 'default' : 'pointer',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', minWidth: 0, flex: 1 }}>
                <FileSpreadsheet size={16} color="var(--ha-muted)" style={{ flexShrink: 0 }} />
                <div style={{ minWidth: 0, flex: 1 }}>
                  {renamingId === imp.id ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }} onClick={(e) => e.stopPropagation()}>
                      <input
                        autoFocus
                        className="ha-input"
                        value={renameInput}
                        onChange={(e) => setRenameInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSaveRename(imp.id);
                          if (e.key === 'Escape') setRenamingId(null);
                        }}
                        style={{ fontSize: '0.85rem', padding: '0.25rem 0.45rem', maxWidth: '220px' }}
                      />
                      <button
                        onClick={() => handleSaveRename(imp.id)}
                        disabled={isSavingRename || !renameInput.trim()}
                        className="btn btn-primary"
                        style={{ fontSize: '0.72rem', padding: '0.3rem 0.5rem' }}
                      >
                        {isSavingRename ? <Loader2 size={12} className="spin" /> : 'Save'}
                      </button>
                      <button onClick={() => setRenamingId(null)} className="btn btn-ghost" style={{ fontSize: '0.72rem', padding: '0.3rem 0.4rem' }}>
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <>
                      <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--ha-ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {imp.label}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--ha-muted)' }}>
                        {imp.account && <span style={{ fontWeight: 600, color: 'var(--ha-ink)' }}>{imp.account.name} • </span>}
                        {imp.total} rows • {imp.matched} matched
                        {imp.unmatched > 0 && <span style={{ color: 'var(--ha-red)', fontWeight: 600 }}> • {imp.unmatched} need review</span>}
                      </div>
                    </>
                  )}
                </div>
              </div>
              {renamingId !== imp.id && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
                  <button
                    onClick={(e) => { e.stopPropagation(); setRenameInput(imp.label); setRenamingId(imp.id); }}
                    className="btn btn-ghost"
                    style={{ padding: '0.3rem 0.4rem' }}
                    title="Rename import"
                  >
                    <Edit2 size={13} />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDelete(imp.id); }}
                    className="btn btn-ghost"
                    style={{ padding: '0.3rem 0.4rem', color: 'var(--ha-red)' }}
                    title="Delete import"
                  >
                    <Trash2 size={13} />
                  </button>
                  <ChevronRight size={16} color="var(--ha-muted)" />
                </div>
              )}
            </div>
          ))}
        </div>
        </CollapsibleSection>
      )}

      <StatementImportModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        expenses={expenses}
        accounts={accounts}
        householdCurrency={householdCurrency}
        onImported={fetchImports}
        onExpensesChanged={onExpensesChanged}
        customCategories={customCategories}
        onCategoryCreated={onCategoryCreated}
      />

      <StatementImportModal
        isOpen={!!reviewImportId}
        onClose={() => { setReviewImportId(null); fetchImports(); }}
        expenses={expenses}
        accounts={accounts}
        householdCurrency={householdCurrency}
        onImported={fetchImports}
        onExpensesChanged={onExpensesChanged}
        initialImportId={reviewImportId}
        customCategories={customCategories}
        onCategoryCreated={onCategoryCreated}
      />
    </div>
  );
};
