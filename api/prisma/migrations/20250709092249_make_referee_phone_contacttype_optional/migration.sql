-- AlterTable
ALTER TABLE "referee_listings" ALTER COLUMN "phone" DROP NOT NULL,
ALTER COLUMN "contact_type" DROP NOT NULL,
ALTER COLUMN "contact_type" DROP DEFAULT;
