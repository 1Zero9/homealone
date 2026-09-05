-- AlterTable
ALTER TABLE "Expense" ADD COLUMN     "exchangeRate" DOUBLE PRECISION,
ADD COLUMN     "originalAmount" DOUBLE PRECISION,
ADD COLUMN     "originalCurrency" TEXT,
ADD COLUMN     "rateDate" TEXT;
