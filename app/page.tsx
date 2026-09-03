'use client';

import { useState, useEffect, useCallback } from 'react';
import type { ExpenseItem, IncomeItem, CurrencyCode, PresetItem, UserProfile } from '@/src/types/expense';
import { loadCurrency, saveCurrency, resetToDefaults } from '@/src/services/storage';
import { calculateSpendingSummary, calculateIncomeSummary } from '@/src/utils/calculations';
import { Navbar, SPENDING_TABS } from '@/src/components/Navbar';
import type { TabId } from '@/src/components/Navbar';
import { CategoryBreakdownChart } from '@/src/components/CategoryBreakdownChart';
import { ExpenseList } from '@/src/components/ExpenseList';
import { IncomeSection } from '@/src/components/IncomeSection';
import { IncomeModal } from '@/src/components/IncomeModal';
import { AiTechSection } from '@/src/components/AiTechSection';
import { UtilitiesSection } from '@/src/components/UtilitiesSection';
import { EducationSection } from '@/src/components/EducationSection';
import { UpcomingRenewals } from '@/src/components/UpcomingRenewals';
import { OptimizationInsights } from '@/src/components/OptimizationInsights';
import { AdminSection } from '@/src/components/AdminSection';
import { LoginScreen } from '@/src/components/LoginScreen';
import { ExpenseModal } from '@/src/components/ExpenseModal';
import { PresetsModal } from '@/src/components/PresetsModal';
import { ExportImportModal } from '@/src/components/ExportImportModal';
import { ShareWorkspaceModal } from '@/src/components/ShareWorkspaceModal';
import { ContactVendorModal } from '@/src/components/ContactVendorModal';
import { HelpGuideModal } from '@/src/components/HelpGuideModal';
import { SettingsModal } from '@/src/components/SettingsModal';
import { OverviewDashboard } from '@/src/components/OverviewDashboard';
import { AssistantBox } from '@/src/components/AssistantBox';
import { TallyLogo } from '@/src/components/TallyLogo';

