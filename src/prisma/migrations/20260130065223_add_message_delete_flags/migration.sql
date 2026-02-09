-- AlterTable
ALTER TABLE "Message" ADD COLUMN     "deletedForAll" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "deletedForUsers" TEXT[] DEFAULT ARRAY[]::TEXT[];
