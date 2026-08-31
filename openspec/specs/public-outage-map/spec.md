# Public Outage Map Specification

## Purpose

Define a privacy-preserving public view of confirmed community outage conditions during the pilot.

## Requirements

### Requirement: Minimum-count publication

The public map **MUST** show a cell and service only while an active episode has at least the three distinct eligible reports required for quorum. It **MUST NOT** expose lone reports or suppressed cells.

#### Scenario: Confirmed active outage

- GIVEN a cell and service have an active confirmed episode
- WHEN a visitor loads the map
- THEN the map MUST show that aggregate condition at the configured H3 resolution

#### Scenario: Below-threshold reports

- GIVEN fewer than three distinct eligible devices support a cell and service
- WHEN a visitor loads the map
- THEN the map MUST NOT reveal that condition or its underlying reports

### Requirement: Public lifecycle

The map **MUST** remove a condition when its episode becomes restored or expired. It **MUST NOT** describe expiry as restoration. Public aggregate data **MUST NOT** include device tokens, names, coordinates, or individual event timestamps.

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

Public operation **MUST NOT** be enabled until two or three named pilot zones and one H3 resolution are approved and configured. Only configured zones **MUST** be represented. Intake and map publication **SHOULD** be independently disableable; disabling intake **MUST** preserve the notice and a read-only empty map.

#### Scenario: Incomplete pilot configuration

- GIVEN pilot zone names or the H3 resolution are missing or unapproved
- WHEN public operation is requested
- THEN the system MUST remain disabled

#### Scenario: Pilot rollback

- GIVEN intake is disabled during rollback
- WHEN a visitor opens the public map
- THEN the visitor MUST see a read-only empty map with the unofficial-data notice
