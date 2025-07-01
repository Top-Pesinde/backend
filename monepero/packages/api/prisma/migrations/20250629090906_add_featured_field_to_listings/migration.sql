-- AlterTable
ALTER TABLE "field_listings" ADD COLUMN     "featured" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "goalkeeper_listings" ADD COLUMN     "featured" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "referee_listings" ADD COLUMN     "featured" BOOLEAN NOT NULL DEFAULT false;
