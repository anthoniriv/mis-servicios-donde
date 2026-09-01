# Public Outage Map Specification

## Purpose

Define a privacy-preserving public view of reported community outage conditions during the pilot.

## Requirements

### Requirement: Quorum-distinguished publication

The public map **MUST** show a cell and service once at least one eligible outage report exists, marking it **confirmed** only while an active episode has the three distinct eligible reports required for quorum, and **unconfirmed** otherwise. Each public cell **MUST** expose the number of distinct devices that reported it.

#### Scenario: Confirmed active outage

- GIVEN a cell and service have an active confirmed episode
- WHEN a visitor loads the map
- THEN the map MUST show that aggregate condition at the configured H3 resolution as confirmed, with its distinct report count

#### Scenario: Below-threshold reports

- GIVEN fewer than three distinct eligible devices support a cell and service
- WHEN a visitor loads the map
- THEN the map MUST show the condition as unconfirmed with its distinct report count, and MUST NOT reveal any report identities

### Requirement: Public lifecycle

The map **MUST** remove an unconfirmed condition once its reports expire or a quorum confirms it; it **MUST** remove a confirmed condition when its episode becomes restored or expired. It **MUST NOT** describe expiry as restoration. Public aggregate data **MUST NOT** include device tokens, names, coordinates, or individual event timestamps.

#### Scenario: Episode closes

- GIVEN a displayed episode is closed as restored or expired
- WHEN public data is refreshed
- THEN the cell-service condition MUST no longer appear as an active outage

#### Scenario: Public response fields

- GIVEN an active aggregate is public
- WHEN its public representation is inspected
- THEN it MUST contain no report-level identity, location, or time fields

### Requirement: Unofficial-data notice

Every map surface **MUST** clearly state that conditions are community-generated, unofficial, and not provider-confirmed. The notice **MUST** remain visible when no active conditions exist.

#### Scenario: Visitor sees map data

- GIVEN the map contains active conditions
- WHEN a visitor views it
- THEN the unofficial-data notice MUST be presented with the map

#### Scenario: Empty map

- GIVEN no public conditions are available
- WHEN a visitor views the map
- THEN the map MUST show an empty state and the unofficial-data notice

### Requirement: Bounded pilot rollout

Public operation **MUST NOT** be enabled until two or more named pilot zones and one H3 resolution are approved and configured. Only configured zones **MUST** be represented. Intake and map publication **SHOULD** be independently disableable; disabling intake **MUST** preserve the notice and a read-only empty map.

#### Scenario: Incomplete pilot configuration

- GIVEN pilot zone names or the H3 resolution are missing or unapproved
- WHEN public operation is requested
- THEN the system MUST remain disabled

#### Scenario: Pilot rollback

- GIVEN intake is disabled during rollback
- WHEN a visitor opens the public map
- THEN the visitor MUST see a read-only empty map with the unofficial-data notice
