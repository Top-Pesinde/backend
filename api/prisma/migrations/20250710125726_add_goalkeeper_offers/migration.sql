-- CreateEnum
CREATE TYPE "OfferStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED', 'CANCELLED');

-- CreateTable
CREATE TABLE "goalkeeper_offers" (
    "id" TEXT NOT NULL,
    "listing_id" TEXT NOT NULL,
    "offer_from_user_id" TEXT NOT NULL,
    "offer_to_user_id" TEXT NOT NULL,
    "match_date" TIMESTAMP(3) NOT NULL,
    "start_time" TEXT NOT NULL,
    "end_time" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "description" TEXT,
    "offered_price" DECIMAL(10,2) NOT NULL,
    "status" "OfferStatus" NOT NULL DEFAULT 'PENDING',
    "message" TEXT,
    "response_message" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "goalkeeper_offers_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "goalkeeper_offers" ADD CONSTRAINT "goalkeeper_offers_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "goalkeeper_listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "goalkeeper_offers" ADD CONSTRAINT "goalkeeper_offers_offer_from_user_id_fkey" FOREIGN KEY ("offer_from_user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "goalkeeper_offers" ADD CONSTRAINT "goalkeeper_offers_offer_to_user_id_fkey" FOREIGN KEY ("offer_to_user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
