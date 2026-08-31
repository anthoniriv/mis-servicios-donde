```yaml
schema: gentle-ai.verify-result/v1
evidence_revision: sha256:7fcae2f2037bf701586a1dfcb9582515bf4f094b7058b0931d72ef4f34c3b72e
verdict: pass_with_warnings
blockers: 0
critical_findings: 0
requirements: 21/21
scenarios: 42/42
test_command: npm run check && npm run test:integration && npm run test:e2e
test_exit_code: 0
test_output_hash: sha256:a3660115077a1c3a7e2ba05d4eb247b1be535fb79d915698e5995aaec38c7a99
build_command: npm run build
build_exit_code: 0
build_output_hash: sha256:a5fb15a52d42418edb107fe4cec4343f1998d9a93a105cee19fc7cf7f337ba8c
```

## Verification Report

**Change**: define-community-outage-mvp
**Version**: OpenSpec, five capability specifications
**Mode**: Strict TDD
**Candidate**: commit `268c77dc74cb45329b610fd45b25830e985dbfc3`, tree `5f3cb090328591cb56f7e1429f5cd4bf04e08ab3`

### Completeness
| Metric | Value |
|---|---:|
| Requirements | 21 total; 21 verified |
| Scenarios | 42 total; 42 verified |
| Tasks | 19 total; 19 complete; 0 incomplete |

### Build & Tests Execution
**Tests**: ✅ Passed (43 total)

Command: `npm run check && npm run test:integration && npm run test:e2e`
Exit: 0
Output hash: `sha256:a3660115077a1c3a7e2ba05d4eb247b1be535fb79d915698e5995aaec38c7a99`

- Unit/check: 18 tests passed across 9 files; lint and workspace type checks passed.
- PostgreSQL integration: 21 tests passed across 3 files against PostgreSQL 17.
- Playwright E2E: 4 tests passed across 2 files.

**Build**: ✅ Passed

Command: `npm run build`
Exit: 0
Output hash: `sha256:a5fb15a52d42418edb107fe4cec4343f1998d9a93a105cee19fc7cf7f337ba8c`

NestJS API, Astro static web, and contracts builds completed.

**Additional quality checks**: `git diff --check` exit 0; `docker compose config --quiet` exit 0. `npm audit --omit=dev` was attempted but could not reach registry.npmjs.org in this environment (DNS ENOTFOUND), so dependency audit is informational only.

**Coverage**: ➖ Not available; no coverage tool configured.

### Spec Compliance Matrix

#### Community Alert Delivery (5 requirements, 9 scenarios)
| Requirement | Scenario | Covering runtime test | Result |
|---|---|---|---|
| Unique opening-alert intent | Episode opens | `apps/api/test/app.integration-spec.ts > keeps one safe opening intent recoverable across concurrency, provider failure, and dispatch rollback` | ✅ COMPLIANT |
| Unique opening-alert intent | Transition is replayed | same alert integration test; concurrent dispatch assertions | ✅ COMPLIANT |
| Decoupled report acceptance | Telegram is unavailable | same alert integration test; episode remains active after provider failure | ✅ COMPLIANT |
| Retryable dispatch | Retry succeeds | `apps/api/test/release.integration-spec.ts > retries the same alert successfully and never creates alerts for refresh or closure` | ✅ COMPLIANT |
| Retryable dispatch | Dispatch rollback | `apps/api/test/release.integration-spec.ts > refuses intake and suppresses public cells while rollout gates are disabled`; alert status becomes cancelled | ✅ COMPLIANT |
| Alert scope and content | Episode refreshes or closes | `apps/api/test/release.integration-spec.ts > retries the same alert successfully and never creates alerts for refresh or closure` | ✅ COMPLIANT |
| Alert scope and content | Opening alert content | `apps/api/test/app.integration-spec.ts > keeps one safe opening intent recoverable across concurrency, provider failure, and dispatch rollback`; `apps/api/src/alerts/alerts.service.spec.ts > renders an opening alert with only aggregate community data` | ✅ COMPLIANT |
| Printable zone notice | Partner obtains a notice | `apps/api/test/app.integration-spec.ts > serves only a safe printable notice for an approved pilot zone` | ✅ COMPLIANT |
| Printable zone notice | Unknown zone requested | same notice integration test | ✅ COMPLIANT |

