/*
  Warnings:

  - The primary key for the `Repost` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `Repost` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Repost" DROP CONSTRAINT "Repost_pkey",
DROP COLUMN "id",
ADD CONSTRAINT "Repost_pkey" PRIMARY KEY ("postId", "userId");
