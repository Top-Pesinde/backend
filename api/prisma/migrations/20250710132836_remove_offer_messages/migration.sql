/*
  Warnings:

  - You are about to drop the column `message` on the `goalkeeper_offers` table. All the data in the column will be lost.
  - You are about to drop the column `response_message` on the `goalkeeper_offers` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "goalkeeper_offers" DROP COLUMN "message",
DROP COLUMN "response_message";
