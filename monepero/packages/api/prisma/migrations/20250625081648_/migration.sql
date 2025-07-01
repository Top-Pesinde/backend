-- CreateTable
CREATE TABLE "goalkeeper_listings" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "has_license" BOOLEAN NOT NULL DEFAULT false,
    "hourly_price" DECIMAL(10,2) NOT NULL,
    "bio" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "contact_type" "ContactType" NOT NULL DEFAULT 'PHONE',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "goalkeeper_listings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "referee_listings" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "has_license" BOOLEAN NOT NULL DEFAULT false,
    "hourly_price" DECIMAL(10,2) NOT NULL,
    "bio" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "contact_type" "ContactType" NOT NULL DEFAULT 'PHONE',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "referee_listings_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "goalkeeper_listings" ADD CONSTRAINT "goalkeeper_listings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "referee_listings" ADD CONSTRAINT "referee_listings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
