import React, { useState } from 'react';
import type { UserProfile } from '../types/expense';
import { Plus, Search, Settings, HelpCircle, LogOut, ShieldCheck, Menu, X, ChevronDown, Eye, EyeOff, ScanLine } from 'lucide-react';
import { TallyLogo } from './TallyLogo';
import { APP_VERSION, MOBILE_APP_VERSION } from '../data/changelog';

export type TabId = 'overview' | 'all' | 'ai-tech' | 'utilities' | 'education' | 'big-ticket' | 'insurance' | 'income' | 'calendar' | 'insights' | 'accounts' | 'moneymap' | 'flow' | 'goals' | 'planned' | 'admin';

export const SPENDING_TABS: TabId[] = ['all', 'ai-tech', 'utilities', 'education', 'big-ticket', 'insurance'];

const PRIMARY_NAV_ITEMS: { id: TabId; label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'all', label: 'Spending' },
  { id: 'calendar', label: 'Bills' },
  { id: 'income', label: 'Income' },
  { id: 'accounts', label: 'Accounts' },
  { id: 'insights', label: 'Insights' },
];

const JOURNEY_NAV_ITEMS: { id: TabId; label: string }[] = [
  { id: 'flow', label: 'Flow' },
  { id: 'goals', label: 'Goals' },
  { id: 'planned', label: 'Planned' },
  { id: 'moneymap', label: 'Money Map' },
];

