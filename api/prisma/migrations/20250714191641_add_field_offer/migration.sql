-- CreateTable
CREATE TABLE "field_offers" (
    "id" TEXT NOT NULL,
    "field_listing_id" TEXT NOT NULL,
    "offer_from_user_id" TEXT NOT NULL,
    "match_date" TIMESTAMP(3) NOT NULL,
    "start_time" TEXT NOT NULL,
    "end_time" TEXT NOT NULL,
    "description" TEXT,
    "offered_price" DECIMAL(10,2) NOT NULL,
    "status" "OfferStatus" NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "field_offers_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "field_offers" ADD CONSTRAINT "field_offers_field_listing_id_fkey" FOREIGN KEY ("field_listing_id") REFERENCES "field_listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "field_offers" ADD CONSTRAINT "field_offers_offer_from_user_id_fkey" FOREIGN KEY ("offer_from_user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
