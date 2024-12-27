/*
  Warnings:

  - A unique constraint covering the columns `[userId,workspaceId]` on the table `member` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "user" ALTER COLUMN "deleted_at" SET DEFAULT null,
ALTER COLUMN "last_login" SET DEFAULT null;

-- CreateIndex
CREATE UNIQUE INDEX "member_userId_workspaceId_key" ON "member"("userId", "workspaceId");
