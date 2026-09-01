-- Clamp existing report signals to the new maximum lifetime without extending
-- any event or changing its immutable payload.
BEGIN;

ALTER TABLE "ReportEvent" DISABLE TRIGGER prevent_report_event_mutation;

UPDATE "ReportEvent"
SET "expiresAt" = "createdAt" + INTERVAL '48 hours'
WHERE "expiresAt" > "createdAt" + INTERVAL '48 hours';

ALTER TABLE "ReportEvent" ENABLE TRIGGER prevent_report_event_mutation;

COMMIT;
