-- AlterTable
ALTER TABLE "Quotation" ADD COLUMN     "parkingDifficulty" TEXT,
ADD COLUMN     "pickupAccessNotes" TEXT,
ADD COLUMN     "pickupAddress" TEXT,
ADD COLUMN     "pickupElevator" BOOLEAN,
ADD COLUMN     "pickupFloor" INTEGER,
ADD COLUMN     "pickupLoadingDock" BOOLEAN,
ADD COLUMN     "pickupUnit" TEXT,
ADD COLUMN     "stairsWidth" TEXT,
ADD COLUMN     "walkingDistance" INTEGER;
