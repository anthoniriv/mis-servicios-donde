CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE TYPE "Service" AS ENUM ('water', 'electricity', 'internet');
CREATE TYPE "ReportStatus" AS ENUM ('outage', 'restored');
CREATE TYPE "TrustDecision" AS ENUM ('eligible', 'excluded');

CREATE TABLE "PilotZone" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(), "slug" TEXT NOT NULL UNIQUE,
  "name" TEXT NOT NULL, "approved" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE "SubmissionRecord" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(), "deviceToken" TEXT NOT NULL,
  "submissionId" TEXT NOT NULL, "requestHash" TEXT NOT NULL, "trustDecision" "TrustDecision" NOT NULL,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP, "expiresAt" TIMESTAMPTZ NOT NULL,
  UNIQUE ("deviceToken", "submissionId")
);
CREATE TABLE "ReportEvent" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(), "submissionId" UUID NOT NULL REFERENCES "SubmissionRecord"("id") ON DELETE CASCADE,
  "h3Cell" TEXT NOT NULL, "service" "Service" NOT NULL, "status" "ReportStatus" NOT NULL,
  "deviceToken" TEXT NOT NULL, "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP, "expiresAt" TIMESTAMPTZ NOT NULL
);
CREATE TABLE "ReportDisplayName" (
  "reportEventId" UUID PRIMARY KEY REFERENCES "ReportEvent"("id") ON DELETE CASCADE,
  "value" TEXT NOT NULL, "expiresAt" TIMESTAMPTZ NOT NULL
);
CREATE TABLE "AbuseRecord" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(), "deviceToken" TEXT NOT NULL, "decision" "TrustDecision" NOT NULL,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP, "expiresAt" TIMESTAMPTZ NOT NULL
);
CREATE TABLE "OutageEpisode" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(), "zoneId" UUID NOT NULL REFERENCES "PilotZone"("id"),
  "h3Cell" TEXT NOT NULL, "service" "Service" NOT NULL, "active" BOOLEAN NOT NULL DEFAULT true, "expiresAt" TIMESTAMPTZ NOT NULL
);
CREATE INDEX "SubmissionRecord_deviceToken_createdAt_idx" ON "SubmissionRecord" ("deviceToken", "createdAt");
CREATE INDEX "SubmissionRecord_expiresAt_idx" ON "SubmissionRecord" ("expiresAt");
CREATE INDEX "ReportEvent_h3Cell_service_status_createdAt_idx" ON "ReportEvent" ("h3Cell", "service", "status", "createdAt");
CREATE INDEX "ReportEvent_expiresAt_idx" ON "ReportEvent" ("expiresAt");
CREATE INDEX "ReportDisplayName_expiresAt_idx" ON "ReportDisplayName" ("expiresAt");
CREATE INDEX "AbuseRecord_deviceToken_createdAt_idx" ON "AbuseRecord" ("deviceToken", "createdAt");
CREATE INDEX "AbuseRecord_expiresAt_idx" ON "AbuseRecord" ("expiresAt");
CREATE INDEX "OutageEpisode_h3Cell_service_active_expiresAt_idx" ON "OutageEpisode" ("h3Cell", "service", "active", "expiresAt");
