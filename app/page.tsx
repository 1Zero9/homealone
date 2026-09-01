'use client';

import { useState, useEffect } from 'react';
import type { ExpenseItem, CurrencyCode, PresetItem } from '@/src/types/expense';
import { loadExpenses, saveExpenses, loadCurrency, saveCurrency, resetToDefaults } from '@/src/services/storage';
import { fetchExpensesFromCloud, syncExpenseToCloud, deleteExpenseFromCloud, isCloudSyncConfigured } from '@/src/services/supabase';
import { calculateSpendingSummary } from '@/src/utils/calculations';
import { Navbar } from '@/src/components/Navbar';
import { DashboardStats } from '@/src/components/DashboardStats';
import { CategoryBreakdownChart } from '@/src/components/CategoryBreakdownChart';
import { ExpenseList } from '@/src/components/ExpenseList';
import { AiTechSection } from '@/src/components/AiTechSection';
import { UtilitiesSection } from '@/src/components/UtilitiesSection';
import { UpcomingRenewals } from '@/src/components/UpcomingRenewals';
import { OptimizationInsights } from '@/src/components/OptimizationInsights';
import { ExpenseModal } from '@/src/components/ExpenseModal';
import { PresetsModal } from '@/src/components/PresetsModal';
import { ExportImportModal } from '@/src/components/ExportImportModal';

export default function HomeAlonePage() {
  const [expenses, setExpenses] = useState<ExpenseItem[]>([]);
  const [currency, setCurrency] = useState<CurrencyCode>('EUR');
  const [activeTab, setActiveTab] = useState<'all' | 'ai-tech' | 'utilities' | 'calendar' | 'insights'>('all');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isPresetsModalOpen, setIsPresetsModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<ExpenseItem | null>(null);
  const [initialPresetId, setInitialPresetId] = useState<string | null>(null);

  // Initial load from local or cloud
  useEffect(() => {
    const localExpenses = loadExpenses();
    const localCurrency = loadCurrency();
    setExpenses(localExpenses);
    setCurrency(localCurrency);
    setIsLoaded(true);

    // If cloud sync is configured, check for latest remote records
    if (isCloudSyncConfigured) {
      fetchExpensesFromCloud().then((cloudItems) => {
        if (cloudItems && cloudItems.length > 0) {
          setExpenses(cloudItems);
          saveExpenses(cloudItems);
        }
      });
    }
  }, []);

  // Save changes locally
  useEffect(() => {
    if (isLoaded) {
      saveExpenses(expenses);
    }
  }, [expenses, isLoaded]);

  useEffect(() => {
    if (isLoaded) {
      saveCurrency(currency);
    }
  }, [currency, isLoaded]);

  // Compute spend analytics summary
  const summary = calculateSpendingSummary(expenses, currency);

  // Toggle active/pause status
  const handleToggleActive = (id: string) => {
    setExpenses((prev) => {
      const updated = prev.map((item) => {
        if (item.id === id) {
          const itemUpdated = { ...item, isActive: !item.isActive, updatedAt: new Date().toISOString() };
          syncExpenseToCloud(itemUpdated);
          return itemUpdated;
        }
        return item;
      });
      return updated;
    });
  };

  // Save new or edited expense
  const handleSaveExpense = (
    expenseData: Omit<ExpenseItem, 'id' | 'createdAt' | 'updatedAt'>,
    existingId?: string
  ) => {
    if (existingId) {
      setExpenses((prev) =>
        prev.map((item) => {
          if (item.id === existingId) {
            const updated = { ...item, ...expenseData, updatedAt: new Date().toISOString() };
            syncExpenseToCloud(updated);
            return updated;
          }
          return item;
        })
      );
    } else {
      const newItem: ExpenseItem = {
        ...expenseData,
        id: `exp-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      syncExpenseToCloud(newItem);
      setExpenses((prev) => [newItem, ...prev]);
    }
  };

  // Duplicate an expense
  const handleDuplicateExpense = (item: ExpenseItem) => {
    const duplicated: ExpenseItem = {
      ...item,
      id: `exp-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      name: `${item.name} (Copy)`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    syncExpenseToCloud(duplicated);
    setExpenses((prev) => [duplicated, ...prev]);
  };

  // Delete an expense
  const handleDeleteExpense = (id: string) => {
    const item = expenses.find((e) => e.id === id);
    if (window.confirm(`Remove "${item?.name || 'this record'}"?`)) {
      deleteExpenseFromCloud(id);
      setExpenses((prev) => prev.filter((e) => e.id !== id));
    }
  };

  // Add from catalog preset
  const handleAddFromPreset = (preset: PresetItem) => {
    const now = new Date();
    const nextRenewalDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];

    const newItem: ExpenseItem = {
      id: `exp-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      name: preset.name,
      amount: preset.defaultAmount,
      currency: 'EUR',
      billingCycle: preset.defaultCycle,
      category: preset.category,
      icon: preset.icon,
      color: preset.color,
      renewalDay: 1,
      nextRenewalDate,
      paymentMethod: preset.defaultPaymentMethod,
      isActive: true,
      notes: preset.description,
      usageRating: 'high',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    syncExpenseToCloud(newItem);
    setExpenses((prev) => [newItem, ...prev]);
  };

  // Reset sample data
  const handleResetData = () => {
    if (window.confirm('Reset all expense records to the default sample dataset?')) {
      const sample = resetToDefaults();
      setExpenses(sample);
      setSelectedCategory(null);
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
          else setSelectedCategory(null);
        }}
        onOpenAddModal={() => {
          setEditingExpense(null);
          setInitialPresetId(null);
          setIsAddModalOpen(true);
        }}
        onOpenPresetsModal={() => setIsPresetsModalOpen(true)}
        onOpenExportModal={() => setIsExportModalOpen(true)}
        onResetData={handleResetData}
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
                setIsAddModalOpen(true);
              }}
              onDuplicateExpense={handleDuplicateExpense}
              onDeleteExpense={handleDeleteExpense}
              onOpenAddModal={() => {
                setEditingExpense(null);
                setInitialPresetId(null);
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
            Next.js App Router • Multi-device cloud sync enabled
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
        }}
        onSave={handleSaveExpense}
        editingExpense={editingExpense}
        initialPresetId={initialPresetId}
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
