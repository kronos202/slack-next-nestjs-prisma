/*
  Warnings:

  - A unique constraint covering the columns `[name,workspaceId]` on the table `channel` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[memberOneId,memberTwoId]` on the table `conversation` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "user" ALTER COLUMN "deleted_at" SET DEFAULT null,
ALTER COLUMN "last_login" SET DEFAULT null;

-- CreateIndex
CREATE UNIQUE INDEX "channel_name_workspaceId_key" ON "channel"("name", "workspaceId");

-- CreateIndex
CREATE UNIQUE INDEX "conversation_memberOneId_memberTwoId_key" ON "conversation"("memberOneId", "memberTwoId");
