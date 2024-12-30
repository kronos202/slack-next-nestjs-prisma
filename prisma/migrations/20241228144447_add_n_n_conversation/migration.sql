/*
  Warnings:

  - You are about to drop the column `createdAt` on the `conversation` table. All the data in the column will be lost.
  - You are about to drop the column `memberOneId` on the `conversation` table. All the data in the column will be lost.
  - You are about to drop the column `memberTwoId` on the `conversation` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `conversation` table. All the data in the column will be lost.
  - You are about to drop the column `created_by` on the `workspace` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "conversation" DROP CONSTRAINT "conversation_memberOneId_fkey";

-- DropForeignKey
ALTER TABLE "conversation" DROP CONSTRAINT "conversation_memberTwoId_fkey";

-- DropIndex
DROP INDEX "conversation_memberOneId_memberTwoId_key";

-- AlterTable
ALTER TABLE "conversation" DROP COLUMN "createdAt",
DROP COLUMN "memberOneId",
DROP COLUMN "memberTwoId",
DROP COLUMN "updatedAt",
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "image" ALTER COLUMN "messageId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "user" ALTER COLUMN "deleted_at" SET DEFAULT null,
ALTER COLUMN "last_login" SET DEFAULT null;

-- AlterTable
ALTER TABLE "workspace" DROP COLUMN "created_by";

-- CreateTable
CREATE TABLE "conversation_participant" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,

    CONSTRAINT "conversation_participant_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "conversation_participant" ADD CONSTRAINT "conversation_participant_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "conversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversation_participant" ADD CONSTRAINT "conversation_participant_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "member"("id") ON DELETE CASCADE ON UPDATE CASCADE;
