```yaml
schema: gentle-ai.verify-result/v1
evidence_revision: sha256:077e2e5bbd655f52c97d931a45be4902aba577ae4d20ad65f43a37c1036bf3a0
verdict: fail
blockers: 4
critical_findings: 5
requirements: 12/21
scenarios: 32/42
test_command: npm run check && npm run test:integration && npm run test:e2e
test_exit_code: 0
test_output_hash: sha256:cc56321620f1dfaad728b6ec84d60ebbaeeda099db35016c6427dd2b201c55ee
build_command: npm run build
build_exit_code: 0
build_output_hash: sha256:3a9b4e7ae2b9d89263565fbb54e51519de6eff9b251d000fd9693946901edbc1
```

## Verification Report

**Change**: define-community-outage-mvp
**Version**: OpenSpec/hybrid, five capability specifications
**Mode**: Strict TDD

### Completeness
| Metric | Value |
|--------|-------|
| Tasks total | 19 |
| Tasks complete | 19 |
| Tasks incomplete | 0 |

### Build & Tests Execution
**Build**: ✅ Passed
```text
Command: npm run build
Exit: 0
Result: NestJS API, Astro static web, and contracts builds completed.
Output hash: sha256:3a9b4e7ae2b9d89263565fbb54e51519de6eff9b251d000fd9693946901edbc1
```

**Tests**: ✅ 38 passed / ❌ 0 failed / ⚠️ 0 skipped
```text
Command: npm run check && npm run test:integration && npm run test:e2e
Exit: 0
Unit: 9 files, 18 tests passed. Integration: 3 files, 16 tests passed against PostgreSQL 17. E2E: 2 files, 4 Playwright tests passed.
Output hash: sha256:cc56321620f1dfaad728b6ec84d60ebbaeeda099db35016c6427dd2b201c55ee
```

**Coverage**: ➖ Not available (no coverage tool configured)

### Spec Compliance Matrix

#### Community Alert Delivery (5 requirements, 9 scenarios)
| Requirement | Scenario | Test | Result |
|-------------|----------|------|--------|
| Unique opening-alert intent | Episode opens | `apps/api/test/app.integration-spec.ts > keeps one safe opening intent recoverable across concurrency, provider failure, and dispatch rollback` | ✅ COMPLIANT |
| Unique opening-alert intent | Transition is replayed | same concurrent opening-intent test | ✅ COMPLIANT |
| Decoupled report acceptance | Telegram is unavailable | same alert integration test | ✅ COMPLIANT |
| Retryable dispatch | Retry succeeds | (none found) | ❌ UNTESTED |
| Retryable dispatch | Dispatch rollback | same alert integration test | ✅ COMPLIANT |
| Alert scope and content | Episode refreshes or closes | (none found) | ❌ UNTESTED |
| Alert scope and content | Opening alert content | same alert integration test; `apps/api/src/alerts/alerts.service.spec.ts > renders an opening alert with only aggregate community data` | ✅ COMPLIANT |
| Printable zone notice | Partner obtains a notice | `apps/api/test/app.integration-spec.ts > serves only a safe printable notice for an approved pilot zone`; `apps/api/src/notices/notices.service.spec.ts > uses only approved-zone aggregate community information` | ✅ COMPLIANT |
| Printable zone notice | Unknown zone requested | same notice integration test | ✅ COMPLIANT |

#### Outage Consensus (4 requirements, 9 scenarios)
| Requirement | Scenario | Test | Result |
|-------------|----------|------|--------|
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
| Requirement | Scenario | Test | Result |
|-------------|----------|------|--------|
| Data minimization | Accepted request data | `apps/api/test/app.integration-spec.ts > expands a valid submission atomically across selected services and keeps raw coordinates out of storage` | ⚠️ PARTIAL — persistence is checked, but logs, traces, and error paths are not exercised |
| Data minimization | Public data access | `apps/api/test/app.integration-spec.ts > publishes only active, approved, safe aggregates and suppresses disabled or expired cells`; `e2e/release-flow.spec.ts > submits a report and renders only the public aggregate after confirmation` | ✅ COMPLIANT |
| Optional display names | Unsafe display name | `apps/api/src/trust/trust.service.spec.ts > sanitizes optional names and excludes a fourth hourly submission without disclosing why` | ⚠️ PARTIAL — sanitizer behavior is tested, but accepted-request continuation is not |
| Optional display names | Name reaches retention limit | `apps/api/test/retention.integration-spec.ts > erases names after 24 hours and deletes expired event, abuse, idempotency, and alert records` | ✅ COMPLIANT |
| Eligibility controls | Rate limit exceeded | `apps/api/src/trust/trust.service.spec.ts > sanitizes optional names and excludes a fourth hourly submission without disclosing why` | ⚠️ PARTIAL — pure policy test, no accepted endpoint/public-state flow |
| Eligibility controls | Silently ineligible report | same trust-controls unit test | ⚠️ PARTIAL — public outcome is checked, but unchanged public state is not |
| Retention and restricted access | Retention deadlines | `apps/api/test/retention.integration-spec.ts > erases names after 24 hours and deletes expired event, abuse, idempotency, and alert records` | ✅ COMPLIANT |
| Retention and restricted access | Rollback purge | `apps/api/test/retention.integration-spec.ts > irreversibly purges pilot data for a rollback while preserving configured zones` | ✅ COMPLIANT |

