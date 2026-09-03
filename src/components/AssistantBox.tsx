import React, { useState } from 'react';
import type { CurrencyCode } from '../types/expense';
import { formatCurrency, formatDate } from '../utils/formatters';
import { getErrorMessage } from '../lib/errors';
import { Sparkles, Search, Loader2, HelpCircle } from 'lucide-react';

interface InsightsData {
  monthlyTotal: number;
  annualTotal: number;
  activeCount: number;
  pausedCount: number;
  pausedMonthlySavings: number;
  next7Days: { id: string; name: string; amount: number; currency: CurrencyCode; dueDate: string; daysUntil: number; paymentMethod: string }[];
  next7DaysTotal: number;
  next30Days: { id: string; name: string; amount: number; currency: CurrencyCode; dueDate: string; daysUntil: number; paymentMethod: string }[];
  next30DaysTotal: number;
  topCategory: { name: string; monthlyAmount: number; percentage: number } | null;
  potentialAnnualSavings: number;
  annualOpportunities: { id: string; name: string; monthlyAmount: number; estAnnualSavings: number }[];
  monthlyIncome: number;
  netMonthly: number;
  hasIncome: boolean;
}

interface AnswerContent {
  title: string;
  lines: string[];
}

interface AssistantBoxProps {
  currency: CurrencyCode;
  hasData?: boolean;
}

const QUICK_ACTIONS: { id: string; label: string }[] = [
  { id: 'this-month', label: "This month's spend" },
  { id: 'week', label: 'Going out this week' },
  { id: 'month-ahead', label: 'Going out next 30 days' },
  { id: 'save', label: 'Where can I save' },
  { id: 'cashflow', label: 'Money in vs money out' },
];

const HELP_QUICK_ACTIONS: { id: string; label: string; question: string }[] = [
  { id: 'help-statement', label: 'How do I import a statement?', question: 'How do I import a bank or credit-card statement?' },
  { id: 'help-assign', label: 'How do I assign a bill to someone?', question: 'How do I assign a bill to a household member?' },
  { id: 'help-account', label: 'How do I add an account?', question: 'How do I add an account?' },
];

