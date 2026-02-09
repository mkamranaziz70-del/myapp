-- AlterTable
ALTER TABLE "Quotation" ADD COLUMN     "endAt" TIMESTAMP(3),
ADD COLUMN     "signedDevice" TEXT,
ADD COLUMN     "signedIp" TEXT,
ADD COLUMN     "startAt" TIMESTAMP(3);