#### Public Outage Map (4 requirements, 8 scenarios)
| Requirement | Scenario | Test | Result |
|-------------|----------|------|--------|
| Minimum-count publication | Confirmed active outage | `apps/api/test/app.integration-spec.ts > publishes only active, approved, safe aggregates and suppresses disabled or expired cells`; `apps/api/test/release.integration-spec.ts > creates one safe public cell and one retryable opening intent from concurrent reports` | ✅ COMPLIANT |
| Minimum-count publication | Below-threshold reports | (none found) | ❌ UNTESTED |
| Public lifecycle | Episode closes | same public-cells integration test (expiry only) | ⚠️ PARTIAL — restored closure is not checked through the public endpoint |
| Public lifecycle | Public response fields | same public-cells integration test; `e2e/release-flow.spec.ts > submits a report and renders only the public aggregate after confirmation` | ✅ COMPLIANT |
| Unofficial-data notice | Visitor sees map data | `e2e/foundation.spec.ts > offers an unofficial filtered map and accessible report validation` | ⚠️ PARTIAL — notice is verified on the empty surface, not with active API-backed map data |
| Unofficial-data notice | Empty map | `e2e/foundation.spec.ts > offers an unofficial filtered map and accessible report validation`; `e2e/release-flow.spec.ts > keeps the browser private and actionable when rollout APIs are disabled` | ✅ COMPLIANT |
| Bounded pilot rollout | Incomplete pilot configuration | (none found) | ❌ UNTESTED |
| Bounded pilot rollout | Pilot rollback | `apps/api/test/release.integration-spec.ts > refuses intake and suppresses public cells while rollout gates are disabled`; `e2e/release-flow.spec.ts > keeps the browser private and actionable when rollout APIs are disabled` | ✅ COMPLIANT |

#### Report Intake (4 requirements, 8 scenarios)
| Requirement | Scenario | Test | Result |
|-------------|----------|------|--------|
| Valid submission | Valid multi-service submission | `apps/api/test/app.integration-spec.ts > expands a valid submission atomically across selected services and keeps raw coordinates out of storage`; `apps/api/src/reports/report-input.spec.ts > accepts one to three distinct supported services and sanitizes an optional display name` | ✅ COMPLIANT |
| Valid submission | Invalid service selection | `apps/api/src/reports/report-input.spec.ts > rejects empty, duplicate, and unsupported service selections before any database work`; `packages/contracts/src/index.spec.ts > accepts one to three distinct supported services` | ✅ COMPLIANT |
| Pilot boundary and location normalization | Location inside the pilot | `apps/api/test/app.integration-spec.ts > expands a valid submission atomically across selected services and keeps raw coordinates out of storage` | ✅ COMPLIANT |
| Pilot boundary and location normalization | Location outside the pilot | `apps/api/test/app.integration-spec.ts > rejects reports outside enabled pilot boundaries without creating report events` | ✅ COMPLIANT |
| Atomic service expansion | Expansion succeeds | same multi-service integration test | ✅ COMPLIANT |
| Atomic service expansion | One service fails acceptance | `apps/api/test/app.integration-spec.ts > rolls back every event when the service expansion cannot complete` | ✅ COMPLIANT |
| Idempotent retries | Identical retry | `apps/api/test/app.integration-spec.ts > returns the original outcome for an identical retry and rejects a conflicting retry without adding events` | ✅ COMPLIANT |
| Idempotent retries | Conflicting retry | same retry integration test | ✅ COMPLIANT |

**Compliance summary**: 32/42 scenarios compliant; 6 partial; 4 untested.

### Correctness (Static Evidence)
| Requirement | Status | Notes |
|------------|--------|-------|
| Report validation, H3 conversion, atomic expansion, and immutable events | ✅ Implemented | `ReportsService` validates 1–3 services, checks approved rectangular boundaries, derives H3, commits event expansion transactionally, and migration trigger prevents event mutation. |
| Pseudonymous trust and safe public fields | ⚠️ Partial | HMAC token and redaction helpers exist; no runtime checks prove logs/traces/errors are free of raw input, and the rate-limit path does not persist an `AbuseRecord`. |
| Consensus lifecycle | ✅ Implemented | Ordered advisory locks, distinct-device counts, quorum opening/refresh/restoration/expiry, and reopening are implemented. |
| Public map gating | ❌ Deviates | `PublicCellsService` defaults missing/empty `H3_RESOLUTION` to a valid value (`9` or `0`) and only counts approved zones; the required “configured” resolution is not explicitly enforced. |
| Alert outbox | ✅ Implemented | Unique opening intent, `SKIP LOCKED` leasing, bounded retries, cancellation, and provider independence are implemented. |
| Retention and purge | ✅ Implemented | Expiry-based transactional cleanup and guarded irreversible pilot purge are implemented. |
| Operations and rollout documentation | ✅ Implemented | `README.md` documents setup, gates, secrets, worker/purge procedures, rollout, rollback, and release checks. |

