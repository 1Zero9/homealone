-- AlterTable
ALTER TABLE "StatementImport" ADD COLUMN     "closingBalance" DOUBLE PRECISION,
ADD COLUMN     "openingBalance" DOUBLE PRECISION,
ADD COLUMN     "statementPeriod" TEXT;
