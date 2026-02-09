-- CreateTable
CREATE TABLE "VolumeCalculation" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "customerId" TEXT,
    "customerName" TEXT,
    "inventoryJson" JSONB NOT NULL,
    "breakdownJson" JSONB NOT NULL,
    "totalVolumeCft" INTEGER NOT NULL,
    "estimatedWeightLbs" INTEGER NOT NULL,
    "suggestedTruck" TEXT NOT NULL,
    "suggestedWorkers" INTEGER NOT NULL,
    "truckCapacityPercent" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VolumeCalculation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "VolumeCalculation_companyId_idx" ON "VolumeCalculation"("companyId");
