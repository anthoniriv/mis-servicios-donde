# Proposal: Define the Community Outage MVP

## Intent

Let residents report water, electricity, or internet outages and see confirmed conditions without exposing precise locations. The brief leaves multi-service submissions, concurrent transitions, delivery failures, and retention ambiguous.

## Scope

### In Scope
- Report `1..3` distinct services in one idempotent submission; normalize location to H3 and discard coordinates.
- Evaluate abuse controls and consensus; maintain outage episodes and public aggregates.
- Show an unofficial map, create one opening-alert intent per transition, dispatch through Telegram, and generate zone notices.
- Configure pilot zones and one H3 resolution before implementation.

### Out of Scope
- Citywide rollout, official-provider ingestion, accounts, fingerprinting, native apps, predictive analytics, WhatsApp, and restoration alerts.

## Capabilities

### New Capabilities
- `report-intake`: Multi-service validation, idempotency, H3 normalization, and transactional event expansion.
- `privacy-and-abuse-controls`: Pseudonymous identity, eligibility, retention, and restricted visibility.
- `outage-consensus`: Concurrency-safe quorum evaluation and episode opening, refresh, restoration, and expiry.
- `public-outage-map`: Minimum-count cell projection with unofficial-data labeling.
- `community-alert-delivery`: Transactional alert intents, retryable Telegram dispatch, and printable zone notices.

### Modified Capabilities
None; no main specs exist.

## Approach

Use a modular monolith with immutable report events, a serialized projection per H3 cell/service, and a transactional outbox. Initial defaults—subject to product validation—are a 60-minute window, three devices, six-hour active lifetime, 24-hour display-name retention, seven-day report retention, 30-day abuse/idempotency retention, two or three pilot zones, and an implementation-selected H3 resolution.

## Affected Areas

| Area | Impact | Description |
|---|---|---|
| `alertas-cortes-lima.md` | Modified | Clarify normative product assumptions. |
| Future application modules | New | Implement the capabilities. |

## Risks

| Risk | Likelihood | Mitigation |
|---|---|---|
| Pilot density cannot reach quorum | High | Validate defaults and recruit neighborhood partners. |
| Pseudonymous data is mistaken for anonymous data | Medium | Accurate privacy copy, access controls, deletion jobs. |
| Duplicate or lost external alerts | Medium | Unique transition keys, durable retries, provider idempotency where available. |

## Rollback Plan

Disable intake and dispatch independently, retain the public notice, cancel pending intents, and show a read-only empty map. Purge pilot data under the retention policy; rollback never restores deleted data.

## Dependencies

- Named pilot zones, H3 resolution, Telegram channel credentials, privacy review, and partner recruitment.

## Success Criteria

- [ ] Accepted retries and concurrent submissions produce one eligible vote per device/service/window and one opening-alert intent per transition.
- [ ] Coordinates never persist or enter logs; public responses expose neither device tokens nor individual timestamps.
- [ ] Pilot owners validate temporal, retention, geographic, and rollout defaults before implementation.
- [ ] Provider failure does not reject reports and remains recoverable through the outbox.
