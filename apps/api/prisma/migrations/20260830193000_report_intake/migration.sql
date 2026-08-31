ALTER TABLE "PilotZone"
  ADD COLUMN "boundary" JSONB NOT NULL DEFAULT '[]'::jsonb;
