-- `other` preserves legacy rows without inventing a distributor attribution.
CREATE TYPE "Provider" AS ENUM (
  'sedapal', 'luz_del_sur', 'pluz',
  'movistar', 'claro', 'win', 'wow', 'mifibra', 'other'
);

ALTER TABLE "ReportEvent" ADD COLUMN "provider" "Provider";
ALTER TABLE "OutageEpisode" ADD COLUMN "provider" "Provider";

-- Water has one provider in the pilot catalog, so historical water records can
-- be backfilled safely. Leave other legacy providers unknown rather than
-- attributing them to the wrong electricity or internet company.
-- The coordinate-free privacy migration protects ReportEvent with an
-- immutability trigger. Temporarily remove and recreate it for this one-time
-- data backfill; this also works when migrations run under a restricted owner.
DROP TRIGGER prevent_report_event_mutation ON "ReportEvent";

UPDATE "ReportEvent"
SET "provider" = 'sedapal'::"Provider"
WHERE "service" = 'water'::"Service";

CREATE TRIGGER prevent_report_event_mutation
  BEFORE UPDATE ON "ReportEvent"
  FOR EACH ROW EXECUTE FUNCTION prevent_report_event_mutation();

UPDATE "OutageEpisode"
SET "provider" = 'sedapal'::"Provider"
WHERE "service" = 'water'::"Service";

UPDATE "ReportEvent" SET "provider" = 'other'::"Provider" WHERE "provider" IS NULL;
UPDATE "OutageEpisode" SET "provider" = 'other'::"Provider" WHERE "provider" IS NULL;

ALTER TABLE "ReportEvent" ALTER COLUMN "provider" SET NOT NULL;
ALTER TABLE "OutageEpisode" ALTER COLUMN "provider" SET NOT NULL;

DROP INDEX "ReportEvent_h3Cell_service_status_createdAt_idx";
CREATE INDEX "ReportEvent_h3Cell_service_provider_status_createdAt_idx"
  ON "ReportEvent" ("h3Cell", "service", "provider", "status", "createdAt");

DROP INDEX "OutageEpisode_h3Cell_service_active_expiresAt_idx";
CREATE INDEX "OutageEpisode_h3Cell_service_provider_active_expiresAt_idx"
  ON "OutageEpisode" ("h3Cell", "service", "provider", "active", "expiresAt");
