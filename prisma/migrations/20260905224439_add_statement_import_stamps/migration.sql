-- AlterTable
ALTER TABLE "Expense" ADD COLUMN     "statementImportId" TEXT;

-- AlterTable
ALTER TABLE "Transfer" ADD COLUMN     "statementImportId" TEXT;

-- CreateIndex
CREATE INDEX "Expense_statementImportId_idx" ON "Expense"("statementImportId");

-- CreateIndex
CREATE INDEX "Transfer_statementImportId_idx" ON "Transfer"("statementImportId");

-- AddForeignKey
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_statementImportId_fkey" FOREIGN KEY ("statementImportId") REFERENCES "StatementImport"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transfer" ADD CONSTRAINT "Transfer_statementImportId_fkey" FOREIGN KEY ("statementImportId") REFERENCES "StatementImport"("id") ON DELETE SET NULL ON UPDATE CASCADE;
