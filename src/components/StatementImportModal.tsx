import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  X,
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  Link2,
  PlusCircle,
  EyeOff,
  Loader2,
  RotateCcw,
  AlertTriangle,
  ArrowLeft,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import type { ExpenseItem, StatementTransactionItem, CurrencyCode, AccountItem } from '../types/expense';
import { formatCurrency } from '../utils/formatters';
import { parseCsv, guessColumns, parseAmount, parseDateFlexible, type ColumnGuess } from '../lib/statementMatching';

interface StatementImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  expenses: ExpenseItem[];
  accounts: AccountItem[];
  householdCurrency: CurrencyCode;
  onImported: () => void;
  initialImportId?: string | null;
}

type Step = 'upload' | 'map' | 'review';
type ReviewFilter = 'needs_review' | 'matched' | 'ignored' | 'all';

interface PreparedRow {
  date: string;
  rawDescription: string;
  amount: number;
  direction: 'DEBIT' | 'CREDIT';
}

interface TxGroup {
  key: string;
  label: string;
  items: StatementTransactionItem[];
}

const FILTERS: { id: ReviewFilter; label: string }[] = [
  { id: 'needs_review', label: 'Needs review' },
  { id: 'matched', label: 'Matched' },
  { id: 'ignored', label: 'Ignored' },
  { id: 'all', label: 'All' },
];

