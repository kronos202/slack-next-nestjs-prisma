-- AlterTable
ALTER TABLE "channel" ADD COLUMN     "is_private" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "user" ALTER COLUMN "deleted_at" SET DEFAULT null,
ALTER COLUMN "last_login" SET DEFAULT null;
