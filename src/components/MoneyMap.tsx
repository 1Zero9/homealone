import React, { useMemo, useState } from 'react';
import type { ExpenseItem, IncomeItem, AccountItem, CurrencyCode } from '../types/expense';
import { convertCurrency, getMonthlyEquivalent } from '../utils/calculations';
import { formatCurrency } from '../utils/formatters';
import { CATEGORIES } from '../data/categories';
import { Activity, Landmark } from 'lucide-react';

interface MoneyMapProps {
  incomes: IncomeItem[];
  expenses: ExpenseItem[];
  accounts: AccountItem[];
  currency: CurrencyCode;
}

interface FlowNode {
  id: string;
  label: string;
  sublabel?: string;
  monthlyTotal: number;
  x: number;
  y: number;
}

interface FlowEdge {
  from: string;
  to: string;
  amount: number;
}

const NODE_R = 34;

function layoutColumn(items: { id: string; label: string; sublabel?: string; monthlyTotal: number }[], x: number, height: number): FlowNode[] {
  const n = items.length;
  if (n === 0) return [];
  const gap = height / (n + 1);
  return items.map((item, i) => ({
    ...item,
    x,
    y: gap * (i + 1),
  }));
}

export const MoneyMap: React.FC<MoneyMapProps> = ({ incomes, expenses, accounts, currency }) => {
  const [hoveredEdge, setHoveredEdge] = useState<string | null>(null);

  const { incomeNodes, accountNodes, categoryNodes, edges, height } = useMemo(() => {
    const activeIncomes = incomes.filter((i) => i.isActive);
    const activeExpenses = expenses.filter((e) => e.isActive);

    const accountMonthlyIn: Record<string, number> = {};
    const accountMonthlyOut: Record<string, number> = {};

    const incomeItems = activeIncomes.map((inc) => {
      const monthly = getMonthlyEquivalent(convertCurrency(inc.amount, inc.currency, currency), inc.frequency);
      const accId = inc.depositAccountId || 'unassigned';
      accountMonthlyIn[accId] = (accountMonthlyIn[accId] || 0) + monthly;
      return { id: `income:${inc.id}`, label: inc.name, monthlyTotal: monthly, accountId: accId };
    });

    const categoryTotals: Record<string, Record<string, number>> = {};
    activeExpenses.forEach((exp) => {
      const monthly = getMonthlyEquivalent(convertCurrency(exp.amount, exp.currency, currency), exp.billingCycle);
      const accId = exp.paymentAccountId || 'unassigned';
      accountMonthlyOut[accId] = (accountMonthlyOut[accId] || 0) + monthly;
      if (!categoryTotals[accId]) categoryTotals[accId] = {};
      categoryTotals[accId][exp.category] = (categoryTotals[accId][exp.category] || 0) + monthly;
    });

    const usedAccountIds = new Set<string>([
      ...Object.keys(accountMonthlyIn),
      ...Object.keys(accountMonthlyOut),
    ]);

    const accountList = accounts
      .filter((a) => usedAccountIds.has(a.id))
      .map((a) => ({
        id: `account:${a.id}`,
        rawId: a.id,
        label: a.name,
        sublabel: a.institution || undefined,
        monthlyTotal: (accountMonthlyIn[a.id] || 0) - (accountMonthlyOut[a.id] || 0),
        isLoan: a.type === 'LOAN',
      }));

    if (usedAccountIds.has('unassigned')) {
      accountList.push({
        id: 'account:unassigned',
        rawId: 'unassigned',
        label: 'Unlinked',
        sublabel: 'No account set',
        monthlyTotal: (accountMonthlyIn['unassigned'] || 0) - (accountMonthlyOut['unassigned'] || 0),
        isLoan: false,
      });
    }

    const categoryTotalsFlat: Record<string, number> = {};
    Object.values(categoryTotals).forEach((byCat) => {
      Object.entries(byCat).forEach(([cat, amt]) => {
        categoryTotalsFlat[cat] = (categoryTotalsFlat[cat] || 0) + amt;
      });
    });

    const categoryList = Object.entries(categoryTotalsFlat).map(([cat, amt]) => ({
      id: `category:${cat}`,
      label: CATEGORIES[cat as keyof typeof CATEGORIES]?.name || cat,
      monthlyTotal: amt,
    }));

    const maxRows = Math.max(incomeItems.length, accountList.length, categoryList.length, 1);
    const height = Math.max(maxRows * 78, 220);

    const incomeNodes = layoutColumn(incomeItems, 90, height);
    const accountNodes = layoutColumn(accountList, 430, height);
    const categoryNodes = layoutColumn(categoryList, 770, height);

    const edges: FlowEdge[] = [];
    incomeNodes.forEach((n) => {
      const src = incomeItems.find((i) => i.id === n.id);
      if (!src) return;
      const accNode = accountNodes.find((a) => (a as unknown as { rawId: string }).rawId === src.accountId);
      if (accNode) edges.push({ from: n.id, to: accNode.id, amount: n.monthlyTotal });
    });

    accountNodes.forEach((accNode) => {
      const rawId = (accNode as unknown as { rawId: string }).rawId;
      const byCat = categoryTotals[rawId];
      if (!byCat) return;
      Object.entries(byCat).forEach(([cat, amt]) => {
        const catNode = categoryNodes.find((c) => c.id === `category:${cat}`);
        if (catNode) edges.push({ from: accNode.id, to: catNode.id, amount: amt });
      });
    });

    return { incomeNodes, accountNodes: accountNodes as (FlowNode & { rawId: string; isLoan: boolean })[], categoryNodes, edges, height };
  }, [incomes, expenses, accounts, currency]);

  const hasData = incomeNodes.length > 0 || accountNodes.length > 0 || categoryNodes.length > 0;
  const width = 900;

  const nodeById = (id: string): FlowNode | undefined =>
    [...incomeNodes, ...accountNodes, ...categoryNodes].find((n) => n.id === id);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      <div className="ha-card" style={{ padding: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
          <span className="ha-badge ha-badge-blue">Live topology</span>
        </div>
        <h2 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--ha-ink)', lineHeight: 1.1 }}>
          Money map
        </h2>
        <p style={{ fontSize: '0.85rem', color: 'var(--ha-muted)', maxWidth: '640px', marginTop: '0.25rem' }}>
          Where your money flows every month — income sources into accounts, and accounts out to spending categories.
        </p>
      </div>

      <div className="ha-card" style={{ padding: '1.5rem', overflowX: 'auto' }}>
        {!hasData ? (
          <div style={{ padding: '3rem 2rem', textAlign: 'center', color: 'var(--ha-muted)' }}>
            <div style={{
              width: '48px', height: '48px', borderRadius: '50%', backgroundColor: 'var(--ha-blue-light)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem',
            }}>
              <Activity size={24} color="var(--ha-blue)" />
            </div>
            <h4 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--ha-ink)', marginBottom: '0.35rem' }}>
              Nothing to map yet
            </h4>
            <p style={{ fontSize: '0.85rem', maxWidth: '420px', margin: '0 auto', lineHeight: 1.5 }}>
              Link your income and expenses to accounts to see the flow visualized here.
            </p>
          </div>
        ) : (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', maxWidth: `${width}px`, margin: '0 auto 0.75rem', fontSize: '0.72rem', fontWeight: 700, color: 'var(--ha-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              <span>Income sources</span>
              <span>Accounts</span>
              <span>Spending categories</span>
            </div>
            <svg width={width} height={height} style={{ display: 'block', margin: '0 auto', minWidth: `${width}px` }}>
              <defs>
                <marker id="mm-arrow-in" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
                  <path d="M0,0 L6,3 L0,6 Z" fill="#3AA76D" />
                </marker>
                <marker id="mm-arrow-out" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
                  <path d="M0,0 L6,3 L0,6 Z" fill="#D8443C" />
                </marker>
              </defs>

              {edges.map((edge, i) => {
                const from = nodeById(edge.from);
                const to = nodeById(edge.to);
                if (!from || !to) return null;
                const isIncomeEdge = edge.from.startsWith('income:');
                const edgeKey = `${edge.from}->${edge.to}:${i}`;
                const isHovered = hoveredEdge === edgeKey;
                const color = isIncomeEdge ? '#3AA76D' : '#D8443C';
                const midX = (from.x + to.x) / 2;

                return (
                  <g key={edgeKey}>
                    <path
                      d={`M ${from.x + NODE_R} ${from.y} C ${midX} ${from.y}, ${midX} ${to.y}, ${to.x - NODE_R} ${to.y}`}
                      fill="none"
                      stroke={color}
                      strokeWidth={isHovered ? 2.5 : 1.5}
                      opacity={isHovered ? 1 : 0.55}
                      markerEnd={isIncomeEdge ? 'url(#mm-arrow-in)' : 'url(#mm-arrow-out)'}
                      onMouseEnter={() => setHoveredEdge(edgeKey)}
                      onMouseLeave={() => setHoveredEdge(null)}
                      style={{ cursor: 'pointer' }}
                    />
                    {isHovered && (
                      <text x={midX} y={(from.y + to.y) / 2 - 8} textAnchor="middle" fontSize="11" fontWeight={700} fill={color}>
                        {formatCurrency(edge.amount, currency)}/mo
                      </text>
                    )}
                  </g>
                );
              })}

              {incomeNodes.map((n) => (
                <g key={n.id} transform={`translate(${n.x}, ${n.y})`}>
                  <circle r={NODE_R} fill="#eaf7f0" stroke="#3AA76D" strokeWidth="2" />
                  <foreignObject x={-NODE_R} y={-NODE_R} width={NODE_R * 2} height={NODE_R * 2}>
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem', fontWeight: 700, color: '#1f7a4d', textAlign: 'center', padding: '2px' }}>
                      {n.label.length > 14 ? `${n.label.slice(0, 12)}…` : n.label}
                    </div>
                  </foreignObject>
                  <text x={0} y={NODE_R + 16} textAnchor="middle" fontSize="10.5" fontWeight={700} fill="var(--ha-ink)">
                    {formatCurrency(n.monthlyTotal, currency)}
                  </text>
                </g>
              ))}

              {accountNodes.map((n) => {
                const isPositive = n.monthlyTotal >= 0;
                const ringColor = n.isLoan ? '#D8443C' : isPositive ? '#3155D9' : '#D8443C';
                const bgColor = n.isLoan ? '#fbeceb' : isPositive ? '#eef2fc' : '#fbeceb';
                return (
                  <g key={n.id} transform={`translate(${n.x}, ${n.y})`}>
                    <circle r={NODE_R} fill={bgColor} stroke={ringColor} strokeWidth="2.5" />
                    <foreignObject x={-NODE_R} y={-NODE_R} width={NODE_R * 2} height={NODE_R * 2}>
                      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem', fontWeight: 700, color: ringColor, textAlign: 'center', padding: '2px' }}>
                        {n.label.length > 14 ? `${n.label.slice(0, 12)}…` : n.label}
                      </div>
                    </foreignObject>
                    <text x={0} y={NODE_R + 16} textAnchor="middle" fontSize="10.5" fontWeight={700} fill={isPositive ? '#3155D9' : '#D8443C'}>
                      {isPositive ? '+' : ''}{formatCurrency(n.monthlyTotal, currency)}/mo
                    </text>
                  </g>
                );
              })}

              {categoryNodes.map((n) => (
                <g key={n.id} transform={`translate(${n.x}, ${n.y})`}>
                  <circle r={NODE_R} fill="#fbeceb" stroke="#D8443C" strokeWidth="2" />
                  <foreignObject x={-NODE_R} y={-NODE_R} width={NODE_R * 2} height={NODE_R * 2}>
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem', fontWeight: 700, color: '#a8332c', textAlign: 'center', padding: '2px' }}>
                      {n.label.length > 14 ? `${n.label.slice(0, 12)}…` : n.label}
                    </div>
                  </foreignObject>
                  <text x={0} y={NODE_R + 16} textAnchor="middle" fontSize="10.5" fontWeight={700} fill="var(--ha-ink)">
                    {formatCurrency(n.monthlyTotal, currency)}/mo
                  </text>
                </g>
              ))}
            </svg>

            <div style={{ display: 'flex', gap: '1.5rem', justifyContent: 'center', marginTop: '1.25rem', fontSize: '0.75rem', color: 'var(--ha-muted)', flexWrap: 'wrap' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#3AA76D', display: 'inline-block' }} />
                Money in
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#3155D9', display: 'inline-block' }} />
                Account (net positive)
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#D8443C', display: 'inline-block' }} />
                Loan / net negative / spending
              </span>
            </div>
          </>
        )}
      </div>

      {accounts.length === 0 && (
        <div className="ha-card" style={{ padding: '1.25rem 1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Landmark size={18} color="var(--ha-blue)" />
          <p style={{ fontSize: '0.82rem', color: 'var(--ha-muted)' }}>
            Add accounts and link them to your income and expenses to build out the full map.
          </p>
        </div>
      )}
    </div>
  );
};
