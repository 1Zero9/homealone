-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'MEMBER', 'BACKUP_ADMIN');

-- CreateEnum
CREATE TYPE "AccountType" AS ENUM ('CHECKING', 'SAVINGS', 'CREDIT_UNION', 'CREDIT_CARD', 'DEBIT_CARD', 'PAYPAL', 'LOAN', 'INVESTMENT', 'OTHER');

-- CreateEnum
CREATE TYPE "StatementTxStatus" AS ENUM ('UNMATCHED', 'MATCHED', 'IGNORED', 'DUPLICATE');

-- CreateEnum
CREATE TYPE "StatementTxDirection" AS ENUM ('DEBIT', 'CREDIT');

-- CreateEnum
CREATE TYPE "BugSeverity" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "BugStatus" AS ENUM ('OPEN', 'FIXED');

-- CreateTable
CREATE TABLE "Household" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL DEFAULT 'Our Household',
    "inviteCode" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Household_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'MEMBER',
    "avatarUrl" TEXT,
    "householdId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationToken" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VerificationToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Expense" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "vendor" TEXT,
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "billingCycle" TEXT NOT NULL DEFAULT 'monthly',
    "category" TEXT NOT NULL DEFAULT 'utilities',
    "icon" TEXT NOT NULL DEFAULT 'Zap',
    "color" TEXT NOT NULL DEFAULT '#3155D9',
    "renewalDay" INTEGER NOT NULL DEFAULT 1,
    "nextRenewalDate" TEXT NOT NULL,
    "isPaidThisCycle" BOOLEAN NOT NULL DEFAULT false,
    "lastPaidAt" TIMESTAMP(3),
    "paymentMethod" TEXT NOT NULL DEFAULT 'SEPA Direct Debit',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isPending" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "contractEndDate" TEXT,
    "vendorEmail" TEXT,
    "usageRating" TEXT DEFAULT 'high',
    "isVariable" BOOLEAN NOT NULL DEFAULT false,
    "isBill" BOOLEAN NOT NULL DEFAULT true,
    "householdId" TEXT,
    "createdById" TEXT,
    "paymentAccountId" TEXT,
    "linkedGoalId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Expense_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Income" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "frequency" TEXT NOT NULL DEFAULT 'monthly',
    "nextPayDate" TEXT,
    "category" TEXT NOT NULL DEFAULT 'salary',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "isReceivedThisCycle" BOOLEAN NOT NULL DEFAULT false,
    "lastReceivedAt" TIMESTAMP(3),
    "householdId" TEXT,
    "createdById" TEXT,
    "depositAccountId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Income_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "institution" TEXT,
    "type" "AccountType" NOT NULL DEFAULT 'OTHER',
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "notes" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "balance" DOUBLE PRECISION,
    "balanceAsOf" TEXT,
    "accountNumberEnc" TEXT,
    "routingNumberEnc" TEXT,
    "ibanEnc" TEXT,
    "bicEnc" TEXT,
    "loginUsernameEnc" TEXT,
    "loginPasswordEnc" TEXT,
    "loginUrlEnc" TEXT,
    "securityNotesEnc" TEXT,
    "originalAmount" DOUBLE PRECISION,
    "interestRate" DOUBLE PRECISION,
    "termMonths" INTEGER,
    "payoffDate" TEXT,
    "householdId" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Transfer" (
    "id" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "date" TEXT NOT NULL,
    "note" TEXT,
    "externalLabel" TEXT,
    "fromAccountId" TEXT,
    "toAccountId" TEXT,
    "linkedExpenseId" TEXT,
    "linkedIncomeId" TEXT,
    "householdId" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Transfer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Goal" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "targetAmount" DOUBLE PRECISION NOT NULL,
    "currentAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "targetDate" TEXT,
    "notes" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "linkedAccountId" TEXT,
    "householdId" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Goal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StatementImport" (
    "id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "fileName" TEXT,
    "accountId" TEXT,
    "householdId" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StatementImport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StatementTransaction" (
    "id" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "rawDescription" TEXT NOT NULL,
    "normalizedDescription" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "direction" "StatementTxDirection" NOT NULL DEFAULT 'DEBIT',
    "status" "StatementTxStatus" NOT NULL DEFAULT 'UNMATCHED',
    "matchConfidence" DOUBLE PRECISION,
    "notes" TEXT,
    "suggestedCategory" TEXT,
    "vendorName" TEXT,
    "importId" TEXT NOT NULL,
    "householdId" TEXT,
    "matchedExpenseId" TEXT,
    "matchedTransferId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StatementTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MerchantAlias" (
    "id" TEXT NOT NULL,
    "pattern" TEXT NOT NULL,
    "vendorName" TEXT NOT NULL,
    "category" TEXT,
    "matchCount" INTEGER NOT NULL DEFAULT 1,
    "householdId" TEXT,
    "expenseId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MerchantAlias_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Category" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "icon" TEXT NOT NULL DEFAULT 'Tag',
    "color" TEXT NOT NULL DEFAULT '#676B73',
    "bgColor" TEXT NOT NULL DEFAULT '#f1f2f4',
    "borderColor" TEXT NOT NULL DEFAULT '#e7e8ea',
    "householdId" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Budget" (
    "id" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "monthlyLimit" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "householdId" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Budget_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SentReminder" (
    "id" TEXT NOT NULL,
    "expenseId" TEXT NOT NULL,
    "threshold" INTEGER NOT NULL,
    "sentOn" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SentReminder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DatabaseBackup" (
    "id" TEXT NOT NULL,
    "createdById" TEXT,
    "payloadJson" JSONB NOT NULL,
    "recordCount" INTEGER NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "householdId" TEXT,

    CONSTRAINT "DatabaseBackup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MapNode" (
    "id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "kind" TEXT NOT NULL DEFAULT 'CUSTOM',
    "color" TEXT,
    "x" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "y" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "accountId" TEXT,
    "householdId" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MapNode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MapEdge" (
    "id" TEXT NOT NULL,
    "label" TEXT,
    "amount" DOUBLE PRECISION,
    "currency" TEXT,
    "fromNodeId" TEXT NOT NULL,
    "toNodeId" TEXT NOT NULL,
    "householdId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MapEdge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BugReport" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "area" TEXT,
    "severity" "BugSeverity" NOT NULL DEFAULT 'MEDIUM',
    "status" "BugStatus" NOT NULL DEFAULT 'OPEN',
    "householdId" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BugReport_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Household_inviteCode_key" ON "Household"("inviteCode");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Session_token_key" ON "Session"("token");

-- CreateIndex
CREATE INDEX "Expense_householdId_idx" ON "Expense"("householdId");

-- CreateIndex
CREATE INDEX "Expense_paymentAccountId_idx" ON "Expense"("paymentAccountId");

-- CreateIndex
CREATE INDEX "Income_householdId_idx" ON "Income"("householdId");

-- CreateIndex
CREATE INDEX "Income_depositAccountId_idx" ON "Income"("depositAccountId");

-- CreateIndex
CREATE INDEX "Account_householdId_idx" ON "Account"("householdId");

-- CreateIndex
CREATE INDEX "Transfer_householdId_idx" ON "Transfer"("householdId");

-- CreateIndex
CREATE INDEX "Transfer_fromAccountId_idx" ON "Transfer"("fromAccountId");

-- CreateIndex
CREATE INDEX "Transfer_toAccountId_idx" ON "Transfer"("toAccountId");

-- CreateIndex
CREATE INDEX "Transfer_date_idx" ON "Transfer"("date");

-- CreateIndex
CREATE INDEX "Goal_householdId_idx" ON "Goal"("householdId");

-- CreateIndex
CREATE INDEX "StatementImport_householdId_idx" ON "StatementImport"("householdId");

-- CreateIndex
CREATE INDEX "StatementImport_accountId_idx" ON "StatementImport"("accountId");

-- CreateIndex
CREATE INDEX "StatementTransaction_householdId_idx" ON "StatementTransaction"("householdId");

-- CreateIndex
CREATE INDEX "StatementTransaction_importId_idx" ON "StatementTransaction"("importId");

-- CreateIndex
CREATE INDEX "StatementTransaction_matchedExpenseId_idx" ON "StatementTransaction"("matchedExpenseId");

-- CreateIndex
CREATE INDEX "StatementTransaction_matchedTransferId_idx" ON "StatementTransaction"("matchedTransferId");

-- CreateIndex
CREATE INDEX "StatementTransaction_status_idx" ON "StatementTransaction"("status");

-- CreateIndex
CREATE INDEX "MerchantAlias_householdId_idx" ON "MerchantAlias"("householdId");

-- CreateIndex
CREATE UNIQUE INDEX "MerchantAlias_householdId_pattern_key" ON "MerchantAlias"("householdId", "pattern");

-- CreateIndex
CREATE INDEX "Category_householdId_idx" ON "Category"("householdId");

-- CreateIndex
CREATE UNIQUE INDEX "Category_householdId_name_key" ON "Category"("householdId", "name");

-- CreateIndex
CREATE INDEX "Budget_householdId_idx" ON "Budget"("householdId");

-- CreateIndex
CREATE UNIQUE INDEX "Budget_householdId_category_key" ON "Budget"("householdId", "category");

-- CreateIndex
CREATE INDEX "SentReminder_expenseId_idx" ON "SentReminder"("expenseId");

-- CreateIndex
CREATE UNIQUE INDEX "SentReminder_expenseId_threshold_sentOn_key" ON "SentReminder"("expenseId", "threshold", "sentOn");

-- CreateIndex
CREATE INDEX "DatabaseBackup_householdId_idx" ON "DatabaseBackup"("householdId");

-- CreateIndex
CREATE INDEX "MapNode_householdId_idx" ON "MapNode"("householdId");

-- CreateIndex
CREATE INDEX "MapNode_accountId_idx" ON "MapNode"("accountId");

-- CreateIndex
CREATE INDEX "MapEdge_householdId_idx" ON "MapEdge"("householdId");

-- CreateIndex
CREATE INDEX "MapEdge_fromNodeId_idx" ON "MapEdge"("fromNodeId");

-- CreateIndex
CREATE INDEX "MapEdge_toNodeId_idx" ON "MapEdge"("toNodeId");

-- CreateIndex
CREATE INDEX "BugReport_householdId_idx" ON "BugReport"("householdId");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_householdId_fkey" FOREIGN KEY ("householdId") REFERENCES "Household"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_householdId_fkey" FOREIGN KEY ("householdId") REFERENCES "Household"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_paymentAccountId_fkey" FOREIGN KEY ("paymentAccountId") REFERENCES "Account"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_linkedGoalId_fkey" FOREIGN KEY ("linkedGoalId") REFERENCES "Goal"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Income" ADD CONSTRAINT "Income_householdId_fkey" FOREIGN KEY ("householdId") REFERENCES "Household"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Income" ADD CONSTRAINT "Income_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Income" ADD CONSTRAINT "Income_depositAccountId_fkey" FOREIGN KEY ("depositAccountId") REFERENCES "Account"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_householdId_fkey" FOREIGN KEY ("householdId") REFERENCES "Household"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transfer" ADD CONSTRAINT "Transfer_fromAccountId_fkey" FOREIGN KEY ("fromAccountId") REFERENCES "Account"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transfer" ADD CONSTRAINT "Transfer_toAccountId_fkey" FOREIGN KEY ("toAccountId") REFERENCES "Account"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transfer" ADD CONSTRAINT "Transfer_linkedExpenseId_fkey" FOREIGN KEY ("linkedExpenseId") REFERENCES "Expense"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transfer" ADD CONSTRAINT "Transfer_linkedIncomeId_fkey" FOREIGN KEY ("linkedIncomeId") REFERENCES "Income"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transfer" ADD CONSTRAINT "Transfer_householdId_fkey" FOREIGN KEY ("householdId") REFERENCES "Household"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transfer" ADD CONSTRAINT "Transfer_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Goal" ADD CONSTRAINT "Goal_linkedAccountId_fkey" FOREIGN KEY ("linkedAccountId") REFERENCES "Account"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Goal" ADD CONSTRAINT "Goal_householdId_fkey" FOREIGN KEY ("householdId") REFERENCES "Household"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Goal" ADD CONSTRAINT "Goal_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StatementImport" ADD CONSTRAINT "StatementImport_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StatementImport" ADD CONSTRAINT "StatementImport_householdId_fkey" FOREIGN KEY ("householdId") REFERENCES "Household"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StatementImport" ADD CONSTRAINT "StatementImport_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StatementTransaction" ADD CONSTRAINT "StatementTransaction_importId_fkey" FOREIGN KEY ("importId") REFERENCES "StatementImport"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StatementTransaction" ADD CONSTRAINT "StatementTransaction_householdId_fkey" FOREIGN KEY ("householdId") REFERENCES "Household"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StatementTransaction" ADD CONSTRAINT "StatementTransaction_matchedExpenseId_fkey" FOREIGN KEY ("matchedExpenseId") REFERENCES "Expense"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StatementTransaction" ADD CONSTRAINT "StatementTransaction_matchedTransferId_fkey" FOREIGN KEY ("matchedTransferId") REFERENCES "Transfer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MerchantAlias" ADD CONSTRAINT "MerchantAlias_householdId_fkey" FOREIGN KEY ("householdId") REFERENCES "Household"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MerchantAlias" ADD CONSTRAINT "MerchantAlias_expenseId_fkey" FOREIGN KEY ("expenseId") REFERENCES "Expense"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Category" ADD CONSTRAINT "Category_householdId_fkey" FOREIGN KEY ("householdId") REFERENCES "Household"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Category" ADD CONSTRAINT "Category_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Budget" ADD CONSTRAINT "Budget_householdId_fkey" FOREIGN KEY ("householdId") REFERENCES "Household"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Budget" ADD CONSTRAINT "Budget_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DatabaseBackup" ADD CONSTRAINT "DatabaseBackup_householdId_fkey" FOREIGN KEY ("householdId") REFERENCES "Household"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MapNode" ADD CONSTRAINT "MapNode_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MapNode" ADD CONSTRAINT "MapNode_householdId_fkey" FOREIGN KEY ("householdId") REFERENCES "Household"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MapNode" ADD CONSTRAINT "MapNode_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MapEdge" ADD CONSTRAINT "MapEdge_fromNodeId_fkey" FOREIGN KEY ("fromNodeId") REFERENCES "MapNode"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MapEdge" ADD CONSTRAINT "MapEdge_toNodeId_fkey" FOREIGN KEY ("toNodeId") REFERENCES "MapNode"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MapEdge" ADD CONSTRAINT "MapEdge_householdId_fkey" FOREIGN KEY ("householdId") REFERENCES "Household"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BugReport" ADD CONSTRAINT "BugReport_householdId_fkey" FOREIGN KEY ("householdId") REFERENCES "Household"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BugReport" ADD CONSTRAINT "BugReport_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

