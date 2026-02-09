/*
  Warnings:

  - A unique constraint covering the columns `[confirmationToken]` on the table `Employee` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "EmployeeStatus" AS ENUM ('PENDING', 'ACTIVE', 'DISABLED');

-- AlterTable
ALTER TABLE "Employee" ADD COLUMN     "confirmationToken" TEXT,
ADD COLUMN     "status" "EmployeeStatus" NOT NULL DEFAULT 'PENDING';

-- CreateIndex
CREATE UNIQUE INDEX "Employee_confirmationToken_key" ON "Employee"("confirmationToken");
