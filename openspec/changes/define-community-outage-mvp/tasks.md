# Tasks: Community Outage MVP

## Review Workload Forecast

| Field | Value |
|---|---|
| Estimated changed lines | 3,000–4,500 |
| Delivery strategy | ask-on-risk |

Decision needed before apply: No
Chained PRs recommended: Yes
Chain strategy: stacked-to-main
400-line budget risk: High

### Suggested Work Units

| Unit | Goal | Test | Harness | Rollback |
|---|---|---|---|---|
| 1 | Scaffold/tests/CI | `npm run check` | `npm run test:integration` | Root scaffold/CI |
| 2 | Data/privacy | `npm run test:unit -- trust` | `npm run test:integration -- privacy` | Schema, contracts, trust |
| 3 | Intake | `npm run test:unit -- reports` | `npm run test:integration -- reports` | Reports module |
| 4 | Consensus | `npm run test:unit -- consensus` | `npm run test:integration -- consensus` | Consensus, episodes |
| 5 | Map/web | `npm run test:unit -- public-map` | `npm run test:e2e -- map` | Map API/UI |
| 6 | Alerts/notices | `npm run test:unit -- alerts` | `npm run test:e2e -- alerts` | Alerts, notices |
| 7 | Retention/rollout | `npm run test:integration -- retention` | `npm run test:e2e -- pilot` | Workers, gates |

## Phase 1: Executable Foundation

- [x] 1.1 Initialize Git with `main` when `.git` is absent; verify `git branch --show-current`.
- [x] 1.2 Scaffold npm workspaces: `apps/api`, `apps/web`, `packages/contracts`, TypeScript, lint, and builds.
- [x] 1.3 Configure Vitest, Supertest, Playwright, and PostgreSQL fixtures; prove RED then GREEN.
- [x] 1.4 Add `docker-compose.yml`, `.env.example`, and `.github/workflows/ci.yml`; verify forecast commands and `npm run build`.
- [x] 1.5 Record proven commands in `openspec/config.yaml`; enable TDD afterward.

## Phase 2: Data and Privacy

- [x] 2.1 RED: test contracts/allowlists, HMAC-versioned post-H3 hashes, sanitization, rate limits, silent ineligibility, and redaction.
- [x] 2.2 GREEN: create schemas, coordinate-free `apps/api/prisma/schema.prisma`, migration, and `apps/api/src/trust/` services.

## Phase 3: Intake and Consensus

- [x] 3.1 RED: test pilot boundaries, atomic 1–3-service expansion, identical/conflicting retries, and all-or-nothing failure in `apps/api/src/reports/`.
- [x] 3.2 GREEN: implement `POST /v1/reports`, early scrubbing, atomic events, and stable outcomes.
- [x] 3.3 RED: test quorum uniqueness/isolation, ordered-lock concurrency, refresh/restoration/expiry, and lone-report non-refresh.
- [x] 3.4 GREEN: implement `apps/api/src/consensus/` advisory locks and `OutageEpisode`; exclude expired rows before sweeps.

## Phase 4: Public Surfaces and Delivery

- [ ] 4.1 RED→GREEN: test then implement `GET /v1/cells` suppression, safe fields, closure, gates, and empty state.
- [ ] 4.2 RED→GREEN: test then build Astro map/form islands, filters, notice, and accessible errors in `apps/web/src/`.
- [ ] 4.3 RED: test opening-intent uniqueness/concurrency, safe content, leases, retry/cancellation, and provider-failure independence.
- [ ] 4.4 GREEN: implement the `apps/api/src/alerts/` transactional outbox, `SKIP LOCKED` dispatcher, Telegram adapter, and dispatch gate.
- [ ] 4.5 RED→GREEN: test then implement zone-safe printable notices and unknown-zone refusal.

## Phase 5: Retention and Release Evidence

- [ ] 5.1 RED→GREEN: test then implement 24-hour name erasure, 7-day event deletion, 30-day abuse/idempotency deletion, and irreversible rollback purge.
- [ ] 5.2 Add E2E report-to-map/outbox, retry, concurrency, disabled-feature, and public-privacy flows.
- [ ] 5.3 Document setup, gates, secrets, workers, rollout, and rollback in `README.md`; run every CI check.
