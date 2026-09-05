import React, { useEffect, useState } from 'react';
import { FileSpreadsheet, X, ArrowRight } from 'lucide-react';
import type { StatementImportSummary } from '../types/expense';

const SNOOZE_STORAGE_KEY = 'tally_statement_reminder_snoozed_until';
const REMIND_AFTER_DAYS = 30;
const SNOOZE_DAYS = 14;

interface StatementReminderBannerProps {
  onOpenStatements: () => void;
}

/**
 * In-app nudge to import the latest bank/card statement — this is meant to
 * be a monthly task, but nothing else in the app prompts for it, so it's
 * easy to forget and end up with an out-of-date reconciliation. Shows once
 * the most recent import (across all accounts) is more than
 * REMIND_AFTER_DAYS old, or none has ever been done. Dismissing snoozes it
 * for SNOOZE_DAYS rather than hiding it for good, since this is meant to
 * recur every cycle.
 */
export const StatementReminderBanner: React.FC<StatementReminderBannerProps> = ({ onOpenStatements }) => {
  const [visible, setVisible] = useState(false);
  const [daysSince, setDaysSince] = useState<number | null>(null);

  useEffect(() => {
    let snoozedUntil = 0;
    try {
      snoozedUntil = Number(window.localStorage.getItem(SNOOZE_STORAGE_KEY)) || 0;
    } catch {}
    if (Date.now() < snoozedUntil) return;

    fetch('/api/statements')
      .then((res) => res.json())
      .then((data) => {
        if (data.status !== 'ok' || !Array.isArray(data.imports)) return;
        const imports: StatementImportSummary[] = data.imports;
        if (imports.length === 0) {
          setDaysSince(null);
          setVisible(true);
          return;
        }
        const mostRecent = Math.max(...imports.map((i) => new Date(i.createdAt).getTime()));
        const days = Math.floor((Date.now() - mostRecent) / (1000 * 60 * 60 * 24));
        if (days >= REMIND_AFTER_DAYS) {
          setDaysSince(days);
          setVisible(true);
        }
      })
      .catch(() => {});
  }, []);

  const dismiss = () => {
    try {
      window.localStorage.setItem(SNOOZE_STORAGE_KEY, String(Date.now() + SNOOZE_DAYS * 24 * 60 * 60 * 1000));
    } catch {}
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      className="ha-card"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '1rem',
        padding: '0.9rem 1.25rem',
        marginBottom: '1.5rem',
        backgroundColor: '#eef2ff',
        border: '1px solid #c7d2fe',
      }}
    >
      <button
        onClick={onOpenStatements}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          minWidth: 0,
          background: 'none',
          border: 'none',
          padding: 0,
          cursor: 'pointer',
          textAlign: 'left',
          flex: 1,
        }}
      >
        <FileSpreadsheet size={18} color="#4338CA" style={{ flexShrink: 0 }} />
        <span style={{ fontSize: '0.85rem', color: '#3730A3', minWidth: 0 }}>
          {daysSince === null ? (
            <>No statements imported yet — <strong>import one</strong> to catch missed bills and untracked spending.</>
          ) : (
            <>It&apos;s been <strong>{daysSince} days</strong> since your last statement import — worth uploading the latest one.</>
          )}
        </span>
        <ArrowRight size={15} color="#4338CA" style={{ flexShrink: 0, marginLeft: 'auto' }} />
      </button>
      <button
        onClick={dismiss}
        className="btn btn-ghost"
        style={{ padding: '0.3rem', flexShrink: 0, color: '#4338CA' }}
        title="Remind me again in two weeks"
      >
        <X size={15} />
      </button>
    </div>
  );
};
