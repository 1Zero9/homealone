'use client';

import { useState, useEffect, useCallback } from 'react';
import type { ExpenseItem, CurrencyCode, PresetItem, UserProfile } from '@/src/types/expense';
import { loadCurrency, saveCurrency, resetToDefaults } from '@/src/services/storage';
import { calculateSpendingSummary } from '@/src/utils/calculations';
import { Navbar } from '@/src/components/Navbar';
import { DashboardStats } from '@/src/components/DashboardStats';
import { CategoryBreakdownChart } from '@/src/components/CategoryBreakdownChart';
import { ExpenseList } from '@/src/components/ExpenseList';
import { AiTechSection } from '@/src/components/AiTechSection';
import { UtilitiesSection } from '@/src/components/UtilitiesSection';
import { EducationSection } from '@/src/components/EducationSection';
import { UpcomingRenewals } from '@/src/components/UpcomingRenewals';
import { OptimizationInsights } from '@/src/components/OptimizationInsights';
import { AdminSection } from '@/src/components/AdminSection';
import { ExpenseModal } from '@/src/components/ExpenseModal';
import { PresetsModal } from '@/src/components/PresetsModal';
import { ExportImportModal } from '@/src/components/ExportImportModal';

export default function HomeAlonePage() {
  const [expenses, setExpenses] = useState<ExpenseItem[]>([]);
  const [currency, setCurrency] = useState<CurrencyCode>('EUR');
  const [activeTab, setActiveTab] = useState<'all' | 'ai-tech' | 'utilities' | 'education' | 'calendar' | 'insights' | 'admin'>('all');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Users
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isPresetsModalOpen, setIsPresetsModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<ExpenseItem | null>(null);
  const [initialPresetId, setInitialPresetId] = useState<string | null>(null);
  const [initialCategory, setInitialCategory] = useState<string | null>(null);

  // Fetch users & expenses from Prisma PostgreSQL API
  const fetchDatabaseData = useCallback(async () => {
    try {
      // 1. Fetch Users
      const userRes = await fetch('/api/users');
      const userData = await userRes.json();
      if (userData.status === 'ok' && Array.isArray(userData.users)) {
        setUsers(userData.users);
        if (!currentUser && userData.users.length > 0) {
          setCurrentUser(userData.users[0]);
        }
      }

      // 2. Fetch Expenses from PostgreSQL
      const expRes = await fetch('/api/expenses');
      const expData = await expRes.json();
      if (expData.status === 'ok' && Array.isArray(expData.expenses)) {
        setExpenses(expData.expenses);
      }
    } catch (err) {
      console.error('Failed to load from database:', err);
    }
  }, [currentUser]);

  useEffect(() => {
    setCurrency(loadCurrency());
    fetchDatabaseData();
  }, [fetchDatabaseData]);

  useEffect(() => {
    saveCurrency(currency);
  }, [currency]);

  // Compute spend analytics summary
  const summary = calculateSpendingSummary(expenses, currency);

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

  // Reset sample data
  const handleResetData = async () => {
    if (window.confirm('Reset all expense records to the default sample dataset?')) {
      const sample = resetToDefaults();
      setExpenses(sample);
      setSelectedCategory(null);
      fetchDatabaseData();
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--ha-paper)' }}>
      {/* Top Sticky Navigation */}
      <Navbar
        currentCurrency={currency}
        onCurrencyChange={setCurrency}
        monthlyTotal={summary.monthlyTotal}
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
        onOpenPresetsModal={() => setIsPresetsModalOpen(true)}
        onOpenExportModal={() => setIsExportModalOpen(true)}
        onResetData={handleResetData}
        currentUser={currentUser}
        users={users}
        onSelectUser={setCurrentUser}
      />

      {/* Main Container Content */}
      <main style={{
        maxWidth: '1280px',
        width: '100%',
        margin: '0 auto',
        padding: '1.75rem 1.5rem',
        flex: 1,
      }}>
        {/* Top Spend Summary Cards */}
        <DashboardStats
          summary={summary}
          currency={currency}
          onFilterCategory={(cat) => {
            if (cat === 'ai-tech') setActiveTab('ai-tech');
            else if (cat === 'utilities') setActiveTab('utilities');
            else if (cat === 'education') setActiveTab('education');
            else {
              setSelectedCategory(cat);
              setActiveTab('all');
            }
          }}
        />

        {/* Tab View Routing */}
        {activeTab === 'all' && (
          <>
            {/* Category Distribution Breakdown */}
            <CategoryBreakdownChart
              expenses={expenses}
              currency={currency}
              selectedCategory={selectedCategory}
              onSelectCategory={setSelectedCategory}
            />

            {/* Complete Household Ledger */}
            <ExpenseList
              expenses={expenses}
              currency={currency}
              selectedCategory={selectedCategory}
              onSelectCategory={setSelectedCategory}
              onToggleActive={handleToggleActive}
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
            />
          </>
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
            Home Alone — Simple records. Clearer days.
          </div>
          <div>
            Prisma PostgreSQL connected • Logged in as <strong>{currentUser?.name || 'Stephen'}</strong> ({currentUser?.role || 'ADMIN'})
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
    </div>
  );
}