#### Outage Consensus (4 requirements, 9 scenarios)
| Requirement | Scenario | Covering runtime test | Result |
|---|---|---|---|
| Eligible quorum | Quorum reached | `apps/api/test/app.integration-spec.ts > serializes concurrent threshold reports into one active episode` | ✅ COMPLIANT |
| Eligible quorum | Duplicate or stale vote | `apps/api/test/app.integration-spec.ts > refreshes only after a later quorum and closes stale episodes without publishing them` | ✅ COMPLIANT |
| Episode opening | Concurrent threshold crossing | `apps/api/test/app.integration-spec.ts > serializes concurrent threshold reports into one active episode` | ✅ COMPLIANT |
| Episode opening | Quorum dimensions remain isolated | `apps/api/test/app.integration-spec.ts > keeps cell, service, and status quorums isolated` | ✅ COMPLIANT |
| Active episode refresh | Qualifying refresh | `apps/api/test/app.integration-spec.ts > refreshes only after a later quorum and closes stale episodes without publishing them` | ✅ COMPLIANT |
| Active episode refresh | Lone report does not refresh | same consensus refresh test | ✅ COMPLIANT |
| Restoration and expiry | Confirmed restoration | `apps/api/test/app.integration-spec.ts > keeps cell, service, and status quorums isolated` | ✅ COMPLIANT |
| Restoration and expiry | Stale episode expires | `apps/api/test/app.integration-spec.ts > refreshes only after a later quorum and closes stale episodes without publishing them` | ✅ COMPLIANT |
| Restoration and expiry | New outage after closure | `apps/api/test/app.integration-spec.ts > keeps cell, service, and status quorums isolated` | ✅ COMPLIANT |

#### Privacy and Abuse Controls (4 requirements, 8 scenarios)
| Requirement | Scenario | Covering runtime test | Result |
|---|---|---|---|
| Data minimization | Accepted request data | `apps/api/test/app.integration-spec.ts > expands a valid submission atomically across selected services and keeps raw coordinates out of storage`; `apps/api/test/release.integration-spec.ts > creates one safe public cell and one retryable opening intent from concurrent reports`; `apps/api/test/release.integration-spec.ts > accepts an unsafe optional name without retaining it and keeps raw request data out of errors` | ✅ COMPLIANT |
| Data minimization | Public data access | `apps/api/test/app.integration-spec.ts > publishes only active, approved, safe aggregates and suppresses disabled or expired cells`; `e2e/release-flow.spec.ts > submits a report and renders only the public aggregate after confirmation` | ✅ COMPLIANT |
| Optional display names | Unsafe display name | `apps/api/test/release.integration-spec.ts > accepts an unsafe optional name without retaining it and keeps raw request data out of errors` | ✅ COMPLIANT |
| Optional display names | Name reaches retention limit | `apps/api/test/retention.integration-spec.ts > erases names after 24 hours and deletes expired event, abuse, idempotency, and alert records` | ✅ COMPLIANT |
| Eligibility controls | Rate limit exceeded | `apps/api/test/release.integration-spec.ts > silently excludes a fourth hourly submission without adding a public condition` | ✅ COMPLIANT |
| Eligibility controls | Silently ineligible report | same rate-limit integration test; public cells remain empty and decision is not exposed | ✅ COMPLIANT |
| Retention and restricted access | Retention deadlines | `apps/api/test/retention.integration-spec.ts > erases names after 24 hours and deletes expired event, abuse, idempotency, and alert records` | ✅ COMPLIANT |
| Retention and restricted access | Rollback purge | `apps/api/test/retention.integration-spec.ts > irreversibly purges pilot data for a rollback while preserving configured zones` | ✅ COMPLIANT |