export const StatementImportModal: React.FC<StatementImportModalProps> = ({
  isOpen,
  onClose,
  expenses,
  accounts,
  householdCurrency,
  onImported,
  initialImportId,
}) => {
  const [step, setStep] = useState<Step>('upload');
  const [fileName, setFileName] = useState('');
  const [label, setLabel] = useState('');
  const [accountId, setAccountId] = useState('');
  const [importAccount, setImportAccount] = useState<{ id: string; name: string; institution?: string | null } | null>(null);
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<string[][]>([]);
  const [dateCol, setDateCol] = useState<number | null>(null);
  const [descCol, setDescCol] = useState<number | null>(null);
  const [amountMode, setAmountMode] = useState<'single' | 'split'>('single');
  const [amountCol, setAmountCol] = useState<number | null>(null);
  const [debitCol, setDebitCol] = useState<number | null>(null);
  const [creditCol, setCreditCol] = useState<number | null>(null);
  const [positiveMeans, setPositiveMeans] = useState<'out' | 'in'>('out');
  const [parseError, setParseError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [importId, setImportId] = useState<string | null>(null);
  const [importLabel, setImportLabel] = useState('');
  const [transactions, setTransactions] = useState<StatementTransactionItem[]>([]);
  const [reviewFilter, setReviewFilter] = useState<ReviewFilter>('needs_review');
  const [busyTxId, setBusyTxId] = useState<string | null>(null);
  const [linkingTxId, setLinkingTxId] = useState<string | null>(null);
  const [selectedExpenseId, setSelectedExpenseId] = useState<Record<string, string>>({});
  const [isLoadingReview, setIsLoadingReview] = useState(false);
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());
  const [busyGroupKey, setBusyGroupKey] = useState<string | null>(null);
  const [aiRows, setAiRows] = useState<PreparedRow[] | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const loadedInitialRef = useRef(false);

  const reset = useCallback(() => {
    setStep('upload');
    setFileName('');
    setLabel('');
    setAccountId('');
    setImportAccount(null);
    setHeaders([]);
    setRows([]);
    setDateCol(null);
    setDescCol(null);
    setAmountMode('single');
    setAmountCol(null);
    setDebitCol(null);
    setCreditCol(null);
    setPositiveMeans('out');
    setParseError('');
    setIsSubmitting(false);
    setSubmitError('');
    setImportId(null);
    setImportLabel('');
    setTransactions([]);
    setReviewFilter('needs_review');
    setBusyTxId(null);
    setLinkingTxId(null);
    setSelectedExpenseId({});
    setCollapsedGroups(new Set());
    setBusyGroupKey(null);
    setAiRows(null);
    setIsExtracting(false);
    loadedInitialRef.current = false;
  }, []);

  const handleClose = () => {
    reset();
    onClose();
  };

  useEffect(() => {
    if (isOpen && initialImportId && !loadedInitialRef.current) {
      loadedInitialRef.current = true;
      setIsLoadingReview(true);
      fetch(`/api/statements/${initialImportId}/transactions`)
        .then((res) => res.json())
        .then((data) => {
          if (data.status === 'ok') {
            setImportId(initialImportId);
            setImportLabel(data.import?.label || 'Statement import');
            setImportAccount(data.import?.account || null);
            setTransactions(data.transactions || []);
            setStep('review');
          }
        })
        .finally(() => setIsLoadingReview(false));
    }
  }, [isOpen, initialImportId]);

  const loadText = (text: string, name?: string) => {
    const parsed = parseCsv(text);
    if (parsed.length < 2) {
      setParseError("Could not find any data rows in that file. Make sure it's a CSV export with a header row.");
      return;
    }
    const [headerRow, ...dataRows] = parsed;
    const g: ColumnGuess = guessColumns(headerRow);
    setHeaders(headerRow);
    setRows(dataRows);
    setDateCol(g.dateIndex);
    setDescCol(g.descriptionIndex);
    if (g.debitIndex !== null || g.creditIndex !== null) {
      setAmountMode('split');
      setDebitCol(g.debitIndex);
      setCreditCol(g.creditIndex);
    } else {
      setAmountMode('single');
      setAmountCol(g.amountIndex);
    }
    setParseError('');
    setLabel(name ? name.replace(/\.[^.]+$/, '') : `Statement — ${new Date().toLocaleDateString('en-GB')}`);
    setStep('map');
  };

  const extractFromFile = async (fileBase64: string, mimeType: string, name: string) => {
    setIsExtracting(true);
    setParseError('');
    try {
      const res = await fetch('/api/statements/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileBase64, mimeType }),
      });
      const data = await res.json();
      if (data.status !== 'ok') {
        setParseError(data.message || 'Failed to read that file.');
        return;
      }
      const extracted: PreparedRow[] = (data.transactions || []).map(
        (t: { date: string; rawDescription: string; amount: number; direction: 'DEBIT' | 'CREDIT' }) => ({
          date: t.date,
          rawDescription: t.rawDescription,
          amount: t.amount,
          direction: t.direction,
        })
      );
      setAiRows(extracted);
      setHeaders([]);
      setRows([]);
      setLabel(name.replace(/\.[^.]+$/, '') || `Statement — ${new Date().toLocaleDateString('en-GB')}`);
      setStep('map');
    } catch {
      setParseError('Failed to read that file. Please try again.');
    } finally {
      setIsExtracting(false);
    }
  };

  const handleFile = (file: File) => {
    setFileName(file.name);
    setParseError('');

    const lowerName = file.name.toLowerCase();
    const isCsv = file.type === 'text/csv' || lowerName.endsWith('.csv');
    const isPdf = file.type === 'application/pdf' || lowerName.endsWith('.pdf');
    const isImage = file.type.startsWith('image/');

    if (isCsv) {
      const reader = new FileReader();
      reader.onload = () => loadText(String(reader.result || ''), file.name);
      reader.readAsText(file);
      return;
    }

    if (isPdf || isImage) {
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = String(reader.result || '');
        const base64 = dataUrl.split(',')[1] || '';
        const mimeType = file.type || (isPdf ? 'application/pdf' : 'image/png');
        void extractFromFile(base64, mimeType, file.name);
      };
      reader.readAsDataURL(file);
      return;
    }

    setParseError('Unsupported file type. Please upload a CSV, PDF, or photo/screenshot of your statement.');
  };

  const preparedRows: PreparedRow[] = useMemo(() => {
    if (aiRows) return aiRows;
    if (descCol === null) return [];
    const out: PreparedRow[] = [];
    for (const row of rows) {
      const rawDescription = (row[descCol] || '').trim();
      if (!rawDescription) continue;
      const date = dateCol !== null ? parseDateFlexible(row[dateCol] || '') : null;
      if (!date) continue;

      let amount: number | null = null;
      let direction: 'DEBIT' | 'CREDIT' = 'DEBIT';

      if (amountMode === 'single') {
        if (amountCol === null) continue;
        const raw = parseAmount(row[amountCol] || '');
        if (raw === null || raw === 0) continue;
        const isPositive = raw > 0;
        direction = (isPositive && positiveMeans === 'out') || (!isPositive && positiveMeans === 'in') ? 'DEBIT' : 'CREDIT';
        amount = Math.abs(raw);
      } else {
        const debitRaw = debitCol !== null ? parseAmount(row[debitCol] || '') : null;
        const creditRaw = creditCol !== null ? parseAmount(row[creditCol] || '') : null;
        if (debitRaw) {
          amount = Math.abs(debitRaw);
          direction = 'DEBIT';
        } else if (creditRaw) {
          amount = Math.abs(creditRaw);
          direction = 'CREDIT';
        } else {
          continue;
        }
      }

      if (amount === null) continue;
      out.push({ date, rawDescription, amount, direction });
    }
    return out;
  }, [aiRows, rows, dateCol, descCol, amountMode, amountCol, debitCol, creditCol, positiveMeans]);

  const canImport = aiRows !== null
    ? true
    : dateCol !== null && descCol !== null && (amountMode === 'single' ? amountCol !== null : debitCol !== null || creditCol !== null);

  const handleImport = async () => {
    if (preparedRows.length === 0) {
      setSubmitError("No valid rows found with the selected columns — double check your mapping.");
      return;
    }
    setIsSubmitting(true);
    setSubmitError('');
    try {
      const res = await fetch('/api/statements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          label,
          fileName,
          accountId: accountId || null,
          transactions: preparedRows.map((r) => ({ ...r, currency: householdCurrency })),
        }),
      });
      const data = await res.json();
      if (data.status !== 'ok') {
        setSubmitError(data.message || 'Failed to import statement.');
        return;
      }
      setImportId(data.import.id);
      setImportLabel(data.import.label);
      setImportAccount(accounts.find((a) => a.id === accountId) || null);
      setTransactions(data.transactions);
      setStep('review');
      onImported();
    } catch {
      setSubmitError('Failed to import statement. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resolveTx = async (txId: string, action: string, extra?: Record<string, unknown>) => {
    if (!importId) return;
    setBusyTxId(txId);
    try {
      const res = await fetch(`/api/statements/${importId}/transactions/${txId}/resolve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, learnAlias: true, ...extra }),
      });
      const data = await res.json();
      if (data.status === 'ok') {
        setTransactions((prev) => prev.map((t) => (t.id === txId ? data.transaction : t)));
        setLinkingTxId(null);
      }
    } finally {
      setBusyTxId(null);
    }
  };

  const toggleGroup = (key: string) => {
    setCollapsedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  };

  const resolveGroup = async (group: TxGroup, action: 'ignore' | 'log_transfer') => {
    setBusyGroupKey(group.key);
    try {
      const unmatched = group.items.filter((t) => t.status === 'UNMATCHED');
      await Promise.all(
        unmatched.map((tx) =>
          resolveTx(tx.id, action, action === 'log_transfer' ? { vendorName: tx.rawDescription } : undefined)
        )
      );
    } finally {
      setBusyGroupKey(null);
    }
  };

  if (!isOpen) return null;

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (isExtracting) return;
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  const filteredTransactions = transactions.filter((t) => {
    if (reviewFilter === 'all') return true;
    if (reviewFilter === 'matched') return t.status === 'MATCHED';
    if (reviewFilter === 'ignored') return t.status === 'IGNORED';
    return t.status === 'UNMATCHED';
  });

  const needsReviewCount = transactions.filter((t) => t.status === 'UNMATCHED').length;
  const matchedCount = transactions.filter((t) => t.status === 'MATCHED').length;
  const ignoredCount = transactions.filter((t) => t.status === 'IGNORED').length;

  const groupedTransactions: TxGroup[] = (() => {
    const map = new Map<string, StatementTransactionItem[]>();
    for (const tx of filteredTransactions) {
      const key = tx.normalizedDescription || tx.rawDescription;
      const arr = map.get(key);
      if (arr) arr.push(tx); else map.set(key, [tx]);
    }
    return Array.from(map.entries()).map(([key, items]) => ({ key, label: key, items }));
  })();

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: step === 'review' ? '760px' : '540px' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '1.1rem 1.5rem',
          borderBottom: '1px solid var(--ha-line)',
        }}>
          <div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--ha-ink)', lineHeight: 1.1 }}>
              {step === 'review' ? importLabel || 'Review statement' : 'Import a statement'}
            </h3>
            <p style={{ fontSize: '0.78rem', color: 'var(--ha-muted)', marginTop: '2px' }}>
              {step === 'upload' && 'Upload a bank or credit-card statement — CSV, PDF, or a photo — to cross-check against your bills.'}
              {step === 'map' && (aiRows ? `${aiRows.length} transaction${aiRows.length === 1 ? '' : 's'} found — check the details below before importing.` : `${rows.length} rows found — tell us which columns are which.`)}
              {step === 'review' && (importAccount ? `${importAccount.name}${importAccount.institution ? ` — ${importAccount.institution}` : ''} · Confirm matches, link forgotten payments, or ignore what you don't need.` : 'Confirm matches, link forgotten payments, or ignore what you don\'t need.')}
            </p>
          </div>
          <button onClick={handleClose} className="btn btn-ghost" style={{ padding: '0.35rem' }}>
            <X size={18} />
          </button>
        </div>

        <div style={{ padding: '1.25rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {step === 'upload' && (
            <>
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                onClick={() => !isExtracting && fileInputRef.current?.click()}
                style={{
                  border: '2px dashed var(--ha-line)',
                  borderRadius: 'var(--ha-radius-lg)',
                  padding: '2.5rem 1.5rem',
                  textAlign: 'center',
                  cursor: isExtracting ? 'default' : 'pointer',
                  backgroundColor: '#fafaf7',
                  opacity: isExtracting ? 0.75 : 1,
                }}
              >
                {isExtracting ? (
                  <>
                    <Loader2 size={30} color="var(--ha-muted)" className="spin" style={{ marginBottom: '0.6rem' }} />
                    <div style={{ fontWeight: 600, color: 'var(--ha-ink)', fontSize: '0.95rem' }}>
                      Reading your statement…
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--ha-muted)', marginTop: '0.35rem' }}>
                      This can take a few seconds for PDFs with lots of transactions
                    </div>
                  </>
                ) : (
                  <>
                    <FileSpreadsheet size={30} color="var(--ha-muted)" style={{ marginBottom: '0.6rem' }} />
                    <div style={{ fontWeight: 600, color: 'var(--ha-ink)', fontSize: '0.95rem' }}>
                      Drop a CSV, PDF, or photo here
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--ha-muted)', marginTop: '0.35rem' }}>
                      or click to choose a file — CSV works best, but a PDF export or a clear photo of a paper statement works too
                    </div>
                  </>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,text/csv,.pdf,application/pdf,image/*"
                  style={{ display: 'none' }}
                  disabled={isExtracting}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file && !isExtracting) handleFile(file);
                    e.target.value = '';
                  }}
                />
              </div>
              {parseError && (
                <div style={{
                  backgroundColor: 'var(--ha-red-tint)',
                  border: '1px solid var(--ha-red)',
                  borderRadius: 'var(--ha-radius-sm)',
                  padding: '0.75rem 1rem',
                  color: 'var(--ha-red)',
                  fontSize: '0.85rem',
                }}>
                  {parseError}
                </div>
              )}
            </>
          )}

          {step === 'map' && (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: accounts.length > 0 ? '1.4fr 1fr' : '1fr', gap: '1rem' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--ha-ink)', display: 'block', marginBottom: '0.3rem' }}>
                    Label for this import
                  </label>
                  <input className="ha-input" value={label} onChange={(e) => setLabel(e.target.value)} placeholder="e.g. AIB Credit Card — September" />
                </div>

                {accounts.length > 0 && (
                  <div>
                    <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--ha-ink)', display: 'block', marginBottom: '0.3rem' }}>
                      Which account is this?
                    </label>
                    <select className="ha-input" value={accountId} onChange={(e) => setAccountId(e.target.value)}>
                      <option value="">Not sure / mixed</option>
                      {accounts.map((a) => (
                        <option key={a.id} value={a.id}>{a.name}{a.institution ? ` — ${a.institution}` : ''}</option>
                      ))}
                    </select>
                    <p style={{ fontSize: '0.72rem', color: 'var(--ha-muted)', marginTop: '0.3rem' }}>
                      Helps matching stay accurate when you have more than one account.
                    </p>
                  </div>
                )}
              </div>

              {aiRows ? (
                <div style={{ fontSize: '0.8rem', color: 'var(--ha-muted)' }}>
                  <span><strong style={{ color: 'var(--ha-ink)' }}>{preparedRows.length}</strong> transaction{preparedRows.length === 1 ? '' : 's'} read from the file and ready to import.</span>
                </div>
              ) : (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div>
                      <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--ha-ink)', display: 'block', marginBottom: '0.3rem' }}>
                        Date column
                      </label>
                      <select className="ha-input" value={dateCol ?? ''} onChange={(e) => setDateCol(e.target.value === '' ? null : Number(e.target.value))}>
                        <option value="">— Select —</option>
                        {headers.map((h, i) => <option key={i} value={i}>{h || `Column ${i + 1}`}</option>)}
                      </select>
                    </div>
                    <div>
                      <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--ha-ink)', display: 'block', marginBottom: '0.3rem' }}>
                        Description column
                      </label>
                      <select className="ha-input" value={descCol ?? ''} onChange={(e) => setDescCol(e.target.value === '' ? null : Number(e.target.value))}>
                        <option value="">— Select —</option>
                        {headers.map((h, i) => <option key={i} value={i}>{h || `Column ${i + 1}`}</option>)}
                      </select>
                    </div>
                  </div>

                  <div>
                    <div style={{ display: 'flex', gap: '1rem', marginBottom: '0.5rem' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8rem', color: 'var(--ha-ink)', cursor: 'pointer' }}>
                        <input type="radio" checked={amountMode === 'single'} onChange={() => setAmountMode('single')} />
                        Single amount column
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8rem', color: 'var(--ha-ink)', cursor: 'pointer' }}>
                        <input type="radio" checked={amountMode === 'split'} onChange={() => setAmountMode('split')} />
                        Separate debit/credit columns
                      </label>
                    </div>

                    {amountMode === 'single' ? (
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <select className="ha-input" value={amountCol ?? ''} onChange={(e) => setAmountCol(e.target.value === '' ? null : Number(e.target.value))}>
                          <option value="">— Amount column —</option>
                          {headers.map((h, i) => <option key={i} value={i}>{h || `Column ${i + 1}`}</option>)}
                        </select>
                        <select className="ha-input" value={positiveMeans} onChange={(e) => setPositiveMeans(e.target.value as 'out' | 'in')}>
                          <option value="out">Positive = money out</option>
                          <option value="in">Positive = money in</option>
                        </select>
                      </div>
                    ) : (
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <select className="ha-input" value={debitCol ?? ''} onChange={(e) => setDebitCol(e.target.value === '' ? null : Number(e.target.value))}>
                          <option value="">— Debit (out) column —</option>
                          {headers.map((h, i) => <option key={i} value={i}>{h || `Column ${i + 1}`}</option>)}
                        </select>
                        <select className="ha-input" value={creditCol ?? ''} onChange={(e) => setCreditCol(e.target.value === '' ? null : Number(e.target.value))}>
                          <option value="">— Credit (in) column —</option>
                          {headers.map((h, i) => <option key={i} value={i}>{h || `Column ${i + 1}`}</option>)}
                        </select>
                      </div>
                    )}
                  </div>

                  <div style={{ fontSize: '0.8rem', color: 'var(--ha-muted)' }}>
                    {canImport ? (
                      <span><strong style={{ color: 'var(--ha-ink)' }}>{preparedRows.length}</strong> of {rows.length} rows look valid and ready to import.</span>
                    ) : (
                      'Select the columns above to preview how many rows will import.'
                    )}
                  </div>
                </>
              )}

              {canImport && preparedRows.length > 0 && (
                <div style={{ border: '1px solid var(--ha-line)', borderRadius: 'var(--ha-radius-md)', overflow: 'hidden' }}>
                  {preparedRows.slice(0, 4).map((r, i) => (
                    <div key={i} style={{
                      display: 'flex', justifyContent: 'space-between', gap: '0.75rem',
                      padding: '0.5rem 0.75rem', fontSize: '0.78rem',
                      borderBottom: i < 3 ? '1px solid var(--ha-line)' : 'none',
                      backgroundColor: '#fafaf7',
                    }}>
                      <span style={{ color: 'var(--ha-muted)', flexShrink: 0 }}>{r.date}</span>
                      <span style={{ color: 'var(--ha-ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{r.rawDescription}</span>
                      <span style={{ color: r.direction === 'DEBIT' ? 'var(--ha-red)' : 'var(--ha-blue)', fontWeight: 600, flexShrink: 0 }}>
                        {r.direction === 'DEBIT' ? '−' : '+'}{formatCurrency(r.amount, householdCurrency)}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {submitError && (
                <div style={{
                  backgroundColor: 'var(--ha-red-tint)', border: '1px solid var(--ha-red)',
                  borderRadius: 'var(--ha-radius-sm)', padding: '0.75rem 1rem', color: 'var(--ha-red)', fontSize: '0.85rem',
                }}>
                  {submitError}
                </div>
              )}

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'space-between' }}>
                <button
                  onClick={() => { setAiRows(null); setHeaders([]); setRows([]); setStep('upload'); }}
                  className="btn btn-secondary"
                  style={{ fontSize: '0.85rem' }}
                >
                  <ArrowLeft size={14} />
                  Back
                </button>
                <button
                  onClick={handleImport}
                  disabled={!canImport || preparedRows.length === 0 || isSubmitting}
                  className="btn btn-primary"
                  style={{ fontSize: '0.85rem' }}
                >
                  {isSubmitting ? <Loader2 size={15} className="spin" /> : <Upload size={15} />}
                  {isSubmitting ? 'Importing…' : `Import ${preparedRows.length} transactions`}
                </button>
              </div>
            </>
          )}

          {step === 'review' && (
            <>
              {isLoadingReview ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '2rem', justifyContent: 'center', color: 'var(--ha-muted)' }}>
                  <Loader2 size={16} className="spin" /> Loading…
                </div>
              ) : (
                <>
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    {FILTERS.map((f) => {
                      const count = f.id === 'needs_review' ? needsReviewCount : f.id === 'matched' ? matchedCount : f.id === 'ignored' ? ignoredCount : transactions.length;
                      const active = reviewFilter === f.id;
                      return (
                        <button
                          key={f.id}
                          onClick={() => setReviewFilter(f.id)}
                          className="ha-chip"
                          style={{
                            fontSize: '0.78rem',
                            backgroundColor: active ? 'var(--ha-blue)' : 'var(--ha-white)',
                            color: active ? 'var(--ha-white)' : 'var(--ha-ink)',
                            border: '1px solid var(--ha-line)',
                            cursor: 'pointer',
                          }}
                        >
                          {f.label} <span style={{ opacity: 0.75 }}>({count})</span>
                        </button>
                      );
                    })}
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem', maxHeight: '440px', overflowY: 'auto' }}>
                    {filteredTransactions.length === 0 && (
                      <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--ha-muted)', fontSize: '0.85rem' }}>
                        Nothing here.
                      </div>
                    )}

                    {groupedTransactions.map((group) => {
                      const isMultiple = group.items.length > 1;
                      const isCollapsed = isMultiple && collapsedGroups.has(group.key);
                      const isGroupBusy = busyGroupKey === group.key;
                      const groupHasUnmatched = group.items.some((t) => t.status === 'UNMATCHED');
                      const groupTotal = group.items.reduce(
                        (sum, t) => sum + (t.direction === 'DEBIT' ? -t.amount : t.amount),
                        0
                      );
                      const groupCurrency = group.items[0].currency;

                      return (
                        <div key={group.key} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                          {isMultiple && (
                            <div
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                gap: '0.5rem',
                                padding: '0.45rem 0.75rem',
                                borderRadius: 'var(--ha-radius-sm)',
                                backgroundColor: '#f0f0ec',
                                flexWrap: 'wrap',
                              }}
                            >
                              <button
                                onClick={() => toggleGroup(group.key)}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '0.4rem',
                                  background: 'none',
                                  border: 'none',
                                  cursor: 'pointer',
                                  fontSize: '0.8rem',
                                  fontWeight: 700,
                                  color: 'var(--ha-ink)',
                                  padding: 0,
                                  minWidth: 0,
                                }}
                              >
                                {isCollapsed ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
                                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{group.label}</span>
                                <span style={{ fontWeight: 500, color: 'var(--ha-muted)', flexShrink: 0 }}>× {group.items.length}</span>
                              </button>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
                                <span
                                  className="tabular-nums"
                                  style={{ fontSize: '0.82rem', fontWeight: 700, color: groupTotal < 0 ? 'var(--ha-red)' : 'var(--ha-blue)' }}
                                >
                                  {groupTotal < 0 ? '−' : '+'}{formatCurrency(Math.abs(groupTotal), groupCurrency)}
                                </span>
                                {groupHasUnmatched && (
                                  <>
                                    <button
                                      disabled={isGroupBusy}
                                      onClick={() => resolveGroup(group, 'log_transfer')}
                                      className="btn btn-secondary"
                                      style={{ fontSize: '0.72rem', padding: '0.3rem 0.5rem' }}
                                    >
                                      {isGroupBusy ? <Loader2 size={11} className="spin" /> : <PlusCircle size={11} />} Log all
                                    </button>
                                    <button
                                      disabled={isGroupBusy}
                                      onClick={() => resolveGroup(group, 'ignore')}
                                      className="btn btn-ghost"
                                      style={{ fontSize: '0.72rem', padding: '0.3rem 0.5rem' }}
                                    >
                                      <EyeOff size={11} /> Ignore all
                                    </button>
                                  </>
                                )}
                              </div>
                            </div>
                          )}

                          {!isCollapsed && group.items.map((tx) => {
                      const isBusy = busyTxId === tx.id;
                      const isRecurringFlag = !!tx.notes?.startsWith('Appears more than once');
                      return (
                        <div key={tx.id} style={{
                          border: '1px solid var(--ha-line)',
                          borderRadius: 'var(--ha-radius-md)',
                          padding: '0.75rem 0.9rem',
                          backgroundColor: tx.status === 'MATCHED' ? 'var(--ha-blue-light)' : tx.status === 'IGNORED' ? '#f4f4f2' : isRecurringFlag ? '#fdf2e3' : '#fafaf7',
                          opacity: isBusy ? 0.6 : 1,
                        }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.75rem' }}>
                            <div style={{ minWidth: 0 }}>
                              <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--ha-ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {tx.rawDescription}
                              </div>
                              <div style={{ fontSize: '0.75rem', color: 'var(--ha-muted)', marginTop: '2px' }}>
                                {tx.date}
                                {tx.notes && <span> • {tx.notes}</span>}
                              </div>
                            </div>
                            <div style={{ textAlign: 'right', flexShrink: 0 }}>
                              <div className="tabular-nums" style={{ fontSize: '0.95rem', fontWeight: 700, color: tx.direction === 'DEBIT' ? 'var(--ha-red)' : 'var(--ha-blue)' }}>
                                {tx.direction === 'DEBIT' ? '−' : '+'}{formatCurrency(tx.amount, tx.currency)}
                              </div>
                            </div>
                          </div>

                          {tx.status === 'MATCHED' && (
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', marginTop: '0.5rem' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.78rem', color: 'var(--ha-blue)', fontWeight: 600 }}>
                                <CheckCircle2 size={13} />
                                {tx.matchedExpense ? `Matched: ${tx.matchedExpense.name}` : tx.matchedTransfer ? `Logged: ${tx.matchedTransfer.externalLabel || 'one-off payment'}` : 'Matched'}
                              </div>
                              <button
                                disabled={isBusy}
                                onClick={() => resolveTx(tx.id, 'reset')}
                                className="btn btn-ghost"
                                style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                              >
                                <RotateCcw size={12} /> Undo
                              </button>
                            </div>
                          )}

                          {tx.status === 'IGNORED' && (
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', marginTop: '0.5rem' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.78rem', color: 'var(--ha-muted)' }}>
                                <EyeOff size={13} /> Ignored
                              </div>
                              <button
                                disabled={isBusy}
                                onClick={() => resolveTx(tx.id, 'reset')}
                                className="btn btn-ghost"
                                style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                              >
                                <RotateCcw size={12} /> Undo
                              </button>
                            </div>
                          )}

                          {tx.status === 'UNMATCHED' && (
                            <div style={{ marginTop: '0.6rem' }}>
                              {isRecurringFlag && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.75rem', color: '#B45309', fontWeight: 600, marginBottom: '0.4rem' }}>
                                  <AlertTriangle size={12} /> Recurring but untracked
                                </div>
                              )}

                              {tx.matchedExpense && (
                                <div style={{ fontSize: '0.78rem', color: 'var(--ha-ink)', marginBottom: '0.4rem' }}>
                                  Possible match: <strong>{tx.matchedExpense.name}</strong>
                                  {typeof tx.matchConfidence === 'number' && <span style={{ color: 'var(--ha-muted)' }}> ({Math.round(tx.matchConfidence * 100)}% confident)</span>}
                                </div>
                              )}

                              {linkingTxId === tx.id ? (
                                <div style={{ display: 'flex', gap: '0.4rem' }}>
                                  <select
                                    className="ha-input"
                                    style={{ fontSize: '0.78rem', padding: '0.4rem 0.6rem' }}
                                    value={selectedExpenseId[tx.id] || ''}
                                    onChange={(e) => setSelectedExpenseId((prev) => ({ ...prev, [tx.id]: e.target.value }))}
                                  >
                                    <option value="">— Choose a bill —</option>
                                    {expenses.map((ex) => <option key={ex.id} value={ex.id}>{ex.name}</option>)}
                                  </select>
                                  <button
                                    disabled={!selectedExpenseId[tx.id] || isBusy}
                                    onClick={() => resolveTx(tx.id, 'link_expense', { expenseId: selectedExpenseId[tx.id] })}
                                    className="btn btn-primary"
                                    style={{ fontSize: '0.75rem', padding: '0.4rem 0.6rem' }}
                                  >
                                    Link
                                  </button>
                                  <button onClick={() => setLinkingTxId(null)} className="btn btn-ghost" style={{ fontSize: '0.75rem', padding: '0.4rem 0.5rem' }}>
                                    Cancel
                                  </button>
                                </div>
                              ) : (
                                <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                                  {tx.matchedExpense && (
                                    <button
                                      disabled={isBusy}
                                      onClick={() => resolveTx(tx.id, 'confirm')}
                                      className="btn btn-primary"
                                      style={{ fontSize: '0.75rem', padding: '0.4rem 0.6rem' }}
                                    >
                                      {isBusy ? <Loader2 size={12} className="spin" /> : <CheckCircle2 size={12} />} Confirm match
                                    </button>
                                  )}
                                  <button
                                    disabled={isBusy}
                                    onClick={() => setLinkingTxId(tx.id)}
                                    className="btn btn-secondary"
                                    style={{ fontSize: '0.75rem', padding: '0.4rem 0.6rem' }}
                                  >
                                    <Link2 size={12} /> Link to a bill
                                  </button>
                                  <button
                                    disabled={isBusy}
                                    onClick={() => resolveTx(tx.id, 'log_transfer', { vendorName: tx.rawDescription })}
                                    className="btn btn-secondary"
                                    style={{ fontSize: '0.75rem', padding: '0.4rem 0.6rem' }}
                                  >
                                    <PlusCircle size={12} /> Log as one-off
                                  </button>
                                  <button
                                    disabled={isBusy}
                                    onClick={() => resolveTx(tx.id, 'ignore')}
                                    className="btn btn-ghost"
                                    style={{ fontSize: '0.75rem', padding: '0.4rem 0.6rem' }}
                                  >
                                    <EyeOff size={12} /> Ignore
                                  </button>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                          })}
                        </div>
                      );
                    })}
                  </div>
                </>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button onClick={handleClose} className="btn btn-secondary" style={{ fontSize: '0.85rem' }}>
                  Done
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
