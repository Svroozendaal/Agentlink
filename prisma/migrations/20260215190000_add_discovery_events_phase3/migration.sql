CREATE TABLE "public"."discovery_events" (
    "id" TEXT NOT NULL,
    "discoverer_agent_id" TEXT,
    "discovered_agent_id" TEXT NOT NULL,
    "search_query" TEXT,
    "resulted_in_invocation" BOOLEAN NOT NULL DEFAULT false,
    "invocation_method" TEXT,
    "source" TEXT NOT NULL DEFAULT 'api',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "discovery_events_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "discovery_events_discoverer_agent_id_created_at_idx"
ON "public"."discovery_events"("discoverer_agent_id", "created_at");

CREATE INDEX "discovery_events_discovered_agent_id_created_at_idx"
ON "public"."discovery_events"("discovered_agent_id", "created_at");

CREATE INDEX "discovery_events_resulted_in_invocation_created_at_idx"
ON "public"."discovery_events"("resulted_in_invocation", "created_at");

CREATE INDEX "discovery_events_source_created_at_idx"
ON "public"."discovery_events"("source", "created_at");

ALTER TABLE "public"."discovery_events"
ADD CONSTRAINT "discovery_events_discoverer_agent_id_fkey"
FOREIGN KEY ("discoverer_agent_id") REFERENCES "public"."agent_profiles"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "public"."discovery_events"
ADD CONSTRAINT "discovery_events_discovered_agent_id_fkey"
FOREIGN KEY ("discovered_agent_id") REFERENCES "public"."agent_profiles"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