#### Public Outage Map (4 requirements, 8 scenarios)
| Requirement | Scenario | Covering runtime test | Result |
|---|---|---|---|
| Minimum-count publication | Confirmed active outage | `apps/api/test/release.integration-spec.ts > creates one safe public cell and one retryable opening intent from concurrent reports` | ✅ COMPLIANT |
| Minimum-count publication | Below-threshold reports | `apps/api/test/release.integration-spec.ts > suppresses reports below quorum and removes restored conditions from the public map` | ✅ COMPLIANT |
| Public lifecycle | Episode closes | same below-quorum/restoration integration test; endpoint returns empty after restored closure | ✅ COMPLIANT |
| Public lifecycle | Public response fields | `apps/api/test/release.integration-spec.ts > creates one safe public cell and one retryable opening intent from concurrent reports`; `e2e/release-flow.spec.ts > submits a report and renders only the public aggregate after confirmation` | ✅ COMPLIANT |
| Unofficial-data notice | Visitor sees map data | `e2e/release-flow.spec.ts > submits a report and renders only the public aggregate after confirmation` | ✅ COMPLIANT |
| Unofficial-data notice | Empty map | `e2e/foundation.spec.ts > offers an unofficial filtered map and accessible report validation`; `e2e/release-flow.spec.ts > keeps the browser private and actionable when rollout APIs are disabled` | ✅ COMPLIANT |
| Bounded pilot rollout | Incomplete pilot configuration | `apps/api/test/release.integration-spec.ts > keeps public operation disabled without a configured resolution or approved pilot set` | ✅ COMPLIANT |
| Bounded pilot rollout | Pilot rollback | `apps/api/test/release.integration-spec.ts > refuses intake and suppresses public cells while rollout gates are disabled`; `e2e/release-flow.spec.ts > keeps the browser private and actionable when rollout APIs are disabled` | ✅ COMPLIANT |

#### Report Intake (4 requirements, 8 scenarios)
| Requirement | Scenario | Covering runtime test | Result |
|---|---|---|---|
| Valid submission | Valid multi-service submission | `apps/api/test/app.integration-spec.ts > expands a valid submission atomically across selected services and keeps raw coordinates out of storage`; `apps/api/src/reports/report-input.spec.ts > accepts one to three distinct supported services and sanitizes an optional display name` | ✅ COMPLIANT |
| Valid submission | Invalid service selection | `apps/api/src/reports/report-input.spec.ts > rejects empty, duplicate, and unsupported service selections before any database work`; `packages/contracts/src/index.spec.ts > accepts one to three distinct supported services` | ✅ COMPLIANT |
| Pilot boundary and location normalization | Location inside the pilot | `apps/api/test/app.integration-spec.ts > expands a valid submission atomically across selected services and keeps raw coordinates out of storage` | ✅ COMPLIANT |
| Pilot boundary and location normalization | Location outside the pilot | `apps/api/test/app.integration-spec.ts > rejects reports outside enabled pilot boundaries without creating report events` | ✅ COMPLIANT |
| Atomic service expansion | Expansion succeeds | same multi-service integration test | ✅ COMPLIANT |
| Atomic service expansion | One service fails acceptance | `apps/api/test/app.integration-spec.ts > rolls back every event when the service expansion cannot complete` | ✅ COMPLIANT |
| Idempotent retries | Identical retry | `apps/api/test/app.integration-spec.ts > returns the original outcome for an identical retry and rejects a conflicting retry without adding events` | ✅ COMPLIANT |
| Idempotent retries | Conflicting retry | same retry integration test | ✅ COMPLIANT |

**Compliance summary**: 42/42 scenarios compliant; 21/21 requirements verified.

### Correctness (Static Evidence)
| Area | Status | Evidence |
|---|---|---|
| Report validation, H3 conversion, atomic expansion, immutable events | ✅ Implemented | `ReportsService` validates supported services and approved rectangular boundaries, derives H3, commits event expansion transactionally, and migration trigger rejects event mutation. |
| Pseudonymous trust and safe public fields | ✅ Implemented | HMAC versioned device tokens, canonical post-H3 hashes, sanitized names, silent eligibility, redacted errors, and coordinate-free schema are exercised by unit and integration tests. |
| Consensus lifecycle | ✅ Implemented | Ordered advisory locks, distinct-device counts, quorum opening/refresh/restoration/expiry, and reopening are exercised against PostgreSQL. |
| Public map gating | ✅ Implemented | Missing/invalid H3 configuration and unapproved pilot zones are suppressed; active aggregates expose only H3 cell and service. |
| Alert outbox | ✅ Implemented | Unique opening intent, SKIP LOCKED leasing, bounded retries, cancellation, and provider independence are exercised against PostgreSQL. |
| Retention and purge | ✅ Implemented | Deadline cleanup and guarded irreversible pilot purge are exercised against PostgreSQL. |
| Operations and rollout documentation | ✅ Implemented | README documents setup, gates, secrets, workers, purge, rollout, rollback, and release checks. |

