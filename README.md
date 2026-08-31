# Community outage pilot operations

This repository verifies a privacy-first, community-generated outage pilot for water, electricity, and internet. It is **unofficial** data: publish only approved pilot zones, never claim provider confirmation, and never treat the alert path as exactly-once delivery.

## Quick path

1. Use Node.js 22 or later and install locked dependencies:

   ```sh
   npm ci
   ```

2. Start the local PostgreSQL 17 fixture:

   ```sh
   docker compose up -d --wait postgres
   ```

3. Copy `.env.example` to your secret-management workflow, configure the variables below, and prove the checkout:

   ```sh
   npm run check
   npm run test:integration
   npm run test:e2e
   npm run build
   ```

The integration suite resets the local test schema and applies every committed SQL migration. This repository does **not** provide a deployment migration command; apply the reviewed migration files through the deployment platform before enabling a production gate.

## Environment and secrets

Do not commit `.env` or secret values. Supply values through the process environment or your deployment secret manager.

| Variable | Required when | Purpose |
|---|---|---|
| `DATABASE_URL` | API, workers, integration tests | PostgreSQL connection. The Docker default is in `.env.example`. |
| `PORT` | API process | HTTP listening port; defaults to `3000`. |
| `INTAKE_ENABLED` | accepting reports | Must be exactly `true` before `POST /v1/reports` accepts data. |
| `PUBLIC_MAP_ENABLED` | publishing map cells | Must be exactly `true`; publication also requires a valid H3 resolution and exactly two or three approved database zones. |
| `ALERT_DISPATCH_ENABLED` | delivering alerts | Must be exactly `true` to attempt Telegram delivery. Disabling it cancels pending and retryable intents. |
| `RETENTION_WORKER_ENABLED` | scheduled retention | Must be exactly `true` to run cleanup at startup and then hourly. |
| `H3_RESOLUTION` | intake and public map | Integer from `0` through `15`; defaults to `9` in code when unset. |
| `DEVICE_TOKEN_SECRET` | intake | HMAC secret actually read by the API to derive pseudonymous device tokens. Rotate only with a planned token-version migration. |
| `TELEGRAM_BOT_TOKEN` | alert dispatch | Telegram bot credential. |
| `TELEGRAM_CHAT_ID` | alert dispatch | Destination channel or chat identifier. |

`DEVICE_HMAC_KEY` and `PILOT_ZONE_SLUGS` remain in `.env.example` but are not currently read by the runtime. Zone approval comes from `PilotZone` rows in PostgreSQL. Treat this as a configuration gap to resolve before a production rollout; do not assume either variable enforces a boundary.

## Gates and workers

Keep every product gate `false` until the release checks and privacy review are complete.

| Surface | Enable condition | Disable / rollback effect |
|---|---|---|
| Intake | `INTAKE_ENABLED=true` | New reports receive the generic unavailable response and are not persisted. |
| Public map | `PUBLIC_MAP_ENABLED=true`, valid H3 resolution, 2–3 approved zones | `GET /v1/cells` returns an empty list. |
| Telegram dispatch | `ALERT_DISPATCH_ENABLED=true` plus both Telegram secrets | Pending and retryable intents are cancelled; accepted reports remain independent of provider delivery. |
| Retention | `RETENTION_WORKER_ENABLED=true` | Cleanup runs immediately at startup, then every hour; keep it enabled after data collection begins. |

The outbox creates one durable opening intent per episode transition and retries Telegram failures with bounded exponential backoff. Delivery is **at least once**; an external provider can still receive a duplicate, so do not claim exactly-once delivery.

## Privacy and retention

- Coordinates are used to derive an H3 cell and must never be persisted or logged.
- Optional display names are erased after 24 hours.
- Immutable report events are deleted after 7 days.
- Abuse, idempotency, and alert records are deleted after 30 days.
- Public cells expose only H3 cell and service, never device tokens, display names, coordinates, or event timestamps.

### Irreversible pilot purge

Use this only for an approved rollback or privacy incident. It deletes display names, report events, submission/idempotency records, abuse records, outage episodes, and cascaded alert intents. It preserves pilot-zone configuration and cannot restore deleted data.

```sh
npm run build --workspace @mis-servicios/api
CONFIRM_PILOT_PURGE=ERASE_PILOT_DATA npm run retention:purge --workspace @mis-servicios/api
```

The confirmation value is intentionally exact. Do not run this command in a shell history that records secrets or operational approvals.

## Rollout and rollback

### Rollout checklist

1. Apply reviewed SQL migrations through the deployment platform.
2. Create and approve exactly two or three pilot zones, set a valid H3 resolution, and provide `DEVICE_TOKEN_SECRET` plus Telegram secrets.
3. Deploy with every product gate disabled; run the commands in [Release evidence](#release-evidence).
4. Enable the public map, then intake, then dispatch. Monitor retryable alerts and retention cleanup.

### Independent rollback boundaries

1. **Dispatch:** set `ALERT_DISPATCH_ENABLED=false`; this cancels pending/retryable intents without rejecting reports.
2. **Intake:** set `INTAKE_ENABLED=false`; this blocks new reports without removing existing data.
3. **Publication:** set `PUBLIC_MAP_ENABLED=false`; this returns an empty map while reports and retention remain available.
4. **Privacy rollback:** run the guarded purge only when irreversible deletion is approved; leave retention enabled afterward.

The static web preview and API are independently tested in this repository. A production reverse proxy or API-origin configuration is not included here; provide one before deploying the browser client.

## Release evidence

The following commands are the repository's CI-equivalent checks:

```sh
npm run check
npm run test:integration
npm run test:e2e
npm run build
docker compose config --quiet
npm audit --omit=dev
```

Expected evidence is lint and workspace type checks, unit tests, PostgreSQL/Supertest integration flows, Playwright browser flows, production builds, valid Compose configuration, and no production dependency vulnerabilities. Run them after any gate, worker, migration, or operational change.
