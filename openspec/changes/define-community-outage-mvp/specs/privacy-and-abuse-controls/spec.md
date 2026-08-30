# Privacy and Abuse Controls Specification

## Purpose

Define pseudonymous participation, eligibility controls, disclosure boundaries, and retention.

## Requirements

### Requirement: Data minimization

The system **MUST NOT** persist or log raw coordinates or raw device identifiers. It **MUST** use a non-public, server-derived pseudonymous device token for eligibility and idempotency. Product copy **MUST NOT** describe this tracking data as anonymous.

#### Scenario: Accepted request data

- GIVEN a request contains coordinates and a device identifier
- WHEN request processing ends
- THEN neither raw value MUST appear in persisted data, logs, traces, errors, alerts, or notices

#### Scenario: Public data access

- GIVEN any public response is requested
- WHEN the response is produced
- THEN it MUST exclude device tokens, individual event timestamps, and abuse decisions

### Requirement: Optional display names

Display names **MAY** be accepted only after sanitization, **MUST NOT** affect eligibility, and **MUST NOT** appear in alerts, notices, or public map data. They **MUST** be deleted within 24 hours.

#### Scenario: Unsafe display name

- GIVEN a display name contains disallowed content
- WHEN the report is processed
- THEN the system MUST remove or reject the name without rejecting an otherwise valid report

#### Scenario: Name reaches retention limit

- GIVEN a stored display name is 24 hours old
- WHEN retention enforcement runs
- THEN the name MUST no longer be retrievable

### Requirement: Eligibility controls

The system **MUST** limit a pseudonymous device to three submissions per rolling hour. It **MAY** exclude submissions based on duplicate-vote, implausible movement, or restricted shadow-ban rules. Excluded submissions **MUST NOT** affect public counts, and the response **MUST NOT** reveal the specific trust decision.

#### Scenario: Rate limit exceeded

- GIVEN a device has made three submissions in the preceding hour
- WHEN it attempts another submission
- THEN the system MUST prevent that submission from contributing eligible votes

#### Scenario: Silently ineligible report

- GIVEN a structurally valid report fails an eligibility rule
- WHEN processing completes
- THEN public state MUST remain unaffected
- AND the response MUST NOT identify the failed rule

### Requirement: Retention and restricted access

Report events containing cell, status, and pseudonymous token **MUST** be deleted within seven days. Abuse, rate-limit, and idempotency records **MUST** be deleted within 30 days. Only non-linkable aggregates **MAY** be retained longer. Restricted data **MUST** be unavailable through public interfaces.

#### Scenario: Retention deadlines

- GIVEN records reach their applicable retention deadline
- WHEN retention enforcement runs
- THEN those records MUST be irreversibly deleted

#### Scenario: Rollback purge

- GIVEN the pilot is rolled back
- WHEN pilot data is purged
- THEN deletion MUST follow these limits and deleted data MUST NOT be restored
