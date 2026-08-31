# Apply Progress: Community Outage MVP

## Mode

- Work Unit 1 ran in Standard mode because no test runner existed at its start.
- Strict TDD is enabled for Work Units 2–7 after the new runner passed.
- Delivery is a two-PR stacked-to-main slice from baseline `f743a07`: `feat/executable-foundation` (`1da73f5`) followed by `chore/foundation-ci`.

## Completed Tasks

- [x] 1.1 Initialize Git on `main` and verify the active branch.
- [x] 1.2 Scaffold Astro, NestJS, contracts, TypeScript, lint, and builds as npm workspaces.
- [x] 1.3 Configure and prove Vitest, Supertest, Playwright, and a real PostgreSQL fixture.
- [x] 1.4 Add Docker, environment, and CI configuration and run the forecast commands.
- [x] 1.5 Record verified commands and enable Strict TDD for subsequent work units.
- [x] 2.1 Add RED contract and trust-control tests.
- [x] 2.2 Add coordinate-free Prisma schema, PostgreSQL migration, and trust services.

## Scaffold Test Cycle Evidence

| Stage | Command | Exact result |
|---|---|---|
| RED | `npm run test:unit` | Exit 1; 3 failed suites because `app.service.js`, `content.js`, and `index.js` did not exist. |
| GREEN | `npm run check` | Exit 0; lint and all type checks passed; 3 Vitest files and 3 tests passed. |
| REFACTOR | `npm run build` | Exit 0; NestJS, Astro (1 static page), and contracts builds passed. |

## Work Unit Evidence

| Evidence | Result |
|---|---|
| Focused test command and exact result | `npm run check` exited 0: ESLint passed, all workspace type checks passed, 3 test files and 3 unit tests passed. |
| Runtime harness command/scenario and exact result | After `docker compose up -d --wait postgres` reported healthy, `npm run test:integration` exited 0 with 1 file and 2 tests passed against PostgreSQL 17 and NestJS/Supertest. `npm run test:e2e` exited 0 with 1 Playwright request test passed against the built Astro preview. |
| Build and dependency evidence | `npm ci` exited 0; `npm run build` exited 0 for all three workspaces; `npm audit --omit=dev` exited 0 with 0 vulnerabilities; `docker compose config --quiet` exited 0. |
| Rollback boundary | Revert PR 2 to remove E2E, environment, CI, and OpenSpec progress/configuration; revert PR 1 separately to remove root manifests/configuration, `apps/`, `packages/`, and Docker without affecting the planning baseline. |

## Deviations and Discoveries

- No product behavior from Work Units 2–7 was implemented.
- NestJS 11 was selected because NestJS 12 CLI transitive tooling requires Node 22.22.3 while the verified local runtime is 22.22.2.
- Astro 7.2.9 was retained because Astro 5 has current high-severity audit findings. A root `cookie@2.0.1` dependency ensures Astro's externalized prerender import resolves the ESM API while Express keeps its nested 0.7.x dependency.
- Local integration and E2E commands require permission to bind/connect to loopback ports in the managed sandbox; CI does not have that sandbox restriction.

## Work Unit 2 TDD Cycle Evidence

| Task | Test file | Layer | Safety net | RED | GREEN | Triangulate | Refactor |
|---|---|---|---|---|---|---|---|
| 2.1 | `packages/contracts/src/index.spec.ts`, `apps/api/src/trust/trust.service.spec.ts` | Unit | Contracts 1/1 | Tests failed: missing exports/module | 6 tests passed | Distinct services/statuses, token versions, unsafe name/rate limit/redaction | Passed after safe unused-input cleanup |
| 2.2 | `apps/api/src/trust/trust.service.spec.ts`, `apps/api/test/app.integration-spec.ts` | Unit + PostgreSQL integration | Existing integration baseline passed after PostgreSQL fixture start | Task 2.1 tests were authored before all Unit 2 production code | 4 unit + 2 integration tests passed | Fresh schema and coordinate-free column assertions | Deterministic schema reset passes |

## Work Unit 2 Evidence

| Evidence | Result |
|---|---|
| Focused tests | `npm run check` exited 0: 5 Vitest files and 7 tests passed. |
| Runtime harness | `docker compose up -d --wait postgres` reported healthy; `npm run test:integration` exited 0: 1 file, 2 tests passed against PostgreSQL 17. |
| Build | `npm run build` exited 0 for API, web, and contracts. |
| Rollback boundary | Revert schema/migration, trust services/tests, contract allowlists, and migration integration assertion; no intake, consensus, public map, or alerts behavior is removed. |

## Remaining Work Units