export const AssistantBox: React.FC<AssistantBoxProps> = ({ currency, hasData = true }) => {
  const [question, setQuestion] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [answer, setAnswer] = useState<AnswerContent | null>(null);
  const [isFocused, setIsFocused] = useState(false);

  const isExpanded = isFocused || !!question || !!answer || !!errorMessage || isLoading;

  const fetchInsights = async (): Promise<InsightsData> => {
    const res = await fetch('/api/insights/summary');
    const data = await res.json();
    if (data.status !== 'ok') {
      throw new Error(data.message || 'Failed to load insights');
    }
    return data.insights as InsightsData;
  };

  const runQuickAction = async (actionId: string) => {
    setIsLoading(true);
    setErrorMessage(null);
    setAnswer(null);
    try {
      const insights = await fetchInsights();

      if (actionId === 'this-month') {
        setAnswer({
          title: "This month's spend",
          lines: [
            `${formatCurrency(insights.monthlyTotal, currency)}/month across ${insights.activeCount} active bill${insights.activeCount === 1 ? '' : 's'}.`,
            `That's roughly ${formatCurrency(insights.annualTotal, currency)}/year.`,
            insights.topCategory
              ? `Biggest category: ${insights.topCategory.name} at ${formatCurrency(insights.topCategory.monthlyAmount, currency)}/mo (${insights.topCategory.percentage}%).`
              : '',
          ].filter(Boolean),
        });
      } else if (actionId === 'week') {
        setAnswer({
          title: insights.next7Days.length
            ? `${formatCurrency(insights.next7DaysTotal, currency)} going out this week`
            : 'Nothing going out this week',
          lines: insights.next7Days.length
            ? insights.next7Days.map((d) => `${d.name} — ${formatCurrency(d.amount, d.currency)} in ${d.daysUntil === 0 ? 'today' : `${d.daysUntil} day${d.daysUntil === 1 ? '' : 's'}`} (${d.paymentMethod})`)
            : ['Nothing scheduled to go out in the next 7 days.'],
        });
      } else if (actionId === 'month-ahead') {
        setAnswer({
          title: insights.next30Days.length
            ? `${formatCurrency(insights.next30DaysTotal, currency)} going out over the next 30 days`
            : 'Nothing going out in the next 30 days',
          lines: insights.next30Days.length
            ? insights.next30Days.map((d) => `${d.name} — ${formatCurrency(d.amount, d.currency)} on ${formatDate(d.dueDate)} (${d.paymentMethod})`)
            : ['Nothing scheduled for the next 30 days.'],
        });
      } else if (actionId === 'save') {
        setAnswer({
          title: insights.annualOpportunities.length
            ? `Up to ${formatCurrency(insights.potentialAnnualSavings, currency)}/year possible`
            : 'No obvious savings found',
          lines: insights.annualOpportunities.length
            ? [
                'Switching these monthly plans to annual billing could save around 2 months a year:',
                ...insights.annualOpportunities.slice(0, 5).map((o) => `${o.name} — ~${formatCurrency(o.estAnnualSavings, currency)}/year saved`),
              ]
            : ['Nothing stood out as an easy switch right now.'],
        });
      } else if (actionId === 'cashflow') {
        setAnswer({
          title: insights.hasIncome
            ? `${insights.netMonthly >= 0 ? '+' : ''}${formatCurrency(insights.netMonthly, currency)}/month net`
            : 'No income recorded yet',
          lines: insights.hasIncome
            ? [
                `Money in: ${formatCurrency(insights.monthlyIncome, currency)}/mo.`,
                `Money out: ${formatCurrency(insights.monthlyTotal, currency)}/mo.`,
                insights.netMonthly >= 0
                  ? `You're running a surplus of ${formatCurrency(insights.netMonthly, currency)}/month.`
                  : `You're running a shortfall of ${formatCurrency(Math.abs(insights.netMonthly), currency)}/month.`,
              ]
            : ['Add income sources on the Income tab to see your full money in vs money out picture.'],
        });
      }
    } catch (err: unknown) {
      setErrorMessage(getErrorMessage(err, 'Something went wrong loading that'));
    } finally {
      setIsLoading(false);
    }
  };

  const askQuestion = async (text: string) => {
    if (!text.trim() || isLoading) return;

    setIsLoading(true);
    setErrorMessage(null);
    setAnswer(null);

    try {
      const res = await fetch('/api/assistant/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: text.trim() }),
      });
      const data = await res.json();
      if (data.status !== 'ok') {
        throw new Error(data.message || 'Failed to get an answer');
      }
      setAnswer({ title: text.trim(), lines: [data.answer] });
    } catch (err: unknown) {
      setErrorMessage(getErrorMessage(err, 'Failed to get an answer'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleAsk = (e: React.FormEvent) => {
    e.preventDefault();
    askQuestion(question);
  };

  const runHelpAction = (helpQuestion: string) => {
    setQuestion(helpQuestion);
    askQuestion(helpQuestion);
  };

  return (
    <div
      style={{ width: '100%' }}
      onFocus={() => setIsFocused(true)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) {
          setIsFocused(false);
        }
      }}
    >
      <form onSubmit={handleAsk} style={{ position: 'relative', marginBottom: '0.85rem' }}>
        <Search size={17} color="var(--ha-muted)" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
        <input
          id="ask-tally-input"
          type="text"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder={hasData ? 'Ask about your spending, or how to use Tally...' : 'Ask how to use Tally...'}
          className="ha-input"
          style={{
            width: '100%',
            padding: '0.9rem 1rem 0.9rem 2.6rem',
            fontSize: '0.95rem',
            borderRadius: 'var(--ha-radius-md)',
          }}
        />
        {isLoading && (
          <Loader2 size={17} className="spin" color="var(--ha-muted)" style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
        )}
      </form>

      <div style={{ display: hasData && isExpanded ? 'flex' : 'none', flexWrap: 'wrap', gap: '0.5rem', justifyContent: 'center' }}>
        {QUICK_ACTIONS.map((action) => (
          <button
            key={action.id}
            type="button"
            onClick={() => runQuickAction(action.id)}
            disabled={isLoading}
            className="btn btn-secondary"
            style={{ fontSize: '0.8rem', padding: '0.45rem 0.85rem' }}
          >
            <Sparkles size={13} color="var(--ha-blue)" />
            <span>{action.label}</span>
          </button>
        ))}
      </div>

      <div style={{ display: isExpanded ? 'flex' : 'none', flexWrap: 'wrap', gap: '0.5rem', justifyContent: 'center', marginTop: hasData ? '0.5rem' : 0, marginBottom: answer || errorMessage ? '1.25rem' : 0 }}>
        {HELP_QUICK_ACTIONS.map((action) => (
          <button
            key={action.id}
            type="button"
            onClick={() => runHelpAction(action.question)}
            disabled={isLoading}
            className="btn btn-secondary"
            style={{ fontSize: '0.8rem', padding: '0.45rem 0.85rem' }}
          >
            <HelpCircle size={13} color="var(--ha-muted)" />
            <span>{action.label}</span>
          </button>
        ))}
      </div>

      {errorMessage && (
        <div className="ha-card" style={{
          padding: '0.85rem 1rem',
          fontSize: '0.85rem',
          color: 'var(--ha-red)',
          backgroundColor: 'var(--ha-red-tint)',
          border: '1px solid var(--ha-red)',
        }}>
          {errorMessage}
        </div>
      )}

      {answer && (
        <div className="ha-card" style={{ padding: '1.1rem 1.25rem' }}>
          <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--ha-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.5rem' }}>
            {answer.title}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            {answer.lines.map((line, idx) => (
              <p key={idx} style={{ fontSize: '0.9rem', color: 'var(--ha-ink)', lineHeight: 1.5, margin: 0 }}>
                {line}
              </p>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
