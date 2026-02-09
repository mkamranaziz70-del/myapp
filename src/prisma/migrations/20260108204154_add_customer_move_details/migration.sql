/*
  Warnings:

  - Added the required column `dropoffAddress` to the `Customer` table without a default value. This is not possible if the table is not empty.
  - Added the required column `floor` to the `Customer` table without a default value. This is not possible if the table is not empty.
  - Added the required column `pickupAddress` to the `Customer` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Customer" ADD COLUMN     "dropoffAddress" TEXT NOT NULL,
ADD COLUMN     "elevator" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "floor" INTEGER NOT NULL,
ADD COLUMN     "notes" TEXT,
ADD COLUMN     "parking" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "pickupAddress" TEXT NOT NULL;
