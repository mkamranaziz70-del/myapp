/*
  Warnings:

  - You are about to drop the column `signupStep` on the `Company` table. All the data in the column will be lost.
  - You are about to drop the column `tempEmail` on the `Company` table. All the data in the column will be lost.
  - You are about to drop the column `tempFullName` on the `Company` table. All the data in the column will be lost.
  - You are about to drop the column `tempPassword` on the `Company` table. All the data in the column will be lost.
  - You are about to drop the column `tempPhone` on the `Company` table. All the data in the column will be lost.
  - You are about to drop the column `signupCompleted` on the `User` table. All the data in the column will be lost.
  - Made the column `operatingStartTime` on table `Company` required. This step will fail if there are existing NULL values in that column.
  - Made the column `operatingEndTime` on table `Company` required. This step will fail if there are existing NULL values in that column.

*/
-- CreateEnum
CREATE TYPE "JobStatus" AS ENUM ('PENDING', 'COMPLETED', 'CANCELLED');

-- DropIndex
DROP INDEX "User_phone_key";

-- AlterTable
ALTER TABLE "Company" DROP COLUMN "signupStep",
DROP COLUMN "tempEmail",
DROP COLUMN "tempFullName",
DROP COLUMN "tempPassword",
DROP COLUMN "tempPhone",
ALTER COLUMN "operatingStartTime" SET NOT NULL,
ALTER COLUMN "operatingEndTime" SET NOT NULL;

-- AlterTable
ALTER TABLE "User" DROP COLUMN "signupCompleted";

-- DropEnum
DROP TYPE "SignupStep";

-- CreateTable
CREATE TABLE "Job" (
    "id" TEXT NOT NULL,
    "title" TEXT,
    "status" "JobStatus" NOT NULL DEFAULT 'PENDING',
    "companyId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Job_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SignupSession" (
    "id" TEXT NOT NULL,
    "companyName" TEXT NOT NULL,
    "primaryServiceType" "ServiceType" NOT NULL,
    "headquartersAddress" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "password" TEXT NOT NULL,
    "otpVerified" BOOLEAN NOT NULL DEFAULT false,
    "operatingDays" TEXT[],
    "operatingStartTime" TEXT,
    "operatingEndTime" TEXT,
    "payoutMethod" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SignupSession_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SignupSession_email_key" ON "SignupSession"("email");

-- AddForeignKey
ALTER TABLE "Job" ADD CONSTRAINT "Job_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