- [x] Unit 2: Data and privacy.
- [ ] Unit 3: Intake.
- [ ] Unit 4: Consensus.
- [ ] Unit 5: Map and web.
- [x] Unit 6: Alerts and notices.
- [ ] Unit 7: Retention and rollout.

## Work Unit 6 (Alerts and Notices) TDD Cycle Evidence

| Task | Test file | Layer | Safety net | RED | GREEN | Triangulate | Refactor |
|---|---|---|---|---|---|---|---|
| 4.3 | `apps/api/src/alerts/alerts.service.spec.ts`, `apps/api/test/app.integration-spec.ts` | Unit + PostgreSQL integration | 9 API unit tests and 10 integration tests passed | Alert module missing; integration import failed | 2 focused unit and 11 integration tests passed | Safe opening text, bounded backoff, concurrent intent uniqueness, provider failure, cancellation | Extracted pure content/backoff policy; checks stayed green |
| 4.4 | `apps/api/test/app.integration-spec.ts` | PostgreSQL integration | 10 integration tests passed | `AlertIntent` table/service absent | 11 integration tests passed | `FOR UPDATE SKIP LOCKED` claim, lease, retryable status, and disabled dispatch cancellation | Kept provider adapter behind a single private boundary; checks stayed green |
| 4.5 | `apps/api/src/notices/notices.service.spec.ts`, `apps/api/test/app.integration-spec.ts` | Unit + PostgreSQL integration | 11 integration tests and 11 API unit tests passed | Notice module missing; `GET /v1/zones/central/notice` returned 404 | 2 focused unit and 12 integration tests passed | Central/North pure output; unknown and unapproved zones return 404 | Returned a minimal printable DTO containing only zone-level community information |

## Work Unit 6 Evidence

| Evidence | Result |
|---|---|
| Focused test command and exact result | `npm run test:unit --workspace @mis-servicios/api -- alerts` exited 0: 1 file, 2 tests. `npm run test:unit --workspace @mis-servicios/api -- notices` exited 0: 1 file, 2 tests. |
| Runtime harness command/scenario and exact result | `npm run test:integration` exited 0: PostgreSQL 17/NestJS/Supertest, 1 file and 12 tests. It proved concurrent opening creates one intent; concurrent dispatches claim one lease and make one provider attempt; a Telegram configuration failure marks it retryable while the episode remains active; disabled dispatch cancels it; notices refuse missing/unapproved zones. |
| E2E/build/quality | `npm run check` exited 0: 8 total unit files and 16 tests; `npm run test:e2e` exited 0: 2 Playwright static-web tests; `npm run build` exited 0. The static browser harness has no live API process, so the PostgreSQL harness is the authoritative runtime proof for this API-only slice. |
| Rollback boundary | Revert `cb61ec7` to remove the AlertIntent schema/migration, alerts service, consensus queue call, and alert tests; revert `91b3e53` to remove notices service/controller and notice tests. Neither revert removes report acceptance, episode consensus, or public cells. |

## Remaining Work Units

- [x] Unit 2: Data and privacy.
- [x] Unit 3: Intake.
- [x] Unit 4: Consensus.
- [x] Unit 5: Map and web.
- [x] Unit 6: Alerts and notices.
- [ ] Unit 7: Retention and rollout.

## Work Unit 5 (Web) TDD Cycle Evidence

| Task | Test file | Layer | Safety net | RED | GREEN | Triangulate | Refactor |
|---|---|---|---|---|---|---|---|
| 4.2 | `e2e/foundation.spec.ts` | Playwright E2E | 1 E2E test passed | Heading missing from the original page | 2 E2E tests passed | Intercepted water filter returns a safe aggregate; unselected-service submit exposes an accessible error | Removed detector-flagged font choice; checks stayed green |

## Work Unit 5 (Web) Evidence

| Evidence | Result |
|---|---|
| Focused test command and exact result | `npm run test:e2e` exited 0: 2 Playwright tests passed. |
| Runtime harness command/scenario and exact result | Browser exercised the static Astro page, public notice, service-filter request, and no-service form validation; 2 Playwright tests passed. |
| Quality/build | `npm run check`, `npm run test:integration`, and `npm run build` exited 0. |
| Rollback boundary | Revert the Astro page, its E2E coverage, and this progress entry; the API public-cells slice remains usable independently. |

## Remaining Work Units

- [x] Unit 2: Data and privacy.
- [x] Unit 3: Intake.
- [x] Unit 4: Consensus.
- [x] Unit 5: Map and web.
- [x] Unit 6: Alerts and notices.
- [ ] Unit 7: Retention and rollout.

## Work Unit 5 (API) TDD Cycle Evidence

