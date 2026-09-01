import React from 'react';
import type { CurrencyCode, UserProfile } from '../types/expense';
import { CURRENCY_LIST } from '../utils/currencies';
import { formatCurrency } from '../utils/formatters';
import { Plus, Download, Sparkles, RefreshCw, User } from 'lucide-react';

interface NavbarProps {
  currentCurrency: CurrencyCode;
  onCurrencyChange: (currency: CurrencyCode) => void;
  monthlyTotal: number;
  activeTab: 'all' | 'ai-tech' | 'utilities' | 'education' | 'calendar' | 'insights' | 'admin';
  onTabChange: (tab: 'all' | 'ai-tech' | 'utilities' | 'education' | 'calendar' | 'insights' | 'admin') => void;
  onOpenAddModal: () => void;
  onOpenPresetsModal: () => void;
  onOpenExportModal: () => void;
  onResetData: () => void;
  currentUser: UserProfile | null;
  users: UserProfile[];
  onSelectUser: (user: UserProfile) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentCurrency,
  onCurrencyChange,
  monthlyTotal,
  activeTab,
  onTabChange,
  onOpenAddModal,
  onOpenPresetsModal,
  onOpenExportModal,
  onResetData,
  currentUser,
  users,
  onSelectUser,
}) => {
  return (
    <header style={{
      position: 'sticky',
      top: 0,
      zIndex: 50,
      backgroundColor: 'var(--ha-paper)',
      borderBottom: '1px solid var(--ha-line)',
      padding: '0.85rem 1.5rem',
    }}>
      <div style={{
        maxWidth: '1280px',
        margin: '0 auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem',
      }}>
        {/* Brand Logo & Wordmark */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <div
            style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', cursor: 'pointer' }}
            onClick={() => onTabChange('all')}
          >
            <img
              src="/home-alone-logo-mark.png"
              alt="Home Alone logo"
              style={{
                height: '36px',
                width: '36px',
                objectFit: 'contain',
                display: 'block',
              }}
            />
            <div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
                <h1 style={{
                  fontSize: '1.65rem',
                  fontWeight: 700,
                  color: 'var(--ha-ink)',
                  lineHeight: 1,
                  fontFamily: 'var(--ha-font-display)',
                  letterSpacing: '0.02em',
                  textTransform: 'none',
                }}>
                  Home Alone
                </h1>
              </div>
              <p style={{
                fontSize: '0.78rem',
                color: 'var(--ha-muted)',
                fontWeight: 400,
                marginTop: '1px',
              }}>
                Simple records. Clearer days.
              </p>
            </div>
          </div>

          {/* Monthly Total Indicator */}
          <div style={{
            display: 'none',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.35rem 0.75rem',
            backgroundColor: 'var(--ha-white)',
            border: '1px solid var(--ha-line)',
            borderRadius: 'var(--ha-radius-md)',
          }} className="desktop-burn-rate">
            <span style={{ fontSize: '0.75rem', color: 'var(--ha-muted)', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.03em' }}>
              Monthly commitments:
            </span>
            <span className="tabular-nums" style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--ha-blue)' }}>
              {formatCurrency(monthlyTotal, currentCurrency)}
            </span>
          </div>
        </div>

        {/* View Switcher Tabs */}
        <nav style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.25rem',
          backgroundColor: 'var(--ha-white)',
          padding: '0.25rem',
          borderRadius: 'var(--ha-radius-md)',
          border: '1px solid var(--ha-line)',
          overflowX: 'auto',
        }}>
          {[
            { id: 'all', label: 'All expenses' },
            { id: 'utilities', label: 'Utilities & bills' },
            { id: 'education', label: 'Colleges & sports' },
            { id: 'ai-tech', label: 'AI & tech' },
            { id: 'calendar', label: 'Schedule' },
            { id: 'insights', label: 'Optimization' },
            { id: 'admin', label: 'Admin & users' },
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id as any)}
                style={{
                  padding: '0.45rem 0.85rem',
                  borderRadius: 'var(--ha-radius-sm)',
                  border: 'none',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.12s ease',
                  backgroundColor: isActive ? 'var(--ha-blue)' : 'transparent',
                  color: isActive ? 'var(--ha-white)' : 'var(--ha-muted)',
                  whiteSpace: 'nowrap',
                }}
              >
                {tab.label}
              </button>
            );
          })}
        </nav>

        {/* User Switcher, Actions & Currency */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          {/* Household User Profile Switcher */}
          {users.length > 0 && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              backgroundColor: 'var(--ha-white)',
              border: '1px solid var(--ha-line)',
              borderRadius: 'var(--ha-radius-md)',
              padding: '0.35rem 0.65rem',
            }}>
              <User size={14} color="var(--ha-blue)" />
              <select
                value={currentUser?.id || ''}
                onChange={(e) => {
                  const targetUser = users.find((u) => u.id === e.target.value);
                  if (targetUser) onSelectUser(targetUser);
                }}
                style={{
                  backgroundColor: 'transparent',
                  color: 'var(--ha-ink)',
                  border: 'none',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  outline: 'none',
                }}
                title="Switch active household profile"
              >
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.role.replace('_', ' ')})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Currency Dropdown */}
          <select
            value={currentCurrency}
            onChange={(e) => onCurrencyChange(e.target.value as CurrencyCode)}
            style={{
              backgroundColor: 'var(--ha-white)',
              color: 'var(--ha-ink)',
              border: '1px solid var(--ha-line)',
              borderRadius: 'var(--ha-radius-md)',
              padding: '0.55rem 0.75rem',
              fontSize: '0.85rem',
              fontWeight: 600,
              cursor: 'pointer',
              outline: 'none',
            }}
            title="Display currency"
          >
            {CURRENCY_LIST.map((c) => (
              <option key={c.code} value={c.code}>
                {c.symbol} {c.code}
              </option>
            ))}
          </select>

          {/* Quick Presets Catalog */}
          <button
            onClick={onOpenPresetsModal}
            className="btn btn-secondary"
            style={{ fontSize: '0.85rem', padding: '0.55rem 0.85rem' }}
            title="Browse standard subscription and utility presets"
          >
            <Sparkles size={15} color="var(--ha-blue)" />
            <span className="hide-mobile">Catalog</span>
          </button>

          {/* Export / Backup */}
          <button
            onClick={onOpenExportModal}
            className="btn btn-secondary"
            style={{ fontSize: '0.85rem', padding: '0.55rem 0.75rem' }}
            title="Export CSV or JSON backup"
          >
            <Download size={15} />
          </button>

          {/* Reset data */}
          <button
            onClick={onResetData}
            className="btn btn-ghost"
            style={{ fontSize: '0.85rem', padding: '0.55rem 0.75rem' }}
            title="Reset to default sample records"
          >
            <RefreshCw size={14} />
          </button>

          {/* Primary Add Expense Action */}
          <button
            onClick={onOpenAddModal}
            className="btn btn-primary"
            style={{ fontSize: '0.85rem', padding: '0.55rem 1.1rem' }}
          >
            <Plus size={15} />
            <span>Add expense</span>
          </button>
        </div>
      </div>
    </header>
  );
};
