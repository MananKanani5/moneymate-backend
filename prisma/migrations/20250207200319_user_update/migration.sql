-- AlterTable
ALTER TABLE "User" ALTER COLUMN "reset_token" DROP NOT NULL,
ALTER COLUMN "reset_token" DROP DEFAULT,
ALTER COLUMN "reset_token_expiry" DROP NOT NULL,
ALTER COLUMN "reset_token_expiry" DROP DEFAULT;
