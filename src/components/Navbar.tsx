import React from 'react';
import Image from 'next/image';
import type { CurrencyCode, UserProfile } from '../types/expense';
import { CURRENCY_LIST } from '../utils/currencies';
import { formatCurrency } from '../utils/formatters';
import { Plus, Download, Sparkles, LogOut, UserPlus } from 'lucide-react';

export type TabId = 'all' | 'ai-tech' | 'utilities' | 'education' | 'income' | 'calendar' | 'insights' | 'admin';

interface NavbarProps {
  currentCurrency: CurrencyCode;
  onCurrencyChange: (currency: CurrencyCode) => void;
  monthlyTotal: number;
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
  onOpenAddModal: () => void;
  onOpenPresetsModal: () => void;
  onOpenExportModal: () => void;
  onOpenShareModal: () => void;
  onResetData: () => void;
  onLogout: () => void;
  currentUser: UserProfile | null;
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
  onOpenShareModal,
  onLogout,
  currentUser,
}) => {
  const isAdmin = currentUser?.role === 'ADMIN';

  return (
    <div style={{ position: 'sticky', top: 0, zIndex: 50 }}>
      {isAdmin && (
        <div style={{
          backgroundColor: 'var(--ha-blue)',
          color: 'var(--ha-white)',
          fontSize: '0.72rem',
          fontWeight: 600,
          letterSpacing: '0.04em',
          textTransform: 'uppercase',
          textAlign: 'center',
          padding: '0.3rem 0.5rem',
        }}>
          Admin workspace — full household access
        </div>
      )}
      <header style={{
        backgroundColor: 'var(--ha-paper)',
        borderBottom: isAdmin ? '2px solid var(--ha-blue)' : '1px solid var(--ha-line)',
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
            <Image
              src="/home-alone-logo-mark.png"
              alt="Home Alone logo"
              width={36}
              height={36}
              style={{
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
                {isAdmin && (
                  <span className="ha-badge ha-badge-blue">Admin</span>
                )}
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
            { id: 'income', label: 'Income' },
            { id: 'calendar', label: 'Schedule' },
            { id: 'insights', label: 'Optimization' },
            { id: 'admin', label: 'Admin & users' },
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id as TabId)}
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

        {/* Right Actions: Currency, Catalog, Share, Export, Add Expense, User & Log Out */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
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
            <span>Catalog</span>
          </button>

          {/* Share Workspace Button */}
          <button
            onClick={onOpenShareModal}
            className="btn btn-secondary"
            style={{ fontSize: '0.85rem', padding: '0.55rem 0.85rem' }}
            title="Share workspace with wife, partner or family members"
          >
            <UserPlus size={15} color="var(--ha-blue)" />
            <span>Share</span>
          </button>

          {/* Export / Backup */}
          <button
            onClick={onOpenExportModal}
            className="btn btn-secondary"
            style={{ fontSize: '0.85rem', padding: '0.55rem 0.75rem' }}
            title="Export CSV spreadsheet or JSON backup"
          >
            <Download size={15} />
            <span className="hide-mobile">Export</span>
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

          {/* User Account Chip */}
          {currentUser && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              backgroundColor: 'var(--ha-white)',
              border: '1px solid var(--ha-line)',
              borderRadius: 'var(--ha-radius-md)',
              padding: '0.25rem 0.5rem',
              gap: '0.4rem',
            }}>
              <div style={{
                width: '26px',
                height: '26px',
                borderRadius: 'var(--ha-radius-sm)',
                backgroundColor: currentUser.role === 'ADMIN' ? 'var(--ha-blue-light)' : currentUser.role === 'BACKUP_ADMIN' ? 'var(--ha-red-tint)' : '#e7e8ea',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.78rem',
                fontWeight: 700,
                color: currentUser.role === 'ADMIN' ? 'var(--ha-blue)' : currentUser.role === 'BACKUP_ADMIN' ? 'var(--ha-red)' : 'var(--ha-ink)',
              }}>
                {currentUser.name.charAt(0).toUpperCase()}
              </div>

              <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--ha-ink)' }}>
                {currentUser.name}
              </span>
            </div>
          )}

          {/* Prominent Log Out Button */}
          <button
            onClick={onLogout}
            className="btn btn-destructive"
            style={{ fontSize: '0.82rem', padding: '0.55rem 0.85rem' }}
            title="Sign out of Home Alone"
          >
            <LogOut size={14} />
            <span>Log out</span>
          </button>
        </div>
      </div>
      </header>
    </div>
  );
};
