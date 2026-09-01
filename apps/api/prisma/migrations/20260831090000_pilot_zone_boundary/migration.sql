-- A pilot zone without a boundary can never match a report, and the previous
-- '[]' default was an array where the runtime reads a bounding-box object, so
-- it could never be a usable value. Require the boundary explicitly instead.
ALTER TABLE "PilotZone" ALTER COLUMN "boundary" DROP DEFAULT;
