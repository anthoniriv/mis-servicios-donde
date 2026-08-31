# Report Intake Specification

## Purpose

Define acceptance of a resident's outage submission without retaining precise coordinates.

## Requirements

### Requirement: Valid submission

The system **MUST** accept a client-generated submission identifier, device identifier, status, coordinates, and between one and three distinct services selected from water, electricity, and internet. Status **MUST** be either outage or restored.

#### Scenario: Valid multi-service submission

- GIVEN a resident within an enabled pilot zone selects two distinct services
- WHEN the resident submits all required valid fields
- THEN the system MUST accept one submission covering both services
- AND it MUST return one consistent acceptance result

#### Scenario: Invalid service selection

- GIVEN a submission contains no service, a duplicate service, or an unsupported service
- WHEN validation occurs
- THEN the system MUST reject the submission without accepting any service

### Requirement: Pilot boundary and location normalization

The system **MUST** accept reports only inside an enabled pilot zone, derive one cell at the configured H3 resolution, and **MUST NOT** retain or expose the submitted coordinates after request processing.

#### Scenario: Location inside the pilot

- GIVEN valid coordinates fall within an enabled pilot zone
- WHEN the submission is accepted
- THEN every service in that submission MUST be associated with the same derived H3 cell

#### Scenario: Location outside the pilot

- GIVEN coordinates fall outside all enabled pilot zones or cannot be validated
- WHEN the resident submits a report
- THEN the system MUST reject it without creating accepted report events

### Requirement: Atomic service expansion

An accepted submission **MUST** produce exactly one report event per selected service, linked to the same submission, or produce none if any service cannot be accepted.

#### Scenario: Expansion succeeds

- GIVEN a valid submission selects all three supported services
- WHEN acceptance completes
- THEN exactly three service-specific report events MUST exist

#### Scenario: One service fails acceptance

- GIVEN processing cannot accept one selected service
- WHEN the submission is evaluated
- THEN the system MUST accept no events from that submission

### Requirement: Idempotent retries

For a device and submission identifier, identical retries **MUST** return the original outcome and **MUST NOT** create additional events or votes. Reuse with materially different input **MUST** be rejected as a conflict.

#### Scenario: Identical retry

- GIVEN a device has an accepted submission
- WHEN it repeats the same submission identifier and content
- THEN the system MUST return the prior acceptance outcome without new events

#### Scenario: Conflicting retry

- GIVEN a device has used a submission identifier
- WHEN it reuses that identifier with different services, status, or location
- THEN the system MUST reject the request as conflicting
