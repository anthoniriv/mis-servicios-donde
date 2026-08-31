# Outage Consensus Specification

## Purpose

Define deterministic, concurrency-safe outage episodes from eligible community reports.

## Requirements

### Requirement: Eligible quorum

For each H3 cell, service, and status, the system **MUST** establish quorum from three distinct eligible devices within a rolling 60-minute window. A device **MUST** contribute at most one vote to the same cell, service, and status during that window.

#### Scenario: Quorum reached

- GIVEN two distinct eligible devices have matching votes within 60 minutes
- WHEN a third distinct eligible device submits the same cell, service, and status
- THEN the system MUST recognize one quorum

#### Scenario: Duplicate or stale vote

- GIVEN a vote repeats an already-counted device or falls outside the rolling window
- WHEN quorum is evaluated
- THEN that vote MUST NOT increase the distinct-device count

### Requirement: Episode opening

An outage-status quorum **MUST** open one active episode for its cell and service. Concurrent reports crossing the threshold **MUST** yield one opening transition and one request for an opening alert, never multiple transitions.

#### Scenario: Concurrent threshold crossing

- GIVEN a cell and service are one distinct vote short of quorum
- WHEN eligible matching reports arrive concurrently
- THEN exactly one active episode and one opening transition MUST result

#### Scenario: Quorum dimensions remain isolated

- GIVEN eligible reports differ by cell, service, or status
- WHEN they are evaluated
- THEN the system MUST NOT combine them into one quorum

### Requirement: Active episode refresh

An active episode **MUST** expire six hours after its latest qualifying outage quorum. A later outage quorum **MUST** refresh that deadline but **MUST NOT** create another opening transition. Reports below quorum **MUST NOT** extend it.

#### Scenario: Qualifying refresh

- GIVEN an episode is active
- WHEN a new outage quorum is reached before expiry
- THEN its expiry MUST move to six hours after that quorum
- AND no opening alert request MUST be added

#### Scenario: Lone report does not refresh

- GIVEN an episode is active and approaching expiry
- WHEN one eligible outage report arrives without a new quorum
- THEN the episode's expiry MUST remain unchanged

### Requirement: Restoration and expiry

A restored-status quorum composed of reports after the opening transition **MUST** close the active episode immediately as restored. Otherwise the episode **MUST** close as expired at its deadline. Expiry **MUST NOT** be represented as proof of restoration. Restoration and expiry alerts **MUST NOT** be requested.

#### Scenario: Confirmed restoration

- GIVEN an episode is active
- WHEN three distinct eligible devices report restored within 60 minutes after opening
- THEN the episode MUST close with a restored outcome

#### Scenario: Stale episode expires

- GIVEN six hours have passed since the latest qualifying outage quorum
- WHEN no later restoration or refresh quorum exists
- THEN the episode MUST close as expired and not as restored

#### Scenario: New outage after closure

- GIVEN an earlier episode is closed
- WHEN a new outage quorum is reached
- THEN the system MUST open a new episode with a distinct transition identity
