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

## Remaining Work Units

- [ ] Unit 2: Data and privacy.
- [ ] Unit 3: Intake.
- [ ] Unit 4: Consensus.
- [ ] Unit 5: Map and web.
- [ ] Unit 6: Alerts and notices.
- [ ] Unit 7: Retention and rollout.
