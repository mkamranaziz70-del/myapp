-- AlterTable
ALTER TABLE "Quotation" ADD COLUMN     "pdfGeneratedAt" TIMESTAMP(3),
ADD COLUMN     "sentPdfUrl" TEXT,
ADD COLUMN     "signedPdfAt" TIMESTAMP(3),
ADD COLUMN     "signedPdfUrl" TEXT;
