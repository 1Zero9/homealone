import React, { useCallback, useRef, useState } from 'react';
import { X, ScanLine, Upload, CheckCircle2, Sparkles } from 'lucide-react';
import type { ExpenseItem, ExpenseCategory, BillingCycle, CurrencyCode } from '../types/expense';
import { CATEGORIES } from '../data/categories';
import { formatCurrency } from '../utils/formatters';

interface ReceiptScanResult {
  vendor: string;
  amount: number | null;
  currency: string | null;
  date: string | null;
  billingCycleGuess: BillingCycle | null;
  categoryGuess: string | null;
  isPaid: boolean;
  matchedName: string | null;
  notes: string | null;
}

interface ScanReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUseMatch: (mergedExpense: ExpenseItem) => void;
  onUseNew: (draft: Partial<ExpenseItem>) => void;
  initialImage?: { dataUrl: string; base64: string; mimeType: string } | null;
}

const VALID_CATEGORIES: ExpenseCategory[] = ['entertainment', 'ai-tech', 'utilities', 'housing', 'education', 'lifestyle', 'shopping'];
const VALID_CURRENCIES: CurrencyCode[] = ['EUR', 'GBP', 'USD', 'CAD', 'AUD', 'JPY'];

export const ScanReceiptModal: React.FC<ScanReceiptModalProps> = ({
  isOpen,
  onClose,
  onUseMatch,
  onUseNew,
  initialImage,
}) => {
  const [image, setImage] = useState<{ dataUrl: string; base64: string; mimeType: string } | null>(initialImage || null);
  const [isDragging, setIsDragging] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<{ extracted: ReceiptScanResult; matchedExpense: ExpenseItem | null } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scannedRef = useRef(false);

  const reset = useCallback(() => {
    setImage(null);
    setIsScanning(false);
    setError('');
    setResult(null);
    scannedRef.current = false;
  }, []);

  const handleClose = () => {
    reset();
    onClose();
  };

  const scanImage = useCallback(async (img: { dataUrl: string; base64: string; mimeType: string }) => {
    setIsScanning(true);
    setError('');
    setResult(null);
    try {
      const res = await fetch('/api/assistant/scan-receipt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: img.base64, mimeType: img.mimeType }),
      });
      const data = await res.json();
      if (data.status !== 'ok') {
        setError(data.message || 'Failed to read that image.');
        return;
      }
      setResult({ extracted: data.extracted, matchedExpense: data.matchedExpense });
    } catch {
      setError('Failed to read that image. Please try again.');
    } finally {
      setIsScanning(false);
    }
  }, []);

  const loadFile = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Please use an image file (screenshot or photo).');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const base64 = dataUrl.split(',')[1] || '';
      const img = { dataUrl, base64, mimeType: file.type };
      setImage(img);
      scanImage(img);
    };
    reader.readAsDataURL(file);
  }, [scanImage]);

  React.useEffect(() => {
    if (isOpen && initialImage && !scannedRef.current) {
      scannedRef.current = true;
      setImage(initialImage);
      scanImage(initialImage);
    }
  }, [isOpen, initialImage, scanImage]);

  if (!isOpen) return null;

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) loadFile(file);
  };

  const handleUseMatch = () => {
    if (!result?.matchedExpense) return;
    const { extracted, matchedExpense } = result;
    onUseMatch({
      ...matchedExpense,
      vendor: matchedExpense.vendor || extracted.vendor,
      amount: extracted.amount ?? matchedExpense.amount,
      currency: (extracted.currency as CurrencyCode) && VALID_CURRENCIES.includes(extracted.currency as CurrencyCode)
        ? (extracted.currency as CurrencyCode)
        : matchedExpense.currency,
      nextRenewalDate: extracted.date || matchedExpense.nextRenewalDate,
      isPaidThisCycle: extracted.isPaid || matchedExpense.isPaidThisCycle,
    });
    handleClose();
  };

  const handleUseNew = () => {
    if (!result) return;
    const { extracted } = result;
    onUseNew({
      name: extracted.vendor,
      vendor: extracted.vendor,
      amount: extracted.amount ?? undefined,
      currency: VALID_CURRENCIES.includes(extracted.currency as CurrencyCode) ? (extracted.currency as CurrencyCode) : 'EUR',
      billingCycle: extracted.billingCycleGuess || 'monthly',
      category: VALID_CATEGORIES.includes(extracted.categoryGuess as ExpenseCategory) ? (extracted.categoryGuess as ExpenseCategory) : 'utilities',
      nextRenewalDate: extracted.date || undefined,
      isPaidThisCycle: extracted.isPaid,
      notes: extracted.notes || undefined,
    });
    handleClose();
  };

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '520px' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '1.25rem 1.5rem',
          borderBottom: '1px solid var(--ha-line)',
        }}>
          <div>
            <h3 style={{ fontSize: '1.35rem', fontWeight: 700, color: 'var(--ha-ink)', lineHeight: 1.1 }}>
              Scan a bill
            </h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--ha-muted)', marginTop: '2px' }}>
              Paste, drop, or upload a screenshot — Tally will read it for you
            </p>
          </div>
          <button onClick={handleClose} className="btn btn-ghost" style={{ padding: '0.35rem' }}>
            <X size={18} />
          </button>
        </div>

        <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
          {!image && (
            <div
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              style={{
                border: `2px dashed ${isDragging ? 'var(--ha-blue)' : 'var(--ha-line)'}`,
                borderRadius: 'var(--ha-radius-lg)',
                padding: '2.5rem 1.5rem',
                textAlign: 'center',
                cursor: 'pointer',
                backgroundColor: isDragging ? 'var(--ha-blue-light)' : '#fafaf7',
                transition: 'all 0.15s ease',
              }}
            >
              <ScanLine size={30} color="var(--ha-muted)" style={{ marginBottom: '0.6rem' }} />
              <div style={{ fontWeight: 600, color: 'var(--ha-ink)', fontSize: '0.95rem' }}>
                Drop a screenshot here, or paste with ⌘V / Ctrl+V
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--ha-muted)', marginTop: '0.35rem' }}>
                or click to choose a file
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) loadFile(file);
                }}
              />
            </div>
          )}

          {image && (
            <div style={{
              borderRadius: 'var(--ha-radius-md)',
              overflow: 'hidden',
              border: '1px solid var(--ha-line)',
              maxHeight: '200px',
              display: 'flex',
              justifyContent: 'center',
              backgroundColor: '#fafaf7',
            }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={image.dataUrl} alt="Scanned bill" style={{ maxHeight: '200px', objectFit: 'contain' }} />
            </div>
          )}

          {isScanning && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.75rem', color: 'var(--ha-muted)', fontSize: '0.85rem' }}>
              <Sparkles size={16} className="spin" />
              Reading your screenshot…
            </div>
          )}

          {error && (
            <div style={{
              backgroundColor: 'var(--ha-red-tint)',
              border: '1px solid var(--ha-red)',
              borderRadius: 'var(--ha-radius-sm)',
              padding: '0.75rem 1rem',
              color: 'var(--ha-red)',
              fontSize: '0.85rem',
            }}>
              {error}
            </div>
          )}

          {result && !isScanning && (
            <div style={{
              border: '1px solid var(--ha-line)',
              borderRadius: 'var(--ha-radius-md)',
              padding: '1rem 1.1rem',
              backgroundColor: result.matchedExpense ? 'var(--ha-blue-light)' : '#fafaf7',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <CheckCircle2 size={16} color="var(--ha-blue)" />
                <span style={{ fontWeight: 700, color: 'var(--ha-ink)', fontSize: '0.9rem' }}>
                  {result.matchedExpense ? `Looks like "${result.matchedExpense.name}"` : `New bill detected: "${result.extracted.vendor}"`}
                </span>
              </div>
              <div style={{ fontSize: '0.82rem', color: 'var(--ha-muted)', display: 'flex', flexDirection: 'column', gap: '0.2rem', marginBottom: '0.85rem' }}>
                {result.extracted.amount != null && (
                  <span>Amount: <strong style={{ color: 'var(--ha-ink)' }}>{formatCurrency(result.extracted.amount, (result.extracted.currency as CurrencyCode) || 'EUR')}</strong></span>
                )}
                {result.extracted.date && <span>Date: {result.extracted.date}</span>}
                {result.extracted.categoryGuess && <span>Category guess: {CATEGORIES[result.extracted.categoryGuess as ExpenseCategory]?.name || result.extracted.categoryGuess}</span>}
                <span>{result.extracted.isPaid ? 'Detected as already paid' : 'Detected as not yet paid'}</span>
                {result.extracted.notes && <span style={{ fontStyle: 'italic' }}>{result.extracted.notes}</span>}
              </div>

              {result.matchedExpense ? (
                <button onClick={handleUseMatch} className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
                  Review & update &quot;{result.matchedExpense.name}&quot;
                </button>
              ) : (
                <button onClick={handleUseNew} className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
                  Review & add as new expense
                </button>
              )}
            </div>
          )}

          {image && !isScanning && (
            <button
              onClick={() => { reset(); }}
              className="btn btn-secondary"
              style={{ alignSelf: 'flex-start', fontSize: '0.8rem' }}
            >
              <Upload size={13} />
              Try a different image
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
