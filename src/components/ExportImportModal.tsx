import React, { useRef, useState } from 'react';
import type { ExpenseItem, CurrencyCode, CustomCategoryItem } from '../types/expense';
import { exportExpensesCSV, exportExpensesJSON, importExpensesJSON, resetToDefaults } from '../services/storage';
import { getErrorMessage } from '../lib/errors';
import { X, Upload, FileSpreadsheet, FileCode, RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react';

interface ExportImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  expenses: ExpenseItem[];
  currency: CurrencyCode;
  onDataUpdated: (newExpenses: ExpenseItem[]) => void;
  customCategories?: CustomCategoryItem[];
}

export const ExportImportModal: React.FC<ExportImportModalProps> = ({
  isOpen,
  onClose,
  expenses,
  onDataUpdated,
  customCategories = [],
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const [errorStatus, setErrorStatus] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const updated = importExpensesJSON(content);
        onDataUpdated(updated);
        setImportStatus(`Restored ${updated.length} expense records.`);
        setErrorStatus(null);
      } catch (err: unknown) {
        setErrorStatus(`Import failed: ${getErrorMessage(err, 'Invalid JSON file')}`);
        setImportStatus(null);
      }
    };
    reader.readAsText(file);
  };

  const handleReset = () => {
    if (window.confirm('Reset all records to the default sample dataset?')) {
      const reset = resetToDefaults();
      onDataUpdated(reset);
      setImportStatus('Reset back to default sample records.');
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '540px' }}>
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
              Data backup & export
            </h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--ha-muted)', marginTop: '2px' }}>
              Download records or restore offline backups
            </p>
          </div>

          <button onClick={onClose} className="btn btn-ghost" style={{ padding: '0.35rem' }}>
            <X size={18} />
          </button>
        </div>

        <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Status feedback */}
          {importStatus && (
            <div style={{
              backgroundColor: 'var(--ha-lime-tint)',
              border: '1px solid var(--ha-lime)',
              borderRadius: 'var(--ha-radius-sm)',
              padding: '0.65rem 0.85rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              color: 'var(--ha-ink)',
              fontSize: '0.82rem',
              fontWeight: 500,
            }}>
              <CheckCircle2 size={16} color="var(--ha-ink)" />
              <span>{importStatus}</span>
            </div>
          )}

          {errorStatus && (
            <div style={{
              backgroundColor: 'var(--ha-red-tint)',
              border: '1px solid var(--ha-red)',
              borderRadius: 'var(--ha-radius-sm)',
              padding: '0.65rem 0.85rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              color: 'var(--ha-red)',
              fontSize: '0.82rem',
              fontWeight: 500,
            }}>
              <AlertCircle size={16} />
              <span>{errorStatus}</span>
            </div>
          )}

          {/* Export Options */}
          <div>
            <h4 style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--ha-ink)', marginBottom: '0.65rem' }}>
              Export records
            </h4>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div
                onClick={() => exportExpensesCSV(expenses, customCategories)}
                className="ha-card-interactive"
                style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--ha-blue)' }}>
                  <FileSpreadsheet size={18} />
                  <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>CSV spreadsheet</span>
                </div>
                <p style={{ fontSize: '0.75rem', color: 'var(--ha-muted)', lineHeight: 1.35 }}>
                  Export all items to Excel or Google Sheets.
                </p>
              </div>

              <div
                onClick={() => exportExpensesJSON(expenses)}
                className="ha-card-interactive"
                style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--ha-ink)' }}>
                  <FileCode size={18} />
                  <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>JSON backup</span>
                </div>
                <p style={{ fontSize: '0.75rem', color: 'var(--ha-muted)', lineHeight: 1.35 }}>
                  Full data backup to restore at any time.
                </p>
              </div>
            </div>
          </div>

          {/* Import Backup */}
          <div style={{ paddingTop: '1rem', borderTop: '1px solid var(--ha-line)' }}>
            <h4 style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--ha-ink)', marginBottom: '0.65rem' }}>
              Restore from backup
            </h4>

            <input
              type="file"
              ref={fileInputRef}
              accept=".json"
              onChange={handleFileUpload}
              style={{ display: 'none' }}
            />

            <button
              onClick={() => fileInputRef.current?.click()}
              className="btn btn-secondary"
              style={{ width: '100%', padding: '0.7rem' }}
            >
              <Upload size={15} />
              <span>Select JSON backup file</span>
            </button>
          </div>

          {/* Reset data */}
          <div style={{ paddingTop: '1rem', borderTop: '1px solid var(--ha-line)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--ha-ink)' }}>
                Reset sample records
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--ha-muted)' }}>
                Restores standard default household ledger
              </div>
            </div>

            <button
              onClick={handleReset}
              className="btn btn-destructive"
              style={{ fontSize: '0.8rem', padding: '0.4rem 0.75rem' }}
            >
              <RefreshCw size={13} />
              <span>Reset</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