### Coherence (Design)
| Decision | Followed? | Notes |
|----------|-----------|-------|
| PostgreSQL transaction with ordered advisory locks | ✅ Yes | Consensus and intake use a single transaction and sorted cell/service lock keys. |
| Immutable events plus episode projection | ✅ Yes | Report-event trigger, episode lifecycle, and public projection are present. |
| Transactional outbox with leased at-least-once dispatch | ✅ Yes | Alert intents are unique, leased with `FOR UPDATE SKIP LOCKED`, and retryable. |
| HMAC-SHA-256 pseudonym with version | ✅ Yes | Device tokens are server-derived and version-prefixed. |
| Long-running workers run dispatch, expiry, and retention schedules | ⚠️ No | `main.ts` starts only the retention worker; no startup/schedule wiring runs dispatch or expiry workers. |
| Prisma/PostgreSQL consistency boundary | ⚠️ Partial | `schema.prisma` exists, but runtime persistence uses raw `pg` and no Prisma client dependency. |

### TDD Compliance
| Check | Result | Details |
|-------|--------|---------|
| TDD Evidence reported | ✅ | Apply progress contains TDD Cycle Evidence for all 14 Strict-TDD implementation/documentation task rows (2.1–5.3; foundation 1.1–1.5 was Standard). |
| All tasks have tests | ✅ | 14/14 referenced RED files exist; 5.3 is explicitly documentation-only and uses README evidence. |
| RED confirmed (tests exist) | ✅ | 14/14 referenced files exist. |
| GREEN confirmed (tests pass) | ⚠️ | 13/14 executable task rows have current runtime evidence; 5.3 is docs-only and was checked with `git diff --check`. |
| Triangulation adequate | ✅ | Apply evidence records distinct behaviors for each of 14 rows; current matrix separately identifies scenario-level gaps. |
| Safety Net for modified files | ✅ | Safety-net evidence is reported for all 14 rows, with docs-only handling for 5.3. |

**TDD Compliance**: 5/6 checks passed; no missing TDD evidence table.

### Test Layer Distribution
| Layer | Tests | Files | Tools |
|-------|-------|-------|-------|
| Unit | 18 | 9 | Vitest |
| Integration | 16 | 3 | Vitest + Supertest + PostgreSQL 17 fixture |
| E2E | 4 | 2 | Playwright |
| **Total** | **38** | **14** | |

### Changed File Coverage
Coverage analysis skipped — no coverage tool detected in `openspec/config.yaml`.

### Assertion Quality
✅ All assertions verify real behavior; no tautologies, ghost loops, orphan-empty-only assertions, smoke-test-only cases, CSS-only assertions, or mock-heavy files were found.

### Quality Metrics
**Linter**: ✅ No errors (`npm run lint` within `npm run check`)
**Type Checker**: ✅ No errors (`npm run typecheck` within `npm run check`)
**Compose config**: ✅ `docker compose config --quiet` exit 0
**Dependency audit**: ✅ `npm audit --omit=dev` exit 0; 0 vulnerabilities
**Diff check**: ✅ `git diff --check` exit 0

### Issues Found
**CRITICAL**:
1. Four required scenarios are untested at runtime: retry success, no alert on refresh/close, below-threshold public suppression, and incomplete pilot configuration.
2. Public rollout gating violates the configured-resolution requirement when `H3_RESOLUTION` is missing or empty because code falls back to `9` or accepts `0`.
3. Privacy, display-name acceptance, eligibility, restored public closure, and active-map notice scenarios have only partial covering evidence (six partial scenarios), so the strict scenario gate cannot admit a pass.

**WARNING**:
1. Design/runtime drift: `main.ts` starts retention only; dispatch and expiry schedules are not started as specified.
2. Design/runtime drift: runtime uses raw `pg` instead of the planned Prisma client, despite a Prisma schema artifact.
3. `openspec/config.yaml` still describes Prisma and map/report islands as planned, while implementation is present; apply-progress contains historical “Remaining Work Units” sections with stale unchecked markers.
4. Runtime evidence varies across runs because Vitest/Playwright timestamps and worker process IDs are included in captured output; the recorded hash is exact for the final run.

**SUGGESTION**:
1. Add focused runtime tests for every currently partial/untested scenario before re-running final verification.
2. Make H3 resolution explicitly required/configured and either wire the documented dispatch/expiry workers or revise the design.

### Verdict
FAIL
Strict verification cannot pass: 32/42 scenarios are compliant, four are untested, and public rollout gating has a substantive configuration deviation. All executed checks passed, but passing commands do not compensate for missing behavioral evidence.
