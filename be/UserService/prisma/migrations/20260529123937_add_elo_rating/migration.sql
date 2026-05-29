/*
  Warnings:

  - You are about to drop the `Followers` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Followers" DROP CONSTRAINT "Followers_followerId_fkey";

-- DropForeignKey
ALTER TABLE "Followers" DROP CONSTRAINT "Followers_followingId_fkey";

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "eloRating" INTEGER NOT NULL DEFAULT 300;

-- DropTable
DROP TABLE "Followers";

-- DropEnum
DROP TYPE "FollowStatus";
