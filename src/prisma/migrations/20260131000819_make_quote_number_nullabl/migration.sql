-- AlterEnum
ALTER TYPE "QuoteStatus" ADD VALUE 'IN_PROGRESS';

-- AlterTable
ALTER TABLE "Quotation" ALTER COLUMN "quoteNumber" DROP NOT NULL;