export default function HomeAlonePage() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null); // null = checking
  const [expenses, setExpenses] = useState<ExpenseItem[]>([]);
  const [incomes, setIncomes] = useState<IncomeItem[]>([]);
  const [currency, setCurrency] = useState<CurrencyCode>('EUR');
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const SPENDING_CHIPS: { id: TabId; label: string }[] = [
    { id: 'all', label: 'All spending' },
    { id: 'ai-tech', label: 'AI & tech' },
    { id: 'utilities', label: 'Utilities & bills' },
    { id: 'education', label: 'Colleges & sports' },
  ];

  // Users & Auth
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isPresetsModalOpen, setIsPresetsModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<ExpenseItem | null>(null);
  const [initialPresetId, setInitialPresetId] = useState<string | null>(null);
  const [initialCategory, setInitialCategory] = useState<string | null>(null);
  const [isIncomeModalOpen, setIsIncomeModalOpen] = useState(false);
  const [editingIncome, setEditingIncome] = useState<IncomeItem | null>(null);
  const [contactVendorExpense, setContactVendorExpense] = useState<ExpenseItem | null>(null);

  // Fetch users & expenses from Prisma PostgreSQL API
  const fetchDatabaseData = useCallback(async () => {
    try {
      // 1. Fetch Users
      const userRes = await fetch('/api/users');
      const userData = await userRes.json();
      if (userData.status === 'ok' && Array.isArray(userData.users)) {
        setUsers(userData.users);
      }

      // 2. Fetch Expenses from PostgreSQL
      const expRes = await fetch('/api/expenses');
      const expData = await expRes.json();
      if (expData.status === 'ok' && Array.isArray(expData.expenses)) {
        setExpenses(expData.expenses);
      }

      // 3. Fetch Income from PostgreSQL
      const incRes = await fetch('/api/income');
      const incData = await incRes.json();
      if (incData.status === 'ok' && Array.isArray(incData.incomes)) {
        setIncomes(incData.incomes);
      }
    } catch (err) {
      console.error('Failed to load from database:', err);
    }
  }, []);

  // Check auth on load
  useEffect(() => {
    setCurrency(loadCurrency());

    // Check localStorage first for instant display
    try {
      const savedUserStr = localStorage.getItem('homealone_user');
      if (savedUserStr) {
        const savedUser = JSON.parse(savedUserStr);
        if (savedUser && savedUser.id) {
          setIsAuthenticated(true);
          setCurrentUser(savedUser);
        }
      }
    } catch {}

    // Verify session with server
    fetch('/api/auth/me')
      .then((r) => r.json())
      .then((data) => {
        if (data.status === 'authenticated' && data.user) {
          setIsAuthenticated(true);
          setCurrentUser(data.user);
          try {
            localStorage.setItem('homealone_user', JSON.stringify(data.user));
          } catch {}
          fetchDatabaseData();
        } else {
          const hasLocal = typeof window !== 'undefined' && localStorage.getItem('homealone_user');
          if (!hasLocal) {
            setIsAuthenticated(false);
          } else {
            fetchDatabaseData();
          }
        }
      })
      .catch(() => {
        const hasLocal = typeof window !== 'undefined' && localStorage.getItem('homealone_user');
        if (!hasLocal) {
          setIsAuthenticated(false);
        } else {
          fetchDatabaseData();
        }
      });
  }, [fetchDatabaseData]);

  useEffect(() => {
    saveCurrency(currency);
  }, [currency]);

  const handleLoginSuccess = (user: UserProfile) => {
    try {
      localStorage.setItem('homealone_user', JSON.stringify(user));
    } catch {}
    setIsAuthenticated(true);
    setCurrentUser(user);
    fetchDatabaseData();
  };

  const handleLogout = async () => {
    try {
      localStorage.removeItem('homealone_user');
    } catch {}
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {}
    setIsAuthenticated(false);
    setCurrentUser(null);
  };

  // Compute spend analytics summary
  const summary = calculateSpendingSummary(expenses, currency);
  const incomeSummary = calculateIncomeSummary(incomes, currency);
  const hasData = expenses.length > 0 || incomes.length > 0;
  const firstName = currentUser?.name?.split(' ')[0] || 'there';
  const greetingHour = new Date().getHours();
  const timeGreeting = greetingHour < 12 ? 'Good morning' : greetingHour < 18 ? 'Good afternoon' : 'Good evening';

  // Toggle active/pause status with PostgreSQL sync
  const handleToggleActive = async (id: string) => {
    const item = expenses.find((e) => e.id === id);
    if (!item) return;

    const updatedActive = !item.isActive;
    // Optimistic update
    setExpenses((prev) =>
      prev.map((e) => (e.id === id ? { ...e, isActive: updatedActive } : e))
    );

    try {
      await fetch('/api/expenses', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...item, isActive: updatedActive }),
      });
    } catch (err) {
      console.error('Failed to update status in DB:', err);
      fetchDatabaseData();
    }
  };

  // Toggle paid/unpaid status with PostgreSQL sync
  const handleTogglePaid = async (id: string) => {
    const item = expenses.find((e) => e.id === id);
    if (!item) return;

    const updatedPaid = !item.isPaidThisCycle;
    // Optimistic update
    setExpenses((prev) =>
      prev.map((e) => (e.id === id ? { ...e, isPaidThisCycle: updatedPaid } : e))
    );

    try {
      await fetch('/api/expenses', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...item, isPaidThisCycle: updatedPaid }),
      });
    } catch (err) {
      console.error('Failed to update paid status in DB:', err);
      fetchDatabaseData();
    }
  };

  // Save new or edited expense with PostgreSQL sync
  const handleSaveExpense = async (
    expenseData: Omit<ExpenseItem, 'id' | 'createdAt' | 'updatedAt'>,
    existingId?: string
  ) => {
    if (existingId) {
      // Optimistic update
      setExpenses((prev) =>
        prev.map((item) =>
          item.id === existingId
            ? { ...item, ...expenseData, updatedAt: new Date().toISOString() }
            : item
        )
      );

      try {
        await fetch('/api/expenses', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...expenseData, id: existingId }),
        });
      } catch (err) {
        console.error('Failed to update expense in DB:', err);
        fetchDatabaseData();
      }
    } else {
      const tempId = `exp-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
      const newItem: ExpenseItem = {
        ...expenseData,
        id: tempId,
        createdById: expenseData.createdById || currentUser?.id,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Optimistic update
      setExpenses((prev) => [newItem, ...prev]);

      try {
        const res = await fetch('/api/expenses', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...expenseData, createdById: expenseData.createdById || currentUser?.id }),
        });
        const data = await res.json();
        if (data.status === 'ok' && data.expense) {
          setExpenses((prev) =>
            prev.map((e) => (e.id === tempId ? data.expense : e))
          );
        }
      } catch (err) {
        console.error('Failed to create expense in DB:', err);
        fetchDatabaseData();
      }
    }
  };

  // Duplicate an expense
  const handleDuplicateExpense = async (item: ExpenseItem) => {
    const duplicatedData = {
      ...item,
      name: `${item.name} (Copy)`,
      createdById: currentUser?.id,
    };

    try {
      const res = await fetch('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(duplicatedData),
      });
      const data = await res.json();
      if (data.status === 'ok' && data.expense) {
        setExpenses((prev) => [data.expense, ...prev]);
      }
    } catch (err) {
      console.error('Failed to duplicate expense in DB:', err);
    }
  };

  // Delete an expense
  const handleDeleteExpense = async (id: string) => {
    const item = expenses.find((e) => e.id === id);
    if (!window.confirm(`Remove "${item?.name || 'this record'}"?`)) return;

    // Optimistic delete
    setExpenses((prev) => prev.filter((e) => e.id !== id));

    try {
      await fetch(`/api/expenses?id=${id}`, {
        method: 'DELETE',
      });
    } catch (err) {
      console.error('Failed to delete expense from DB:', err);
      fetchDatabaseData();
    }
  };

  // Add from catalog preset
  const handleAddFromPreset = async (preset: PresetItem) => {
    const now = new Date();
    const nextRenewalDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];

    const presetExpense = {
      name: preset.name,
      amount: preset.defaultAmount,
      currency: 'EUR' as CurrencyCode,
      billingCycle: preset.defaultCycle,
      category: preset.category,
      icon: preset.icon,
      color: preset.color,
      renewalDay: 1,
      nextRenewalDate,
      paymentMethod: preset.defaultPaymentMethod,
      isActive: true,
      notes: preset.description,
      usageRating: 'high' as const,
      createdById: currentUser?.id,
    };

    try {
      const res = await fetch('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(presetExpense),
      });
      const data = await res.json();
      if (data.status === 'ok' && data.expense) {
        setExpenses((prev) => [data.expense, ...prev]);
      }
    } catch (err) {
      console.error('Failed to add preset to DB:', err);
    }
  };

  // Quick update amount for variable bills (electric, gas, shopping, etc.)
  const handleQuickUpdateAmount = async (expense: ExpenseItem, newAmount: number) => {
    setExpenses((prev) =>
      prev.map((e) => (e.id === expense.id ? { ...e, amount: newAmount } : e))
    );

    try {
      await fetch('/api/expenses', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...expense, amount: newAmount }),
      });
    } catch (err) {
      console.error('Failed to quick-update amount in DB:', err);
      fetchDatabaseData();
    }
  };

  // Toggle income active/paused status with PostgreSQL sync
  const handleToggleIncomeActive = async (id: string) => {
    const item = incomes.find((i) => i.id === id);
    if (!item) return;

    const updatedActive = !item.isActive;
    setIncomes((prev) =>
      prev.map((i) => (i.id === id ? { ...i, isActive: updatedActive } : i))
    );

    try {
      await fetch('/api/income', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...item, isActive: updatedActive }),
      });
    } catch (err) {
      console.error('Failed to update income status in DB:', err);
      fetchDatabaseData();
    }
  };

  // Save new or edited income with PostgreSQL sync
  const handleSaveIncome = async (
    incomeData: Omit<IncomeItem, 'id' | 'createdAt' | 'updatedAt'>,
    existingId?: string
  ) => {
    if (existingId) {
      setIncomes((prev) =>
        prev.map((item) =>
          item.id === existingId
            ? { ...item, ...incomeData, updatedAt: new Date().toISOString() }
            : item
        )
      );

      try {
        await fetch('/api/income', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...incomeData, id: existingId }),
        });
      } catch (err) {
        console.error('Failed to update income in DB:', err);
        fetchDatabaseData();
      }
    } else {
      const tempId = `inc-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
      const newItem: IncomeItem = {
        ...incomeData,
        id: tempId,
        createdById: incomeData.createdById || currentUser?.id,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      setIncomes((prev) => [newItem, ...prev]);

      try {
        const res = await fetch('/api/income', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...incomeData, createdById: incomeData.createdById || currentUser?.id }),
        });
        const data = await res.json();
        if (data.status === 'ok' && data.income) {
          setIncomes((prev) =>
            prev.map((i) => (i.id === tempId ? data.income : i))
          );
        }
      } catch (err) {
        console.error('Failed to create income in DB:', err);
        fetchDatabaseData();
      }
    }
  };

  // Delete an income record
  const handleDeleteIncome = async (id: string) => {
    const item = incomes.find((i) => i.id === id);
    if (!window.confirm(`Remove "${item?.name || 'this income source'}"?`)) return;

    setIncomes((prev) => prev.filter((i) => i.id !== id));

    try {
      await fetch(`/api/income?id=${id}`, {
        method: 'DELETE',
      });
    } catch (err) {
      console.error('Failed to delete income from DB:', err);
      fetchDatabaseData();
    }
  };

  // Scroll to and focus the Ask Tally input
  const handleFocusAsk = () => {
    const input = document.getElementById('ask-tally-input');
    if (input) {
      input.scrollIntoView({ behavior: 'smooth', block: 'center' });
      input.focus();
    }
  };

  // Reset sample data
  const handleResetData = async () => {
    if (window.confirm('Reset all expense records?')) {
      const sample = resetToDefaults();
      setExpenses(sample);
      setSelectedCategory(null);
      fetchDatabaseData();
    }
  };

  // Show loading spinner while checking auth
  if (isAuthenticated === null) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--ha-paper)' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ margin: '0 auto 0.75rem', display: 'flex', justifyContent: 'center' }}>
            <TallyLogo size={36} />
          </div>
          <p style={{ color: 'var(--ha-muted)', fontSize: '0.85rem' }}>Loading Tally...</p>
        </div>
      </div>
    );
  }

  // If unauthenticated, show Logon Screen
  if (!isAuthenticated) {
    return <LoginScreen onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--ha-paper)' }}>
      {/* Top Sticky Navigation */}
      <Navbar
        activeTab={activeTab}
        onTabChange={(tab) => {
          setActiveTab(tab);
          if (tab === 'ai-tech') setSelectedCategory('ai-tech');
          else if (tab === 'utilities') setSelectedCategory('utilities');
          else if (tab === 'education') setSelectedCategory('education');
          else setSelectedCategory(null);
        }}
        onOpenAddModal={() => {
          setEditingExpense(null);
          setInitialPresetId(null);
          setInitialCategory(null);
          setIsAddModalOpen(true);
        }}
        onOpenSettings={() => setIsSettingsModalOpen(true)}
        onOpenHelpModal={() => setIsHelpModalOpen(true)}
        onFocusAsk={handleFocusAsk}
        onLogout={handleLogout}
        currentUser={currentUser}
      />

      {/* Main Container Content */}
      <main style={{
        maxWidth: '1280px',
        width: '100%',
        margin: '0 auto',
        padding: '1.75rem 1.5rem',
        flex: 1,
      }}>
        {/* Ask Bar — the "Google box" for this household's spending */}
        <div style={{ padding: hasData ? '0.5rem 0 2rem' : '3rem 0 2.5rem' }}>
          <h2 style={{
            textAlign: 'center',
            fontFamily: 'var(--ha-font-display)',
            fontSize: '1.5rem',
            fontWeight: 700,
            color: 'var(--ha-ink)',
            marginBottom: '1.25rem',
          }}>
            {timeGreeting}, {firstName}
          </h2>
          <AssistantBox currency={currency} hasData={hasData} />
        </div>

        {/* Overview Dashboard */}
        {activeTab === 'overview' && hasData && (
          <OverviewDashboard
            expenses={expenses}
            summary={summary}
            incomeSummary={incomeSummary}
            currency={currency}
            onEditExpense={(item) => {
              setEditingExpense(item);
              setInitialCategory(null);
              setInitialPresetId(null);
              setIsAddModalOpen(true);
            }}
            onFilterCategory={(cat) => {
              if (cat === 'ai-tech') setActiveTab('ai-tech');
              else if (cat === 'utilities') setActiveTab('utilities');
              else if (cat === 'education') setActiveTab('education');
              else {
                setSelectedCategory(cat);
                setActiveTab('all');
              }
            }}
            onOpenAddIncome={() => {
              setEditingIncome(null);
              setIsIncomeModalOpen(true);
            }}
          />
        )}

        {/* Spending Sub-Tab Chips */}
        {SPENDING_TABS.includes(activeTab) && (
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem', overflowX: 'auto', paddingBottom: '0.25rem' }}>
            {SPENDING_CHIPS.map((chip) => (
              <button
                key={chip.id}
                onClick={() => {
                  setActiveTab(chip.id);
                  setSelectedCategory(chip.id === 'all' ? null : chip.id);
                }}
                className={`ha-chip${activeTab === chip.id ? ' active' : ''}`}
              >
                {chip.label}
              </button>
            ))}
          </div>
        )}

        {/* Tab View Routing */}
        {activeTab === 'all' && (
          <>
            {/* Category Distribution Breakdown */}
            {hasData && (
              <CategoryBreakdownChart
                expenses={expenses}
                currency={currency}
                selectedCategory={selectedCategory}
                onSelectCategory={setSelectedCategory}
              />
            )}

            {/* Complete Household Ledger */}
            <ExpenseList
              expenses={expenses}
              currency={currency}
              selectedCategory={selectedCategory}
              onSelectCategory={setSelectedCategory}
              onToggleActive={handleToggleActive}
              onTogglePaid={handleTogglePaid}
              onEditExpense={(item) => {
                setEditingExpense(item);
                setInitialCategory(null);
                setInitialPresetId(null);
                setIsAddModalOpen(true);
              }}
              onDuplicateExpense={handleDuplicateExpense}
              onDeleteExpense={handleDeleteExpense}
              onOpenAddModal={() => {
                setEditingExpense(null);
                setInitialPresetId(null);
                setInitialCategory(null);
                setIsAddModalOpen(true);
              }}
              onOpenPresetsModal={() => setIsPresetsModalOpen(true)}
              onQuickUpdateAmount={handleQuickUpdateAmount}
              onContactVendor={(item) => setContactVendorExpense(item)}
            />
          </>
        )}

        {activeTab === 'income' && (
          <IncomeSection
            incomes={incomes}
            currency={currency}
            onToggleActive={handleToggleIncomeActive}
            onEditIncome={(item) => {
              setEditingIncome(item);
              setIsIncomeModalOpen(true);
            }}
            onDeleteIncome={handleDeleteIncome}
            onOpenAddModal={() => {
              setEditingIncome(null);
              setIsIncomeModalOpen(true);
            }}
          />
        )}

        {activeTab === 'utilities' && (
          <UtilitiesSection
            expenses={expenses}
            currency={currency}
            onEditExpense={(item) => {
              setEditingExpense(item);
              setIsAddModalOpen(true);
            }}
            onOpenAddModal={() => {
              setEditingExpense(null);
              setInitialPresetId(null);
              setInitialCategory('utilities');
              setIsAddModalOpen(true);
            }}
            onOpenAddPreset={(presetId) => {
              setEditingExpense(null);
              setInitialPresetId(presetId);
              setIsAddModalOpen(true);
            }}
          />
        )}

        {activeTab === 'education' && (
          <EducationSection
            expenses={expenses}
            currency={currency}
            onEditExpense={(item) => {
              setEditingExpense(item);
              setIsAddModalOpen(true);
            }}
            onOpenAddModal={(cat) => {
              setEditingExpense(null);
              setInitialPresetId(null);
              setInitialCategory(cat || 'education');
              setIsAddModalOpen(true);
            }}
            onOpenAddPreset={(presetId) => {
              setEditingExpense(null);
              setInitialPresetId(presetId);
              setIsAddModalOpen(true);
            }}
          />
        )}

        {activeTab === 'ai-tech' && (
          <AiTechSection
            expenses={expenses}
            currency={currency}
            onToggleActive={handleToggleActive}
            onEditExpense={(item) => {
              setEditingExpense(item);
              setIsAddModalOpen(true);
            }}
            onOpenAddPreset={(presetId) => {
              setEditingExpense(null);
              setInitialPresetId(presetId);
              setIsAddModalOpen(true);
            }}
            onOpenAddModal={() => {
              setEditingExpense(null);
              setInitialPresetId(null);
              setInitialCategory('ai-tech');
              setIsAddModalOpen(true);
            }}
          />
        )}

        {activeTab === 'calendar' && (
          <UpcomingRenewals
            expenses={expenses}
            currency={currency}
            onEditExpense={(item) => {
              setEditingExpense(item);
              setIsAddModalOpen(true);
            }}
          />
        )}

        {activeTab === 'insights' && (
          <OptimizationInsights
            expenses={expenses}
            currency={currency}
          />
        )}

        {activeTab === 'admin' && (
          <AdminSection
            users={users}
            currentUser={currentUser}
            onRefreshUsers={fetchDatabaseData}
            onOpenAddModalWithCategory={(cat) => {
              setEditingExpense(null);
              setInitialPresetId(null);
              setInitialCategory(cat);
              setIsAddModalOpen(true);
            }}
          />
        )}
      </main>

      {/* Editorial Footer */}
      <footer style={{
        borderTop: '1px solid var(--ha-line)',
        backgroundColor: 'var(--ha-paper)',
        padding: '1.25rem 1.5rem',
        color: 'var(--ha-muted)',
        fontSize: '0.8rem',
      }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div>
            Tally — Your household, in balance.
          </div>
          <div>
            Authenticated as <strong>{currentUser?.name || 'Stephen'}</strong> ({currentUser?.role || 'ADMIN'})
          </div>
        </div>
      </footer>

      {/* Add / Edit Expense Modal */}
      <ExpenseModal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setEditingExpense(null);
          setInitialPresetId(null);
          setInitialCategory(null);
        }}
        onSave={handleSaveExpense}
        editingExpense={editingExpense}
        initialPresetId={initialPresetId}
        initialCategory={initialCategory}
        users={users}
        currentUserId={currentUser?.id}
      />

      {/* Add / Edit Income Modal */}
      <IncomeModal
        isOpen={isIncomeModalOpen}
        onClose={() => {
          setIsIncomeModalOpen(false);
          setEditingIncome(null);
        }}
        onSave={handleSaveIncome}
        editingIncome={editingIncome}
        users={users}
        currentUserId={currentUser?.id}
      />

      {/* Popular Presets Modal */}
      <PresetsModal
        isOpen={isPresetsModalOpen}
        onClose={() => setIsPresetsModalOpen(false)}
        expenses={expenses}
        onAddFromPreset={handleAddFromPreset}
      />

      {/* Export / Backup Modal */}
      <ExportImportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        expenses={expenses}
        currency={currency}
        onDataUpdated={setExpenses}
      />

      {/* Share Workspace Modal */}
      <ShareWorkspaceModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        currentUser={currentUser}
        onMembersUpdated={fetchDatabaseData}
      />

      {/* Contact Vendor Modal */}
      <ContactVendorModal
        expense={contactVendorExpense}
        onClose={() => setContactVendorExpense(null)}
      />

      {/* Help Guide Modal */}
      <HelpGuideModal
        isOpen={isHelpModalOpen}
        onClose={() => setIsHelpModalOpen(false)}
        currentUser={currentUser}
      />

      {/* Settings & Preferences Modal */}
      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        currentCurrency={currency}
        onCurrencyChange={setCurrency}
        onOpenPresetsModal={() => setIsPresetsModalOpen(true)}
        onOpenExportModal={() => setIsExportModalOpen(true)}
        onOpenShareModal={() => setIsShareModalOpen(true)}
        onResetData={handleResetData}
      />
    </div>
  );
}
