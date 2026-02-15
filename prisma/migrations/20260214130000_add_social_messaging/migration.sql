-- CreateEnum
CREATE TYPE "public"."ReviewStatus" AS ENUM ('PUBLISHED', 'HIDDEN', 'FLAGGED');

-- CreateEnum
CREATE TYPE "public"."ActivityType" AS ENUM ('AGENT_CREATED', 'AGENT_UPDATED', 'AGENT_PUBLISHED', 'AGENT_VERIFIED', 'REVIEW_POSTED', 'REVIEW_UPDATED', 'ENDORSEMENT_GIVEN', 'AGENT_REGISTERED_VIA_API', 'CONVERSATION_STARTED', 'MESSAGE_SENT');

-- CreateEnum
CREATE TYPE "public"."ConversationType" AS ENUM ('DIRECT', 'REQUEST');

-- CreateEnum
CREATE TYPE "public"."ConversationStatus" AS ENUM ('OPEN', 'CLOSED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "public"."MessageContentType" AS ENUM ('TEXT', 'JSON', 'MARKDOWN');

-- AlterTable
ALTER TABLE "public"."agent_profiles"
ADD COLUMN "accepts_messages" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN "average_rating" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN "endorsement_count" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "review_count" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "public"."reviews"
ADD COLUMN "author_agent_id" TEXT,
ADD COLUMN "helpful_count" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "is_verified_use" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "status" "public"."ReviewStatus" NOT NULL DEFAULT 'PUBLISHED',
ADD COLUMN "title" TEXT;

-- CreateTable
CREATE TABLE "public"."review_votes" (
    "id" TEXT NOT NULL,
    "review_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "is_helpful" BOOLEAN NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "review_votes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."endorsements" (
    "id" TEXT NOT NULL,
    "agent_id" TEXT NOT NULL,
    "skill" TEXT NOT NULL,
    "endorser_id" TEXT NOT NULL,
    "endorser_agent_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "endorsements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."activity_events" (
    "id" TEXT NOT NULL,
    "type" "public"."ActivityType" NOT NULL,
    "actor_id" TEXT,
    "actor_agent_id" TEXT,
    "target_agent_id" TEXT,
    "metadata" JSONB,
    "is_public" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "activity_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."conversations" (
    "id" TEXT NOT NULL,
    "type" "public"."ConversationType" NOT NULL DEFAULT 'DIRECT',
    "status" "public"."ConversationStatus" NOT NULL DEFAULT 'OPEN',
    "subject" TEXT,
    "initiator_id" TEXT NOT NULL,
    "receiver_id" TEXT NOT NULL,
    "metadata" JSONB,
    "last_message_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "conversations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."messages" (
    "id" TEXT NOT NULL,
    "conversation_id" TEXT NOT NULL,
    "sender_agent_id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "content_type" "public"."MessageContentType" NOT NULL DEFAULT 'TEXT',
    "metadata" JSONB,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."webhooks" (
    "id" TEXT NOT NULL,
    "agent_id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "secret" TEXT NOT NULL,
    "events" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "last_called_at" TIMESTAMP(3),
    "fail_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "webhooks_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "review_votes_review_id_idx" ON "public"."review_votes"("review_id");

-- CreateIndex
CREATE UNIQUE INDEX "review_votes_review_id_user_id_key" ON "public"."review_votes"("review_id", "user_id");

-- CreateIndex
CREATE INDEX "endorsements_agent_id_idx" ON "public"."endorsements"("agent_id");

-- CreateIndex
CREATE INDEX "endorsements_agent_id_skill_idx" ON "public"."endorsements"("agent_id", "skill");

-- CreateIndex
CREATE UNIQUE INDEX "endorsements_agent_id_skill_endorser_id_key" ON "public"."endorsements"("agent_id", "skill", "endorser_id");

-- CreateIndex
CREATE INDEX "activity_events_target_agent_id_created_at_idx" ON "public"."activity_events"("target_agent_id", "created_at");

-- CreateIndex
CREATE INDEX "activity_events_actor_id_created_at_idx" ON "public"."activity_events"("actor_id", "created_at");

-- CreateIndex
CREATE INDEX "activity_events_is_public_created_at_idx" ON "public"."activity_events"("is_public", "created_at");

-- CreateIndex
CREATE INDEX "conversations_initiator_id_status_idx" ON "public"."conversations"("initiator_id", "status");

-- CreateIndex
CREATE INDEX "conversations_receiver_id_status_idx" ON "public"."conversations"("receiver_id", "status");

-- CreateIndex
CREATE INDEX "conversations_last_message_at_idx" ON "public"."conversations"("last_message_at");

-- CreateIndex
CREATE INDEX "messages_conversation_id_created_at_idx" ON "public"."messages"("conversation_id", "created_at");

-- CreateIndex
CREATE INDEX "messages_sender_agent_id_idx" ON "public"."messages"("sender_agent_id");

-- CreateIndex
CREATE INDEX "webhooks_agent_id_idx" ON "public"."webhooks"("agent_id");

-- CreateIndex
CREATE UNIQUE INDEX "webhooks_agent_id_url_key" ON "public"."webhooks"("agent_id", "url");

-- CreateIndex
CREATE INDEX "reviews_agent_id_status_idx" ON "public"."reviews"("agent_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "reviews_agent_id_author_agent_id_key" ON "public"."reviews"("agent_id", "author_agent_id");

-- AddForeignKey
ALTER TABLE "public"."reviews" ADD CONSTRAINT "reviews_author_agent_id_fkey" FOREIGN KEY ("author_agent_id") REFERENCES "public"."agent_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."review_votes" ADD CONSTRAINT "review_votes_review_id_fkey" FOREIGN KEY ("review_id") REFERENCES "public"."reviews"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."review_votes" ADD CONSTRAINT "review_votes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."endorsements" ADD CONSTRAINT "endorsements_agent_id_fkey" FOREIGN KEY ("agent_id") REFERENCES "public"."agent_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."endorsements" ADD CONSTRAINT "endorsements_endorser_id_fkey" FOREIGN KEY ("endorser_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."endorsements" ADD CONSTRAINT "endorsements_endorser_agent_id_fkey" FOREIGN KEY ("endorser_agent_id") REFERENCES "public"."agent_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."activity_events" ADD CONSTRAINT "activity_events_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."activity_events" ADD CONSTRAINT "activity_events_actor_agent_id_fkey" FOREIGN KEY ("actor_agent_id") REFERENCES "public"."agent_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."activity_events" ADD CONSTRAINT "activity_events_target_agent_id_fkey" FOREIGN KEY ("target_agent_id") REFERENCES "public"."agent_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."conversations" ADD CONSTRAINT "conversations_initiator_id_fkey" FOREIGN KEY ("initiator_id") REFERENCES "public"."agent_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."conversations" ADD CONSTRAINT "conversations_receiver_id_fkey" FOREIGN KEY ("receiver_id") REFERENCES "public"."agent_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."messages" ADD CONSTRAINT "messages_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."messages" ADD CONSTRAINT "messages_sender_agent_id_fkey" FOREIGN KEY ("sender_agent_id") REFERENCES "public"."agent_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."webhooks" ADD CONSTRAINT "webhooks_agent_id_fkey" FOREIGN KEY ("agent_id") REFERENCES "public"."agent_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Data backfill for cached profile metrics
UPDATE "public"."agent_profiles" a
SET
  "review_count" = COALESCE(stats.review_count, 0),
  "average_rating" = COALESCE(stats.avg_rating, 0)
FROM (
  SELECT
    r.agent_id,
    COUNT(*)::int AS review_count,
    AVG(r.rating)::float AS avg_rating
  FROM "public"."reviews" r
  WHERE r.status = 'PUBLISHED'
  GROUP BY r.agent_id
) stats
WHERE stats.agent_id = a.id;
