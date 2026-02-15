-- AlterEnum
ALTER TYPE "public"."ActivityType" ADD VALUE IF NOT EXISTS 'AGENT_CONNECTED';
ALTER TYPE "public"."ActivityType" ADD VALUE IF NOT EXISTS 'AGENT_CLAIMED';

-- CreateEnum
CREATE TYPE "public"."EndpointType" AS ENUM ('REST', 'A2A', 'MCP', 'GRAPHQL', 'WEBSOCKET', 'CUSTOM');

-- CreateEnum
CREATE TYPE "public"."EndpointAuthType" AS ENUM ('NONE', 'API_KEY', 'BEARER', 'BASIC', 'CUSTOM');

-- CreateEnum
CREATE TYPE "public"."EndpointHealth" AS ENUM ('HEALTHY', 'DEGRADED', 'DOWN', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "public"."ConnectStatus" AS ENUM ('PENDING', 'SUCCESS', 'FAILED', 'TIMEOUT');

-- CreateEnum
CREATE TYPE "public"."ImportStatus" AS ENUM ('UNCLAIMED', 'CLAIM_PENDING', 'CLAIMED', 'REJECTED', 'MERGED');

-- CreateEnum
CREATE TYPE "public"."OutreachStatus" AS ENUM ('QUEUED', 'SENT', 'RESPONDED', 'REGISTERED', 'DECLINED');

-- AlterTable
ALTER TABLE "public"."users"
ADD COLUMN "referral_code" TEXT,
ADD COLUMN "referred_by_code" TEXT;

-- AlterTable
ALTER TABLE "public"."agent_profiles"
ADD COLUMN "playground_enabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "connect_enabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "is_early_adopter" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "public"."agent_endpoints" (
    "id" TEXT NOT NULL,
    "agent_id" TEXT NOT NULL,
    "type" "public"."EndpointType" NOT NULL,
    "url" TEXT NOT NULL,
    "method" TEXT DEFAULT 'POST',
    "auth_type" "public"."EndpointAuthType" NOT NULL DEFAULT 'NONE',
    "auth_config" JSONB,
    "request_schema" JSONB,
    "response_schema" JSONB,
    "health_status" "public"."EndpointHealth" NOT NULL DEFAULT 'UNKNOWN',
    "last_health_check" TIMESTAMP(3),
    "description" TEXT,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "log_responses" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "agent_endpoints_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."playground_sessions" (
    "id" TEXT NOT NULL,
    "agent_id" TEXT NOT NULL,
    "user_id" TEXT,
    "endpoint_id" TEXT NOT NULL,
    "request_body" JSONB NOT NULL,
    "response_body" JSONB,
    "response_status" INTEGER,
    "response_time_ms" INTEGER,
    "error" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "playground_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."connect_requests" (
    "id" TEXT NOT NULL,
    "from_agent_id" TEXT NOT NULL,
    "to_agent_id" TEXT NOT NULL,
    "endpoint_id" TEXT NOT NULL,
    "request_body" JSONB NOT NULL,
    "response_body" JSONB,
    "response_status" INTEGER,
    "response_time_ms" INTEGER,
    "status" "public"."ConnectStatus" NOT NULL DEFAULT 'PENDING',
    "error" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "connect_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."imported_agents" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "source_url" TEXT NOT NULL,
    "source_platform" TEXT NOT NULL,
    "source_data" JSONB,
    "skills" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "category" TEXT,
    "endpoint_url" TEXT,
    "website_url" TEXT,
    "status" "public"."ImportStatus" NOT NULL DEFAULT 'UNCLAIMED',
    "claimed_by_user_id" TEXT,
    "agent_profile_id" TEXT,
    "imported_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "imported_agents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."invite_tokens" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "campaign" TEXT NOT NULL,
    "agent_name" TEXT,
    "agent_data" JSONB,
    "max_uses" INTEGER NOT NULL DEFAULT 1,
    "used_count" INTEGER NOT NULL DEFAULT 0,
    "expires_at" TIMESTAMP(3),
    "created_by_user_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "invite_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."outreach_records" (
    "id" TEXT NOT NULL,
    "target_name" TEXT NOT NULL,
    "target_email" TEXT,
    "target_url" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "campaign" TEXT,
    "status" "public"."OutreachStatus" NOT NULL DEFAULT 'QUEUED',
    "message_template" TEXT NOT NULL,
    "sent_at" TIMESTAMP(3),
    "responded_at" TIMESTAMP(3),
    "notes" TEXT,
    "invite_token_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "outreach_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."growth_metrics" (
    "id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "total_agents" INTEGER NOT NULL,
    "new_agents" INTEGER NOT NULL,
    "total_users" INTEGER NOT NULL,
    "new_users" INTEGER NOT NULL,
    "total_reviews" INTEGER NOT NULL,
    "imported_agents" INTEGER NOT NULL,
    "claimed_agents" INTEGER NOT NULL,
    "invites_sent" INTEGER NOT NULL,
    "invites_used" INTEGER NOT NULL,
    "api_registrations" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "growth_metrics_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_referral_code_key" ON "public"."users"("referral_code");

-- CreateIndex
CREATE INDEX "agent_endpoints_agent_id_idx" ON "public"."agent_endpoints"("agent_id");

-- CreateIndex
CREATE UNIQUE INDEX "agent_endpoints_agent_id_url_key" ON "public"."agent_endpoints"("agent_id", "url");

-- CreateIndex
CREATE INDEX "playground_sessions_agent_id_created_at_idx" ON "public"."playground_sessions"("agent_id", "created_at");

-- CreateIndex
CREATE INDEX "playground_sessions_user_id_idx" ON "public"."playground_sessions"("user_id");

-- CreateIndex
CREATE INDEX "connect_requests_from_agent_id_created_at_idx" ON "public"."connect_requests"("from_agent_id", "created_at");

-- CreateIndex
CREATE INDEX "connect_requests_to_agent_id_created_at_idx" ON "public"."connect_requests"("to_agent_id", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "imported_agents_source_url_key" ON "public"."imported_agents"("source_url");

-- CreateIndex
CREATE UNIQUE INDEX "imported_agents_agent_profile_id_key" ON "public"."imported_agents"("agent_profile_id");

-- CreateIndex
CREATE INDEX "imported_agents_source_platform_status_idx" ON "public"."imported_agents"("source_platform", "status");

-- CreateIndex
CREATE INDEX "imported_agents_status_idx" ON "public"."imported_agents"("status");

-- CreateIndex
CREATE INDEX "imported_agents_name_idx" ON "public"."imported_agents"("name");

-- CreateIndex
CREATE UNIQUE INDEX "invite_tokens_token_key" ON "public"."invite_tokens"("token");

-- CreateIndex
CREATE INDEX "invite_tokens_token_idx" ON "public"."invite_tokens"("token");

-- CreateIndex
CREATE INDEX "invite_tokens_campaign_idx" ON "public"."invite_tokens"("campaign");

-- CreateIndex
CREATE UNIQUE INDEX "outreach_records_target_url_key" ON "public"."outreach_records"("target_url");

-- CreateIndex
CREATE INDEX "outreach_records_platform_status_idx" ON "public"."outreach_records"("platform", "status");

-- CreateIndex
CREATE INDEX "outreach_records_target_url_idx" ON "public"."outreach_records"("target_url");

-- CreateIndex
CREATE UNIQUE INDEX "growth_metrics_date_key" ON "public"."growth_metrics"("date");

-- AddForeignKey
ALTER TABLE "public"."agent_endpoints" ADD CONSTRAINT "agent_endpoints_agent_id_fkey" FOREIGN KEY ("agent_id") REFERENCES "public"."agent_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."playground_sessions" ADD CONSTRAINT "playground_sessions_agent_id_fkey" FOREIGN KEY ("agent_id") REFERENCES "public"."agent_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."playground_sessions" ADD CONSTRAINT "playground_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."playground_sessions" ADD CONSTRAINT "playground_sessions_endpoint_id_fkey" FOREIGN KEY ("endpoint_id") REFERENCES "public"."agent_endpoints"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."connect_requests" ADD CONSTRAINT "connect_requests_from_agent_id_fkey" FOREIGN KEY ("from_agent_id") REFERENCES "public"."agent_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."connect_requests" ADD CONSTRAINT "connect_requests_to_agent_id_fkey" FOREIGN KEY ("to_agent_id") REFERENCES "public"."agent_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."connect_requests" ADD CONSTRAINT "connect_requests_endpoint_id_fkey" FOREIGN KEY ("endpoint_id") REFERENCES "public"."agent_endpoints"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."imported_agents" ADD CONSTRAINT "imported_agents_claimed_by_user_id_fkey" FOREIGN KEY ("claimed_by_user_id") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."imported_agents" ADD CONSTRAINT "imported_agents_agent_profile_id_fkey" FOREIGN KEY ("agent_profile_id") REFERENCES "public"."agent_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."invite_tokens" ADD CONSTRAINT "invite_tokens_created_by_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."outreach_records" ADD CONSTRAINT "outreach_records_invite_token_id_fkey" FOREIGN KEY ("invite_token_id") REFERENCES "public"."invite_tokens"("id") ON DELETE SET NULL ON UPDATE CASCADE;
