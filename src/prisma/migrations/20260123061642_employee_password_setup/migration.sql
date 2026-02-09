-- AlterTable
ALTER TABLE "Employee" ADD COLUMN     "passwordToken" TEXT,
ADD COLUMN     "passwordTokenExpiresAt" TIMESTAMP(3);
