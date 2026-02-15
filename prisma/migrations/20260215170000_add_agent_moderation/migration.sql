-- CreateEnum
CREATE TYPE "AgentModerationStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- AlterTable
ALTER TABLE "agent_profiles"
  ADD COLUMN "moderation_status" "AgentModerationStatus" NOT NULL DEFAULT 'APPROVED',
  ADD COLUMN "moderation_note" TEXT,
  ADD COLUMN "moderated_at" TIMESTAMP(3),
  ADD COLUMN "moderated_by_id" TEXT;

-- CreateIndex
CREATE INDEX "agent_profiles_moderation_status_idx" ON "agent_profiles"("moderation_status");