/*
  Warnings:

  - A unique constraint covering the columns `[memberId,id]` on the table `workspace` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "user" ALTER COLUMN "deleted_at" SET DEFAULT null,
ALTER COLUMN "last_login" SET DEFAULT null;

-- CreateIndex
CREATE UNIQUE INDEX "workspace_memberId_id_key" ON "workspace"("memberId", "id");
