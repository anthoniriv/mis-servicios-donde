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
- [ ] Unit 6: Alerts and notices.
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
- [ ] Unit 6: Alerts and notices.
- [ ] Unit 7: Retention and rollout.
