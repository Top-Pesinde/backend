-- AlterTable
ALTER TABLE "field_schedules" ADD COLUMN     "isOpen" BOOLEAN NOT NULL DEFAULT true,
ALTER COLUMN "start_time" DROP NOT NULL,
ALTER COLUMN "end_time" DROP NOT NULL;
