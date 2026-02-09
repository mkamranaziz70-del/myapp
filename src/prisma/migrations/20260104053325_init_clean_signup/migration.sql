-- CreateEnum
CREATE TYPE "Role" AS ENUM ('OWNER', 'MANAGER', 'EMPLOYEE');

-- CreateEnum
CREATE TYPE "Plan" AS ENUM ('STARTER', 'PRO', 'ELITE');

-- CreateEnum
CREATE TYPE "ServiceType" AS ENUM ('MOVING', 'STORAGE', 'FULL_SERVICES');

-- CreateEnum
CREATE TYPE "SignupStep" AS ENUM ('STEP_1', 'STEP_2', 'STEP_3', 'STEP_4', 'COMPLETED');

-- CreateTable
CREATE TABLE "Company" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "primaryServiceType" "ServiceType" NOT NULL,
    "headquartersAddress" TEXT NOT NULL,
    "tempFullName" TEXT,
    "tempEmail" TEXT,
    "tempPhone" TEXT,
    "tempPassword" TEXT,
    "operatingDays" TEXT[],
    "operatingStartTime" TEXT,
    "operatingEndTime" TEXT,
    "payoutMethod" TEXT,
    "plan" "Plan" NOT NULL DEFAULT 'STARTER',
    "signupStep" "SignupStep" NOT NULL DEFAULT 'STEP_1',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Company_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "password" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'OWNER',
    "signupCompleted" BOOLEAN NOT NULL DEFAULT true,
    "companyId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_phone_key" ON "User"("phone");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
