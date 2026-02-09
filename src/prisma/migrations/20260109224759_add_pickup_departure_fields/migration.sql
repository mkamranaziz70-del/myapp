-- AlterTable
ALTER TABLE "Quotation" ADD COLUMN     "dropoffAccessNotes" TEXT,
ADD COLUMN     "dropoffAddress" TEXT,
ADD COLUMN     "dropoffElevator" BOOLEAN,
ADD COLUMN     "dropoffFloor" INTEGER,
ADD COLUMN     "dropoffLoadingDock" BOOLEAN,
ADD COLUMN     "dropoffParkingDifficulty" TEXT,
ADD COLUMN     "dropoffStairsWidth" TEXT,
ADD COLUMN     "dropoffUnit" TEXT,
ADD COLUMN     "dropoffWalkingDistance" INTEGER;