| Task | Test file | Layer | Safety net | RED | GREEN | Triangulate | Refactor |
|---|---|---|---|---|---|---|---|
| 4.1 | `apps/api/test/app.integration-spec.ts` | PostgreSQL integration | 9 integration tests and 1 E2E test passed | `GET /v1/cells` returned 404 | 10 integration tests passed | Disabled map, 2–3 approved zones, service filter, expired episode, and a later-unapproved episode | Safe unknown-query guard and approved-zone join added; checks stayed green |

## Work Unit 5 (API) Evidence

| Evidence | Result |
|---|---|
| Focused test command and exact result | `npm run test:integration` exited 0: 1 file and 10 PostgreSQL/NestJS/Supertest tests passed. |
| Runtime harness command/scenario and exact result | `npm run test:e2e` exited 0: 1 Playwright public-site request test passed. |
| Quality/build | `npm run check` and `npm run build` exited 0. |
| Rollback boundary | Revert `apps/api/src/public-map/`, its AppModule wiring, the public-cells integration assertions, and this progress entry; intake and consensus remain intact. |

## Remaining Work Units

- [x] Unit 2: Data and privacy.
- [x] Unit 3: Intake.
- [x] Unit 4: Consensus.
- [ ] Unit 5: Map and web (API task 4.1 complete; web task 4.2 pending).
- [x] Unit 6: Alerts and notices.
- [ ] Unit 7: Retention and rollout.

## Work Unit 3 TDD Cycle Evidence

| Task | Test file | Layer | Safety net | RED | GREEN | Triangulate | Refactor |
|---|---|---|---|---|---|---|---|
| 3.1 | `reports/report-input.spec.ts`, `test/app.integration-spec.ts` | Unit + PostgreSQL integration | 4 unit + 2 integration passed | Missing module; endpoint 404 | 6 unit + 6 integration passed | 1, 2, and 3 services; outside, retry, conflict, rollback | Type/lint cleanup passed |
| 3.2 | `test/app.integration-spec.ts` | PostgreSQL integration | 6 integration passed | Update of `ReportEvent` succeeded | Mutation trigger rejects updates; 6 integration passed | Successful expansion and forced service failure | Final check/build/integration passed |

## Work Unit 3 Evidence

| Evidence | Result |
|---|---|
| Focused tests | `npm run test:unit --workspace @mis-servicios/api -- reports` exited 0: 1 file, 2 tests. |
| Runtime harness | `docker compose up -d --wait postgres` healthy; `npm run test:integration` exited 0: 1 file, 6 PostgreSQL/Supertest tests. |
| Quality/build | `npm run check` and `npm run build` exited 0. |
| Rollback boundary | Revert the reports module, H3 dependency, intake migrations, test coverage, and this progress entry; privacy foundation remains. |

## Remaining Work Units

- [x] Unit 2: Data and privacy.
- [x] Unit 3: Intake.
- [ ] Unit 4: Consensus.
- [ ] Unit 5: Map and web.
- [x] Unit 6: Alerts and notices.
- [ ] Unit 7: Retention and rollout.

## Work Unit 4 TDD Cycle Evidence

| Task | Test file | Layer | Safety net | RED | GREEN | Triangulate | Refactor |
|---|---|---|---|---|---|---|---|
| 3.3 | `consensus-policy.spec.ts`, `app.integration-spec.ts` | Unit + PostgreSQL integration | 2 report unit + 6 integration tests passed | Missing policy/service modules; no active episodes | 3 consensus unit + 9 integration tests passed | Duplicate keys, threshold crossing, concurrent reports, service/status isolation, refresh, restoration, expiry, reopening | Extracted validated 60 min/3 device/6 h configuration defaults; tests stayed green |
| 3.4 | `app.integration-spec.ts` | PostgreSQL integration | 9 integration tests passed | New post-restoration quorum assertion failed (one episode) | New episode opens after closure; 9 integration tests passed | Expired rows excluded before explicit cleanup | Final focused/unit, integration, check, and build passed |

## Work Unit 4 Evidence

| Evidence | Result |
|---|---|
| Focused tests | `npm run test:unit --workspace @mis-servicios/api -- consensus` exited 0: 1 file, 3 tests. |
| Runtime harness | `npm run test:integration` exited 0: PostgreSQL 17/NestJS/Supertest, 1 file and 9 tests including concurrent threshold reports. |
| Quality/build | `npm run check` and `npm run build` exited 0. |
| Rollback boundary | Revert consensus service/policy, episode-lifecycle migration/schema, report transaction wiring, consensus tests, and this progress entry; report intake and privacy remain. |

## Remaining Work Units

- [x] Unit 2: Data and privacy.
- [x] Unit 3: Intake.
- [x] Unit 4: Consensus.
- [ ] Unit 5: Map and web.
- [x] Unit 6: Alerts and notices.
- [ ] Unit 7: Retention and rollout.