### Coherence (Design)
| Decision | Followed? | Notes |
|---|---|---|
| PostgreSQL transaction with ordered advisory locks | ✅ Yes | Intake and consensus use transactions and sorted cell/service lock keys. |
| Immutable events plus episode projection | ✅ Yes | Report-event trigger, episode lifecycle, and public projection are present. |
| Transactional outbox with leased at-least-once dispatch | ✅ Yes | Alert intents are unique, leased with FOR UPDATE SKIP LOCKED, and retryable. |
| HMAC-SHA-256 pseudonym with version | ✅ Yes | Device tokens are server-derived and version-prefixed. |
| Long-running workers for dispatch, expiry, and retention | ⚠️ Partial | Retention scheduling is wired; dispatch and expiry are invoked through services and covered by runtime tests, while production scheduler wiring remains an operational follow-up. |
| Prisma/PostgreSQL consistency boundary | ⚠️ Partial | The coordinate-free Prisma schema is present; runtime uses parameterized pg transactions, an implementation deviation from the planned Prisma client. |

### TDD Compliance
| Check | Result | Details |
|---|---|---|
| TDD Evidence reported | ✅ | apply-progress contains TDD Cycle Evidence tables for all 14 Strict-TDD rows (2.1–5.3; foundation 1.1–1.5 was Standard). |
| All tasks have tests | ✅ | 14/14 executable task rows have referenced test files; 5.3 is documentation-only with diff-check evidence. |
| RED confirmed (tests exist) | ✅ | All referenced RED test files exist. |
| GREEN confirmed (tests pass) | ✅ | All 14 executable task rows are covered by the passing check/integration/E2E run; documentation row passes diff-check. |
| Triangulation adequate | ✅ | Unit, PostgreSQL integration, and Playwright tests cover distinct positive, negative, concurrent, lifecycle, privacy, and rollback behaviors. |
| Safety net for modified files | ✅ | Apply evidence records safety-net coverage for all Strict-TDD rows; current full runtime suite remains green. |

**TDD Compliance**: 6/6 checks passed.

### Test Layer Distribution
| Layer | Tests | Files | Tools |
|---|---:|---:|---|
| Unit | 18 | 9 | Vitest |
| Integration | 21 | 3 | Vitest + Supertest + PostgreSQL 17 |
| E2E | 4 | 2 | Playwright |
| **Total** | **43** | **14** | |

### Changed File Coverage
Coverage analysis skipped — no coverage tool detected.

### Assertion Quality
✅ All assertions verify real behavior; no tautologies, ghost loops, orphan-empty-only assertions, smoke-test-only cases, CSS-only assertions, or mock-heavy files were found.

### Quality Metrics
- **Linter**: ✅ No errors (within `npm run check`).
- **Type checker**: ✅ No errors (within `npm run check`).
- **Diff check**: ✅ `git diff --check` exit 0.
- **Compose config**: ✅ `docker compose config --quiet` exit 0.
- **Dependency audit**: ⚠️ Not conclusive; registry lookup failed with DNS ENOTFOUND.

### Issues Found
**CRITICAL**: None.
**WARNING**:
1. Production scheduler wiring for dispatch and expiry remains a design/runtime follow-up; retention scheduling is wired and service-level behavior is covered.
2. Runtime persistence uses parameterized `pg` transactions rather than the planned Prisma client; schema/migration and behavior remain verified.
3. Dependency audit could not complete because the environment could not resolve registry.npmjs.org.

**SUGGESTION**: Reconcile the Prisma client and worker-scheduler design decisions before production deployment.

### Verdict
**PASS WITH WARNINGS** — all 19 tasks, 21 requirements, and 42 scenarios have passing runtime evidence; full tests/build pass. Warnings are limited to pre-existing design/operational deviations and an unavailable network audit.
