-- CreateEnum
CREATE TYPE "public"."ContactMethod" AS ENUM (
  'REST_ENDPOINT',
  'A2A_PROTOCOL',
  'MCP_INTERACTION',
  'WELL_KNOWN_CHECK',
  'GITHUB_ISSUE',
  'GITHUB_PR',
  'WEBHOOK_PING',
  'EMAIL_API'
);

-- CreateEnum
CREATE TYPE "public"."RecruitmentStatus" AS ENUM (
  'PENDING',
  'SENT',
  'DELIVERED',
  'INTERESTED',
  'REGISTERED',
  'DECLINED',
  'FAILED',
  'OPTED_OUT'
);

-- CreateTable
CREATE TABLE "public"."recruitment_attempts" (
    "id" TEXT NOT NULL,
    "imported_agent_id" TEXT,
    "target_name" TEXT NOT NULL,
    "target_url" TEXT NOT NULL,
    "contact_url" TEXT NOT NULL,
    "contact_method" "public"."ContactMethod" NOT NULL,
    "request_payload" JSONB NOT NULL,
    "response_payload" JSONB,
    "response_status" INTEGER,
    "status" "public"."RecruitmentStatus" NOT NULL DEFAULT 'PENDING',
    "error_message" TEXT,
    "invite_token" TEXT,
    "campaign" TEXT NOT NULL DEFAULT 'auto',
    "attempt_number" INTEGER NOT NULL DEFAULT 1,
    "next_retry_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "recruitment_attempts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."recruitment_opt_outs" (
    "id" TEXT NOT NULL,
    "domain" TEXT NOT NULL,
    "reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "recruitment_opt_outs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "recruitment_attempts_target_url_contact_method_key"
ON "public"."recruitment_attempts"("target_url", "contact_method");

-- CreateIndex
CREATE INDEX "recruitment_attempts_status_idx" ON "public"."recruitment_attempts"("status");

-- CreateIndex
CREATE INDEX "recruitment_attempts_contact_method_status_idx"
ON "public"."recruitment_attempts"("contact_method", "status");

-- CreateIndex
CREATE INDEX "recruitment_attempts_campaign_idx" ON "public"."recruitment_attempts"("campaign");

-- CreateIndex
CREATE INDEX "recruitment_attempts_next_retry_at_idx" ON "public"."recruitment_attempts"("next_retry_at");

-- CreateIndex
CREATE UNIQUE INDEX "recruitment_opt_outs_domain_key" ON "public"."recruitment_opt_outs"("domain");

-- CreateIndex
CREATE INDEX "recruitment_opt_outs_domain_idx" ON "public"."recruitment_opt_outs"("domain");

-- AddForeignKey
ALTER TABLE "public"."recruitment_attempts"
ADD CONSTRAINT "recruitment_attempts_imported_agent_id_fkey"
FOREIGN KEY ("imported_agent_id") REFERENCES "public"."imported_agents"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
