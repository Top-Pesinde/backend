-- CreateEnum
CREATE TYPE "SurfaceType" AS ENUM ('GRASS', 'ARTIFICIAL', 'CONCRETE', 'CARPET');

-- CreateEnum
CREATE TYPE "ContactType" AS ENUM ('PHONE', 'WHATSAPP');

-- CreateEnum
CREATE TYPE "DayOfWeek" AS ENUM ('MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY');

-- CreateEnum
CREATE TYPE "FeatureType" AS ENUM ('OPEN_24_7', 'ONLINE_RESERVATION', 'FREE_WIFI', 'SECURITY_CAMERA', 'CHANGING_ROOM', 'SHOWER', 'TOILET', 'PARKING', 'CAFE', 'TRIBUNE', 'RENTAL_SHOES', 'RENTAL_GLOVES');

-- CreateTable
CREATE TABLE "field_listings" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "field_name" TEXT NOT NULL,
    "field_address" TEXT NOT NULL,
    "hourly_price" DECIMAL(10,2) NOT NULL,
    "is_indoor" BOOLEAN NOT NULL,
    "surface_type" "SurfaceType" NOT NULL,
    "phone" TEXT NOT NULL,
    "contact_type" "ContactType" NOT NULL DEFAULT 'PHONE',
    "description" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "field_listings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sub_fields" (
    "id" TEXT NOT NULL,
    "field_listing_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "surface_type" "SurfaceType" NOT NULL,
    "hourly_price" DECIMAL(10,2) NOT NULL,
    "is_indoor" BOOLEAN NOT NULL,

    CONSTRAINT "sub_fields_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "field_schedules" (
    "id" TEXT NOT NULL,
    "field_listing_id" TEXT NOT NULL,
    "day_of_week" "DayOfWeek" NOT NULL,
    "start_time" TEXT NOT NULL,
    "end_time" TEXT NOT NULL,

    CONSTRAINT "field_schedules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "field_features" (
    "id" TEXT NOT NULL,
    "field_listing_id" TEXT NOT NULL,
    "feature_type" "FeatureType" NOT NULL,

    CONSTRAINT "field_features_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "field_photos" (
    "id" TEXT NOT NULL,
    "field_listing_id" TEXT NOT NULL,
    "photo_url" TEXT NOT NULL,
    "photo_order" INTEGER NOT NULL,

    CONSTRAINT "field_photos_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "field_listings_user_id_key" ON "field_listings"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "field_features_field_listing_id_feature_type_key" ON "field_features"("field_listing_id", "feature_type");

-- AddForeignKey
ALTER TABLE "field_listings" ADD CONSTRAINT "field_listings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sub_fields" ADD CONSTRAINT "sub_fields_field_listing_id_fkey" FOREIGN KEY ("field_listing_id") REFERENCES "field_listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "field_schedules" ADD CONSTRAINT "field_schedules_field_listing_id_fkey" FOREIGN KEY ("field_listing_id") REFERENCES "field_listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "field_features" ADD CONSTRAINT "field_features_field_listing_id_fkey" FOREIGN KEY ("field_listing_id") REFERENCES "field_listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "field_photos" ADD CONSTRAINT "field_photos_field_listing_id_fkey" FOREIGN KEY ("field_listing_id") REFERENCES "field_listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
