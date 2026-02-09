-- AlterTable
ALTER TABLE "Quotation" ADD COLUMN     "discount" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "estimatedVolumeCft" DOUBLE PRECISION,
ADD COLUMN     "estimatedWeightLbs" DOUBLE PRECISION,
ADD COLUMN     "internalNotes" TEXT,
ADD COLUMN     "inventoryNotes" TEXT,
ADD COLUMN     "materialsCost" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "otherFees" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "termsText" TEXT,
ADD COLUMN     "truckSize" TEXT,
ADD COLUMN     "validityDays" INTEGER;