interface NavbarProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
  onOpenAddModal: () => void;
  onOpenScanModal: () => void;
  onOpenSettings: () => void;
  onOpenHelpModal: () => void;
  onFocusAsk: () => void;
  onLogout: () => void;
  currentUser: UserProfile | null;
  isPrivacyBlurred: boolean;
  onTogglePrivacyBlur: () => void;
  onOpenChangelog: (variant?: 'desktop' | 'mobile') => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onTabChange,
  onOpenAddModal,
  onOpenScanModal,
  onOpenSettings,
  onOpenHelpModal,
  onFocusAsk,
  onLogout,
  currentUser,
  isPrivacyBlurred,
  onTogglePrivacyBlur,
  onOpenChangelog,
}) => {
  const isAdmin = currentUser?.role === 'ADMIN';
  const [isAvatarMenuOpen, setIsAvatarMenuOpen] = useState(false);
  const [isJourneyMenuOpen, setIsJourneyMenuOpen] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const handleNav = (tab: TabId) => {
    onTabChange(tab);
    setIsDrawerOpen(false);
    setIsJourneyMenuOpen(false);
  };

  const isJourneyActive = JOURNEY_NAV_ITEMS.some((item) => item.id === activeTab);

  return (
    <div style={{ position: 'sticky', top: 0, zIndex: 50 }}>
      <header style={{
        backgroundColor: 'var(--ha-paper)',
        borderBottom: '1px solid var(--ha-line)',
        padding: '0.75rem 1.5rem',
      }}>
        <div style={{
          maxWidth: '1280px',
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1.5rem',
        }}>
          {/* Brand */}
          <div
            style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', cursor: 'pointer', flexShrink: 0 }}
            onClick={() => handleNav('overview')}
          >
            <TallyLogo size={28} />
            <div>
              <h1 style={{
                fontSize: '1.35rem',
                fontWeight: 700,
                color: 'var(--ha-ink)',
                lineHeight: 1,
                fontFamily: 'var(--ha-font-display)',
                letterSpacing: '-0.02em',
              }}>
                Tally
              </h1>
              <p className="hide-mobile" style={{ fontSize: '0.7rem', color: 'var(--ha-muted)', marginTop: '1px' }}>
                Your household, in balance.
              </p>
            </div>
            <button
              className="hide-mobile"
              onClick={(e) => { e.stopPropagation(); onOpenChangelog('desktop'); }}
              title="View changelog"
              style={{
                background: 'none',
                border: '1px solid var(--ha-line)',
                borderRadius: 'var(--ha-radius-sm)',
                padding: '0.1rem 0.4rem',
                color: 'var(--ha-muted)',
                fontSize: '0.68rem',
                fontWeight: 600,
                cursor: 'pointer',
                alignSelf: 'flex-start',
                marginTop: '2px',
              }}
            >
              v{APP_VERSION}
            </button>
          </div>

          {/* Primary Nav Links (desktop) */}
          <nav className="desktop-only" style={{ alignItems: 'center', gap: '1.5rem', flex: 1, justifyContent: 'center' }}>
            {PRIMARY_NAV_ITEMS.map((item) => {
              const isActive = item.id === 'all' ? SPENDING_TABS.includes(activeTab) : activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNav(item.id)}
                  className={`ha-nav-link${isActive ? ' active' : ''}`}
                >
                  {item.label}
                </button>
              );
            })}

            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setIsJourneyMenuOpen((v) => !v)}
                className={`ha-nav-link${isJourneyActive ? ' active' : ''}`}
                style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}
              >
                <span>Money Journey</span>
                <ChevronDown size={13} />
              </button>

              {isJourneyMenuOpen && (
                <>
                  <div className="ha-dropdown-overlay" onClick={() => setIsJourneyMenuOpen(false)} />
                  <div className="ha-dropdown" style={{ left: '50%', right: 'auto', width: '200px', marginLeft: '-100px' }}>
                    {JOURNEY_NAV_ITEMS.map((item) => (
                      <button
                        key={item.id}
                        className="ha-dropdown-item"
                        onClick={() => handleNav(item.id)}
                        style={{ fontWeight: activeTab === item.id ? 700 : 500, color: activeTab === item.id ? 'var(--ha-blue)' : undefined }}
                      >
                        <span>{item.label}</span>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </nav>

          {/* Right Actions (desktop) */}
          <div className="desktop-only" style={{ alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
            <button className="ha-icon-btn" title="Ask Tally" onClick={onFocusAsk}>
              <Search size={17} />
            </button>

            <button
              className="ha-icon-btn"
              title={isPrivacyBlurred ? 'Reveal screen' : 'Blur screen for privacy'}
              onClick={onTogglePrivacyBlur}
            >
              {isPrivacyBlurred ? <EyeOff size={17} /> : <Eye size={17} />}
            </button>

            <button className="ha-icon-btn" title="Scan a bill" onClick={onOpenScanModal}>
              <ScanLine size={17} />
            </button>

            <button onClick={onOpenAddModal} className="btn btn-primary" style={{ fontSize: '0.82rem', padding: '0.5rem 0.9rem' }}>
              <Plus size={14} />
              <span>Add expense</span>
            </button>

            <button className="ha-icon-btn" title="Settings & preferences" onClick={onOpenSettings}>
              <Settings size={17} />
            </button>

            {currentUser && (
              <div style={{ position: 'relative' }}>
                <button
                  onClick={() => setIsAvatarMenuOpen((v) => !v)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    backgroundColor: 'transparent',
                    border: '1px solid var(--ha-line)',
                    borderRadius: 'var(--ha-radius-md)',
                    padding: '0.3rem 0.5rem 0.3rem 0.3rem',
                    cursor: 'pointer',
                  }}
                >
                  <div style={{
                    width: '26px',
                    height: '26px',
                    borderRadius: 'var(--ha-radius-sm)',
                    backgroundColor: currentUser.role === 'ADMIN' ? 'var(--ha-blue-light)' : currentUser.role === 'BACKUP_ADMIN' ? 'var(--ha-red-tint)' : '#e7e8ea',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    color: currentUser.role === 'ADMIN' ? 'var(--ha-blue)' : currentUser.role === 'BACKUP_ADMIN' ? 'var(--ha-red)' : 'var(--ha-ink)',
                  }}>
                    {currentUser.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="hide-mobile" style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--ha-ink)' }}>
                    {currentUser.name.split(' ')[0]}
                  </span>
                  <ChevronDown size={14} color="var(--ha-muted)" />
                </button>

                {isAvatarMenuOpen && (
                  <>
                    <div className="ha-dropdown-overlay" onClick={() => setIsAvatarMenuOpen(false)} />
                    <div className="ha-dropdown">
                      {isAdmin && (
                        <button className="ha-dropdown-item" onClick={() => { handleNav('admin'); setIsAvatarMenuOpen(false); }}>
                          <ShieldCheck size={15} />
                          <span>Admin & users</span>
                        </button>
                      )}
                      <button className="ha-dropdown-item" onClick={() => { onOpenHelpModal(); setIsAvatarMenuOpen(false); }}>
                        <HelpCircle size={15} />
                        <span>Help guide</span>
                      </button>
                      <div className="ha-dropdown-divider" />
                      <button className="ha-dropdown-item destructive" onClick={() => { onLogout(); setIsAvatarMenuOpen(false); }}>
                        <LogOut size={15} />
                        <span>Log out</span>
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Mobile Actions */}
          <div className="mobile-menu-btn" style={{ alignItems: 'center', gap: '0.4rem' }}>
            <button
              className="ha-icon-btn"
              title={isPrivacyBlurred ? 'Reveal screen' : 'Blur screen for privacy'}
              onClick={onTogglePrivacyBlur}
            >
              {isPrivacyBlurred ? <EyeOff size={19} /> : <Eye size={19} />}
            </button>
            <button className="ha-icon-btn" title="Scan a bill" onClick={onOpenScanModal}>
              <ScanLine size={19} />
            </button>
            <button className="ha-icon-btn" title="Add expense" onClick={onOpenAddModal}>
              <Plus size={19} />
            </button>
            <button className="ha-icon-btn" title="Menu" onClick={() => setIsDrawerOpen(true)}>
              <Menu size={20} />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Drawer */}
      {isDrawerOpen && (
        <>
          <div className="mobile-drawer-overlay" onClick={() => setIsDrawerOpen(false)} />
          <div className="mobile-drawer">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 1.25rem', borderBottom: '1px solid var(--ha-line)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <TallyLogo size={24} />
                <span style={{ fontWeight: 700, fontSize: '1.1rem', fontFamily: 'var(--ha-font-display)' }}>Tally</span>
                <button
                  onClick={() => { setIsDrawerOpen(false); onOpenChangelog('mobile'); }}
                  style={{
                    background: 'none',
                    border: '1px solid var(--ha-line)',
                    borderRadius: 'var(--ha-radius-sm)',
                    padding: '0.1rem 0.4rem',
                    color: 'var(--ha-muted)',
                    fontSize: '0.68rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  v{MOBILE_APP_VERSION}
                </button>
              </div>
              <button className="ha-icon-btn" onClick={() => setIsDrawerOpen(false)}>
                <X size={20} />
              </button>
            </div>

            {currentUser && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '1rem 1.25rem', borderBottom: '1px solid var(--ha-line)' }}>
                <div style={{
                  width: '34px',
                  height: '34px',
                  borderRadius: 'var(--ha-radius-sm)',
                  backgroundColor: 'var(--ha-blue-light)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.9rem',
                  fontWeight: 700,
                  color: 'var(--ha-blue)',
                }}>
                  {currentUser.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--ha-ink)' }}>{currentUser.name}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--ha-muted)' }}>{currentUser.role}</div>
                </div>
              </div>
            )}

            <div style={{ padding: '0.75rem 0.5rem', display: 'flex', flexDirection: 'column' }}>
              {PRIMARY_NAV_ITEMS.map((item) => {
                const isActive = item.id === 'all' ? SPENDING_TABS.includes(activeTab) : activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleNav(item.id)}
                    className="ha-dropdown-item"
                    style={{ fontSize: '0.95rem', fontWeight: 600, color: isActive ? 'var(--ha-blue)' : 'var(--ha-ink)' }}
                  >
                    {item.label}
                  </button>
                );
              })}

              <div style={{
                fontSize: '0.7rem',
                fontWeight: 700,
                color: 'var(--ha-muted)',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
                padding: '0.75rem 0.9rem 0.25rem',
              }}>
                Money Journey
              </div>
              {JOURNEY_NAV_ITEMS.map((item) => {
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleNav(item.id)}
                    className="ha-dropdown-item"
                    style={{ fontSize: '0.95rem', fontWeight: 600, color: isActive ? 'var(--ha-blue)' : 'var(--ha-ink)' }}
                  >
                    {item.label}
                  </button>
                );
              })}
              {isAdmin && (
                <button onClick={() => handleNav('admin')} className="ha-dropdown-item" style={{ fontSize: '0.95rem', fontWeight: 600 }}>
                  <ShieldCheck size={15} />
                  <span>Admin & users</span>
                </button>
              )}

              <div className="ha-dropdown-divider" />

              <button onClick={() => { onOpenSettings(); setIsDrawerOpen(false); }} className="ha-dropdown-item">
                <Settings size={15} />
                <span>Settings & preferences</span>
              </button>
              <button onClick={() => { onOpenHelpModal(); setIsDrawerOpen(false); }} className="ha-dropdown-item">
                <HelpCircle size={15} />
                <span>Help guide</span>
              </button>
              <button onClick={() => { onLogout(); setIsDrawerOpen(false); }} className="ha-dropdown-item destructive">
                <LogOut size={15} />
                <span>Log out</span>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