## Work Unit 7a (Retention) TDD Cycle Evidence

| Task | Test file | Layer | Safety net | RED | GREEN | Triangulate | Refactor |
|---|---|---|---|---|---|---|---|
| 5.1 | `apps/api/src/retention/retention-policy.spec.ts`, `apps/api/test/retention.integration-spec.ts` | Unit + PostgreSQL integration | 12 integration tests and 2 E2E tests passed before the retention tests were added | `npm run test:unit --workspace @mis-servicios/api -- retention` exited 1 because `retention-policy.js` did not exist; the integration test was authored before `RetentionService` existed | Focused unit test exited 0: 1 file, 2 tests; PostgreSQL integration exited 0: 2 files, 14 tests | Exact 24h/7d/30d expiry records are removed while fresh display name/event/idempotency/abuse records remain; rollback deletes private pilot data but preserves zone configuration | Typed deletion allowlists and an unreferenced hourly worker timer kept the transaction boundary small; all checks stayed green |

## Work Unit 7a Evidence

| Evidence | Result |
|---|---|
| Focused test command and exact result | `npm run test:unit --workspace @mis-servicios/api -- retention` exited 0: 1 file, 2 tests. |
| Runtime harness command/scenario and exact result | `npm run test:integration --workspace @mis-servicios/api` exited 0: PostgreSQL 17, 2 files and 14 tests. The retention scenario proves deletion at the exact 24-hour, 7-day, and 30-day boundaries; fresh records remain; an explicit purge removes report, display-name, idempotency, abuse, episode, and cascaded alert rows while retaining the approved-zone configuration. |
| Quality/build evidence | `npm run check` exited 0: lint, all workspace type checks, 9 unit files, and 18 tests passed. `npm run build` exited 0 for API, web, and contracts. |
| Rollback boundary | Revert this work unit to remove `apps/api/src/retention/`, worker wiring, retention environment flag, purge command, and retention tests. The rollback purge is intentionally irreversible; it deletes pilot records and active episode/outbox data but preserves zone configuration. |

## Remaining Work Units

- [x] Unit 2: Data and privacy.
- [x] Unit 3: Intake.
- [x] Unit 4: Consensus.
- [x] Unit 5: Map and web.
- [x] Unit 6: Alerts and notices.
- [ ] Unit 7: Retention and rollout (5.1 complete; 5.2–5.3 pending).


## Work Unit 7b (Release E2E) TDD Cycle Evidence

| Task | Test file | Layer | Safety net | RED | GREEN | Triangulate | Refactor |
|---|---|---|---|---|---|---|---|
| 5.2 | `apps/api/test/release.integration-spec.ts`, `e2e/release-flow.spec.ts` | PostgreSQL integration + Playwright E2E | 14 PostgreSQL integration tests and 2 Playwright tests passed before this slice | `npm run test:integration --workspace @mis-servicios/api -- release` exited 1: disabled intake returned 201 instead of 400 | Same focused command exited 0: 1 file, 2 tests after the intake gate was added | Three concurrent reports create one safe map cell and one retryable outbox intent; disabling intake/public-map/dispatch blocks acceptance, suppresses cells, and cancels pending delivery; browser tests verify report-to-map privacy rendering and disabled UX | Typed Playwright `Page` helper removed an unsafe structural test type; lint, focused tests, and full checks remained green |

## Work Unit 7b Evidence

| Evidence | Result |
|---|---|
| Focused test command and exact result | `npm run test:integration --workspace @mis-servicios/api -- release` exited 0: 1 file, 2 tests. `npm run test:e2e -- --grep "submits a report|keeps the browser"` exited 0: 2 Playwright tests. |
| Runtime harness command/scenario and exact result | `npm run test:integration` exited 0: PostgreSQL 17, 3 files and 16 tests. It proves concurrent reports produce one public aggregate and one retryable intent, concurrent dispatch makes one provider attempt, all rollout gates act independently, and neither public cells nor alert text exposes reporter data. |
| E2E/build/quality evidence | `npm run test:e2e` exited 0: 4 Playwright tests; `npm run check` exited 0: lint, workspace type checks, 9 unit files, and 18 tests; `npm run build` exited 0 for API, web, and contracts. |
| Rollback boundary | Revert this work unit to remove the intake gate, release integration/browser E2E tests, and this progress entry. Existing report intake, public cells, and outbox flows remain independently reversible through their prior work units. |

## Remaining Work Units

- [x] Unit 2: Data and privacy.
- [x] Unit 3: Intake.
- [x] Unit 4: Consensus.
- [x] Unit 5: Map and web.
- [x] Unit 6: Alerts and notices.
- [ ] Unit 7: Retention and rollout (5.1–5.2 complete; 5.3 pending).
