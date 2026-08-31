CREATE TYPE "AlertIntentStatus" AS ENUM ('pending', 'delivered', 'retryable', 'cancelled');
CREATE TABLE "AlertIntent" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "episodeId" UUID NOT NULL REFERENCES "OutageEpisode"("id") ON DELETE CASCADE,
  "kind" TEXT NOT NULL CHECK ("kind" = 'OPENED'), "content" TEXT NOT NULL,
  "status" "AlertIntentStatus" NOT NULL DEFAULT 'pending', "attempts" INTEGER NOT NULL DEFAULT 0,
  "nextAttemptAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP, "leaseToken" UUID, "leaseExpiresAt" TIMESTAMPTZ,
  "deliveredAt" TIMESTAMPTZ, "cancelledAt" TIMESTAMPTZ, "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE ("episodeId", "kind")
);
CREATE INDEX "AlertIntent_dispatch_idx" ON "AlertIntent" ("status", "nextAttemptAt");
