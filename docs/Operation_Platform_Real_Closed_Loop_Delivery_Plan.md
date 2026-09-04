# Operation Platform Real Closed-Loop Delivery Plan

Version: 1.0  
Date: 2026-09-04  
Status: Implementation-ready  
Scope: First production-capable China closed loop for `MIB3 Approval`

## 0. Delivery Objective

Move the current browser-local prototype to a server-backed product without changing the product model:

```text
Detect → Understand → Act → Verify → Outcome

Probe / Availability / Incident
  → Signal
  → Problem
  → Operation
  → Action
  → Evidence
  → Verification
  → Outcome
  → History / Executive Overview
```

The first production milestone is complete only when one real Probe abnormality creates a Signal, becomes an Unreported Problem, enters an Operation, receives accountable Actions, is independently verified, creates an Outcome, and updates the China Operation Overview.

### Product guardrails

- Operation Platform is not an Incident Management System.
- Signal is the unified detection object. Incident is only one Signal Source.
- A Problem may exist with zero Incidents.
- Probe remains an independent product and owns Probe definitions and execution logic.
- Operation stores Probe references and consumes Probe Results as Evidence.
- Completing an Action never completes an Operation.
- Only a passed Verification against explicit KPI targets may create a verified Outcome.
- No AI correlation, Kafka, predictive detection, or automatic remediation is required for the first real closed loop.

### Recommended implementation shape

Use a modular monolith for the first production release:

```text
Existing Web UI
    ↓ HTTPS / JSON
Operation Backend API
    ├── Integration adapters
    ├── Signal and correlation service
    ├── Problem service
    ├── Operation and Action service
    ├── Evidence and Verification service
    ├── Outcome and Overview query service
    └── Audit / history service
            ↓
        PostgreSQL

Independent Probe Product
    ↔ Probe execution API / result callback
```

Reference stack: Node.js 22, TypeScript, Fastify, PostgreSQL 16, SQL migrations, OpenAPI 3.1, OIDC for users, OAuth2 client credentials or signed webhook credentials for integrations.

The exact backend framework may be changed before implementation, but PostgreSQL, OpenAPI-first contracts, server-authoritative state transitions, and the domain boundaries below are release requirements.

## 1. Delivery Sequence and Gates

| Order | Milestone | Output | Gate to continue |
| --- | --- | --- | --- |
| 1 | Database | Migrations, seed data, constraints, ERD | Migration up/down and integrity tests pass |
| 2 | API | Approved OpenAPI contract and examples | Product, Frontend, Backend, and Probe owners sign off |
| 3 | Backend | Real persistence, state machine, correlation, overview aggregation | Backend integration tests pass without browser state |
| 4 | Probe integration | Real run request and idempotent result ingestion | Probe sandbox result becomes Signal/Evidence exactly once |
| 5 | Frontend migration | Existing UI reads/writes through real API | No business data is read from `localStorage` |
| 6 | First real closed loop | China MIB3 scenario completed end to end | Verified Outcome updates all related objects and Overview |
| 7 | Acceptance | Functional, security, reliability, UX evidence | Release checklist signed by Product, Engineering, QA, Probe owner |

Suggested delivery team: one Backend Engineer, one Frontend Engineer, one QA Engineer, one Probe integration owner, and one Product/Operation acceptance owner.

---

# Step 1: Database

## 1.1 Goal

Replace `prototype-state.js` as the source of truth with a relational, auditable model. Preserve the existing object relationships and lifecycle rules.

## 1.2 Direct deliverables

Create:

```text
backend/db/migrations/001_extensions.sql
backend/db/migrations/002_reference_tables.sql
backend/db/migrations/003_signal_and_source_events.sql
backend/db/migrations/004_problem_and_links.sql
backend/db/migrations/005_operation_action.sql
backend/db/migrations/006_probe_evidence_verification.sql
backend/db/migrations/007_outcome_history_outbox.sql
backend/db/migrations/008_indexes.sql
backend/db/seeds/china_mib3.sql
backend/db/schema.md
backend/db/erd.mmd
backend/test/db/*.test.ts
```

## 1.3 Required tables

### Reference and identity

| Table | Required fields | Purpose |
| --- | --- | --- |
| `services` | `id`, `code`, `name`, `active` | Canonical service identity such as `MIB3_APPROVAL` |
| `regions` | `id`, `code`, `name`, `timezone` | Canonical region such as `CN` / `China` |
| `environments` | `id`, `code`, `name` | `production`, `staging`, `test` |
| `actors` | `id`, `external_subject`, `display_name`, `actor_type` | User or service account reference |
| `signal_sources` | `id`, `code`, `name`, `source_type`, `active` | Probe, Availability, Incident, SMO, Release |

### Source ingestion and Signal

`source_events`

```text
id UUID PK
source_id UUID FK signal_sources
external_event_id VARCHAR NOT NULL
idempotency_key VARCHAR NOT NULL
event_type VARCHAR NOT NULL
occurred_at TIMESTAMPTZ NOT NULL
received_at TIMESTAMPTZ NOT NULL DEFAULT now()
payload JSONB NOT NULL
payload_hash VARCHAR NOT NULL
processing_status VARCHAR NOT NULL
processing_error TEXT NULL
created_at TIMESTAMPTZ NOT NULL DEFAULT now()
UNIQUE(source_id, external_event_id)
UNIQUE(source_id, idempotency_key)
```

`signals`

```text
id UUID PK
display_id VARCHAR UNIQUE NOT NULL       -- SIG-000001
source_event_id UUID FK source_events
source_id UUID FK signal_sources
signal_type VARCHAR NOT NULL
service_id UUID FK services
region_id UUID FK regions
environment_id UUID FK environments
severity VARCHAR NOT NULL
status VARCHAR NOT NULL
metric_name VARCHAR NOT NULL
metric_value NUMERIC NOT NULL
metric_threshold NUMERIC NULL
metric_unit VARCHAR NULL
users_affected INTEGER NOT NULL DEFAULT 0
business_impact VARCHAR NULL
description TEXT NOT NULL
detected_at TIMESTAMPTZ NOT NULL
correlation_score NUMERIC NULL
version INTEGER NOT NULL DEFAULT 1
created_at TIMESTAMPTZ NOT NULL DEFAULT now()
updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
```

Allowed Signal states:

```text
DETECTED → ANALYZING → CORRELATED → PROBLEM_CREATED → ARCHIVED
                         └────────→ DISMISSED
```

### Incident and Problem

| Table | Important fields |
| --- | --- |
| `incidents` | `id`, `display_id`, `external_incident_id`, `source_event_id`, `title`, `priority`, `status`, `owner_actor_id`, `service_id`, `region_id`, `created_at_source`, `resolved_at_source` |
| `problems` | `id`, `display_id`, `title`, `description`, `service_id`, `region_id`, `issue_family`, `risk`, `impact_summary`, `status`, `owner_actor_id`, `first_detected_at`, `last_detected_at`, `unreported`, `version`, timestamps |
| `problem_signals` | `problem_id`, `signal_id`, `relation_type`, `correlation_score`, `linked_at`, `linked_by` |
| `problem_incidents` | `problem_id`, `incident_id`, `linked_at`, `linked_by` |

Constraints:

- `problem_signals` and `problem_incidents` use composite primary keys.
- `problems.unreported = true` is valid and expected when no `problem_incidents` row exists.
- Application logic recalculates `unreported` whenever an Incident is linked or unlinked.
- Problem states are `DETECTED`, `INVESTIGATING`, `ACTIVE`, `VERIFYING`, `RESOLVED`, `CLOSED`.

### Operation and Action

`operations`

```text
id UUID PK
display_id VARCHAR UNIQUE NOT NULL       -- OP-000001
problem_id UUID FK problems NOT NULL
title VARCHAR NOT NULL
objective TEXT NOT NULL
trigger_summary TEXT NOT NULL
scope JSONB NOT NULL
priority VARCHAR NOT NULL
risk VARCHAR NULL
owner_actor_id UUID FK actors NOT NULL
expected_outcome TEXT NOT NULL
kpi_definition JSONB NOT NULL
evidence_requirement JSONB NOT NULL
start_at TIMESTAMPTZ NULL
target_at TIMESTAMPTZ NULL
completed_at TIMESTAMPTZ NULL
status VARCHAR NOT NULL
verification_status VARCHAR NOT NULL
version INTEGER NOT NULL DEFAULT 1
created_at TIMESTAMPTZ NOT NULL DEFAULT now()
updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
```

`operation_stakeholders`

```text
operation_id UUID FK operations
actor_id UUID FK actors
role VARCHAR NOT NULL
PRIMARY KEY(operation_id, actor_id, role)
```

`actions`

```text
id UUID PK
display_id VARCHAR UNIQUE NOT NULL       -- ACT-000001
operation_id UUID FK operations NOT NULL
title VARCHAR NOT NULL
description TEXT NOT NULL
action_type VARCHAR NOT NULL
owner_actor_id UUID FK actors NOT NULL
priority VARCHAR NOT NULL
status VARCHAR NOT NULL
due_at TIMESTAMPTZ NULL
expected_result TEXT NOT NULL
actual_result TEXT NULL
completed_at TIMESTAMPTZ NULL
version INTEGER NOT NULL DEFAULT 1
created_at TIMESTAMPTZ NOT NULL DEFAULT now()
updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
```

Allowed Operation states:

```text
DRAFT → PLANNED → IN_PROGRESS → VERIFYING → COMPLETED
                    ↕ BLOCKED       │
                                    └─ FAILED verification → VERIFYING
Any non-final state → CANCELLED
```

Allowed Action states:

```text
PLANNED → IN_PROGRESS → COMPLETED
              ↕ BLOCKED
Any non-final state → CANCELLED
```

### Probe references, Evidence, Verification, Outcome

Probe remains external. Do not copy Probe definitions into Operation Platform.

| Table | Purpose |
| --- | --- |
| `probe_refs` | Stores `external_probe_id`, display name, service/region mapping, and external URL only |
| `probe_runs` | Stores Operation request ID, external run ID, purpose, status, requested/finished timestamps, and raw result source event |
| `evidence` | Normalized objective proof linked to Problem, Operation, and optionally Action |
| `verification_runs` | Target comparison and explicit decision for an Operation |
| `outcomes` | Final verified before/after result and business impact |

`evidence`

```text
id UUID PK
display_id VARCHAR UNIQUE NOT NULL       -- EVD-000001
evidence_type VARCHAR NOT NULL           -- PROBLEM, ACTION, OUTCOME
source_type VARCHAR NOT NULL             -- PROBE, AVAILABILITY, INCIDENT, RELEASE
source_ref VARCHAR NOT NULL
problem_id UUID FK problems NOT NULL
operation_id UUID FK operations NULL
action_id UUID FK actions NULL
service_id UUID FK services NOT NULL
region_id UUID FK regions NOT NULL
observed_at TIMESTAMPTZ NOT NULL
metric_name VARCHAR NOT NULL
expected_value NUMERIC NULL
actual_value NUMERIC NULL
unit VARCHAR NULL
status VARCHAR NOT NULL
metadata JSONB NOT NULL DEFAULT '{}'
created_at TIMESTAMPTZ NOT NULL DEFAULT now()
UNIQUE(source_type, source_ref, evidence_type)
```

`verification_runs`

```text
id UUID PK
display_id VARCHAR UNIQUE NOT NULL       -- VRF-000001
operation_id UUID FK operations NOT NULL
probe_run_id UUID FK probe_runs NULL
status VARCHAR NOT NULL                  -- REQUESTED/RUNNING/PENDING_REVIEW/PASSED/FAILED
target_snapshot JSONB NOT NULL
actual_snapshot JSONB NULL
decision_reason TEXT NULL
decided_by UUID FK actors NULL
decided_at TIMESTAMPTZ NULL
created_at TIMESTAMPTZ NOT NULL DEFAULT now()
```

`outcomes`

```text
id UUID PK
display_id VARCHAR UNIQUE NOT NULL       -- OUT-000001
operation_id UUID FK operations UNIQUE NOT NULL
problem_id UUID FK problems NOT NULL
verification_run_id UUID FK verification_runs UNIQUE NOT NULL
status VARCHAR NOT NULL                  -- VERIFIED
expected_snapshot JSONB NOT NULL
before_metric JSONB NOT NULL
after_metric JSONB NOT NULL
impact JSONB NOT NULL
conclusion TEXT NOT NULL
verified_at TIMESTAMPTZ NOT NULL
created_at TIMESTAMPTZ NOT NULL DEFAULT now()
```

### Audit and delivery reliability

`history_events` is append-only:

```text
id UUID PK
event_type VARCHAR NOT NULL
aggregate_type VARCHAR NOT NULL
aggregate_id UUID NOT NULL
problem_id UUID NULL
operation_id UUID NULL
actor_id UUID NULL
description TEXT NOT NULL
event_data JSONB NOT NULL DEFAULT '{}'
occurred_at TIMESTAMPTZ NOT NULL
created_at TIMESTAMPTZ NOT NULL DEFAULT now()
```

`outbox_events` supports reliable downstream delivery without Kafka in this release:

```text
id UUID PK
event_type VARCHAR NOT NULL
aggregate_type VARCHAR NOT NULL
aggregate_id UUID NOT NULL
payload JSONB NOT NULL
status VARCHAR NOT NULL
attempt_count INTEGER NOT NULL DEFAULT 0
next_attempt_at TIMESTAMPTZ NULL
created_at TIMESTAMPTZ NOT NULL DEFAULT now()
published_at TIMESTAMPTZ NULL
```

## 1.4 Required indexes

- `signals(service_id, region_id, detected_at DESC)`
- `signals(status, severity, detected_at DESC)`
- `source_events(source_id, external_event_id)` unique
- `problems(region_id, status, risk, updated_at DESC)`
- `operations(problem_id, status, updated_at DESC)`
- `actions(operation_id, status, due_at)`
- `evidence(problem_id, observed_at DESC)`
- `evidence(operation_id, evidence_type, observed_at DESC)`
- `verification_runs(operation_id, created_at DESC)`
- `history_events(problem_id, occurred_at)`
- `history_events(operation_id, occurred_at)`
- GIN index on `source_events.payload` only if operational queries require raw payload search.

## 1.5 Database acceptance gate

- A clean database migrates from zero to latest and rolls back one version.
- Duplicate Probe callbacks do not create duplicate `source_events`, Signals, Probe Runs, or Evidence.
- A Problem with zero Incidents can be persisted with `unreported = true`.
- An Outcome cannot exist without a passed Verification Run.
- Deleting a referenced Problem, Operation, Action, Verification, or Evidence is rejected; use lifecycle states instead.
- Concurrent updates use the `version` column and return a conflict instead of overwriting state.
- Seed data creates China, MIB3 Approval, Probe source, Availability source, test actors, and no fake completed Outcome.

Owner: Backend Engineer + DBA.  
Reviewers: Product domain owner, QA, Security.

---

# Step 2: API

## 2.1 Goal

Freeze an OpenAPI contract before backend and frontend implementation. Commands must enforce lifecycle rules; clients must not set arbitrary statuses.

## 2.2 Direct deliverables

```text
backend/openapi/operation-platform-v1.yaml
backend/openapi/examples/*.json
backend/openapi/errors.md
backend/openapi/authentication.md
backend/openapi/changelog.md
generated/api-client/                   -- generated frontend client
generated/api-types/                    -- generated TypeScript types
```

## 2.3 API conventions

- Base path: `/api/v1`
- JSON fields: `camelCase`
- Database IDs are UUIDs; UI uses stable `displayId` values.
- All timestamps are ISO 8601 UTC; UI formats Asia/Shanghai.
- List endpoints use cursor pagination: `pageSize`, `cursor`, `nextCursor`.
- Mutation responses include `version`; updates require `If-Match` or body `expectedVersion`.
- Integration POSTs require `Idempotency-Key`.
- User APIs use OIDC bearer tokens.
- Integration APIs use OAuth2 client credentials. Signed webhook authentication is allowed when Probe cannot use OAuth2.
- Error envelope:

```json
{
  "error": {
    "code": "INVALID_STATE_TRANSITION",
    "message": "Operation must be VERIFYING before verification can be recorded.",
    "details": {},
    "traceId": "..."
  }
}
```

## 2.4 Required endpoints

### Integration ingestion

| Method | Path | Result |
| --- | --- | --- |
| POST | `/integrations/probe/results` | Store raw Probe event; create Signal and/or Evidence according to run context |
| POST | `/integrations/availability/events` | Store availability event; create Signal/Evidence |
| POST | `/integrations/incidents/events` | Store Incident and related Signal |
| POST | `/integrations/releases/events` | Store Release Action Evidence or correlation context |
| GET | `/integrations/events/{eventId}` | Processing and idempotency status |

Return `202 Accepted` for new asynchronous events and `200 OK` with the existing resource references for duplicate events.

### Signal and correlation

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/signals` | Filter by region, service, status, severity, source, time range |
| GET | `/signals/{signalId}` | Signal, raw source reference, risk, and correlation candidates |
| POST | `/signals/{signalId}/investigations` | Move DETECTED to ANALYZING |
| POST | `/correlations/evaluate` | Evaluate selected Signals without mutation |
| POST | `/problems/from-signals` | Create/adopt Problem from selected Signals |

### Problem

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/problems` | Filter by region, risk, status, unreported, service |
| GET | `/problems/{problemId}` | Detail aggregate: impact, Signals, Incidents, Evidence, Operations, Timeline |
| POST | `/problems/{problemId}/incidents/{incidentId}` | Link Incident and recalculate `unreported` |
| GET | `/problems/{problemId}/recommendation` | Rule-based next action with supporting Evidence |

### Operation and Action

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/operations` | Filter by status, owner, problem, region |
| POST | `/operations` | Create an Operation for one Problem |
| GET | `/operations/{operationId}` | Operation, Actions, Evidence, Verification, Outcome |
| POST | `/operations/{operationId}/start` | DRAFT/PLANNED to IN_PROGRESS |
| POST | `/operations/{operationId}/actions` | Create accountable Action |
| POST | `/actions/{actionId}/start` | PLANNED to IN_PROGRESS |
| POST | `/actions/{actionId}/complete` | Complete with actual result and Evidence reference |
| POST | `/operations/{operationId}/cancel` | Cancel with reason |

### Probe, Evidence, Verification, Outcome

| Method | Path | Purpose |
| --- | --- | --- |
| POST | `/operations/{operationId}/probe-runs` | Request diagnostic or verification run from independent Probe |
| GET | `/probe-runs/{probeRunId}` | Operation-side status and external Probe reference |
| GET | `/evidence` | Evidence library filters |
| GET | `/evidence/{evidenceId}` | Evidence Detail |
| POST | `/operations/{operationId}/verification-runs` | Create target snapshot and request verification |
| POST | `/verification-runs/{verificationId}/decision` | Explicit PASS/FAIL decision |
| GET | `/outcomes` | List verified Outcomes |
| GET | `/outcomes/{outcomeId}` | Before/after, impact, Evidence, Problem, Operation |

`POST /verification-runs/{verificationId}/decision` is the only command allowed to create an Outcome and complete the loop. On PASS it must atomically:

```text
Verification → PASSED
Outcome → VERIFIED
Operation → COMPLETED
Problem → RESOLVED
Related open Signals → ARCHIVED
History events → appended
Outbox events → created
```

On FAIL it must atomically:

```text
Verification → FAILED
Operation → VERIFYING
Problem → VERIFYING
No Outcome created
Corrective Action allowed
History events → appended
```

### Overview and Command Center

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/overview/regions/{regionCode}` | Health, executive summary, service health, business impact, completed Operations, funnel, risk ranking, trend, insights |
| GET | `/command-center?region=CN` | Critical Problems, Unreported Problems, active Operations, pending Verification |

The Overview endpoint aggregates domain records. It must not store an independent dashboard copy.

## 2.5 Contract examples required before implementation

- Unsolicited failing Probe Result with no `operationId`.
- Probe Result bound to a diagnostic Action.
- Probe Result bound to a Verification Run.
- Duplicate Probe callback.
- Availability degradation and recovery.
- Incident created after an Unreported Problem already exists.
- Verification PASS and FAIL commands.
- Optimistic locking conflict.
- Overview response for China before and after verified Outcome.

## 2.6 API acceptance gate

- OpenAPI validates with zero errors.
- Generated client compiles.
- Every mutation documents valid source state, target state, authorization, idempotency behavior, and error codes.
- Product signs off on the lifecycle wording and Overview definitions.
- Probe owner signs off on request/callback fields and authentication.
- No API makes Incident mandatory for Problem or Operation creation.

Owner: Backend API owner.  
Reviewers: Frontend, Probe owner, Product, Security, QA.

---

# Step 3: Backend

## 3.1 Goal

Implement the approved API contract, persistence, lifecycle state machine, correlation, and executive aggregation. Keep the first release a modular monolith.

## 3.2 Direct deliverables

```text
backend/src/app.ts
backend/src/config/*
backend/src/auth/*
backend/src/modules/integration/*
backend/src/modules/signal/*
backend/src/modules/correlation/*
backend/src/modules/problem/*
backend/src/modules/operation/*
backend/src/modules/action/*
backend/src/modules/probe/*
backend/src/modules/evidence/*
backend/src/modules/verification/*
backend/src/modules/outcome/*
backend/src/modules/overview/*
backend/src/modules/history/*
backend/src/shared/state-machine/*
backend/src/shared/observability/*
backend/test/unit/*
backend/test/integration/*
backend/Dockerfile
docker-compose.yml
.env.example
```

## 3.3 Backend work packages

### BE-01: Platform foundation

- TypeScript strict mode.
- Environment validation at startup.
- Structured JSON logging with `traceId`, actor, route, aggregate ID, and result.
- Health endpoints: `/health/live`, `/health/ready`.
- Database pool, transaction helper, migration runner.
- Central error mapping to documented API codes.
- OIDC authorization and integration client authentication.

Done when the service starts with an empty migrated database and rejects missing/invalid credentials.

### BE-02: Idempotent integration ingestion

- Authenticate source client.
- Validate payload against OpenAPI schema.
- Persist raw `source_events` before normalization.
- Deduplicate by source + external event ID and Idempotency Key.
- Normalize through source-specific adapters.
- Store processing result or error without losing raw payload.
- Emit history and outbox records in the same transaction.

Done when replaying the same callback 20 times creates one business result.

### BE-03: Signal and correlation

V1 deterministic rules only:

```text
same service
+ same region
+ same environment
+ within configurable time window
+ compatible issue family or metric
= Problem Candidate
```

Configuration must contain thresholds and time windows, not source code constants.

Return:

```text
candidate Problem
correlation score
matched Signals
matched rules
recommendation
```

Do not automatically merge into an existing Problem when confidence is below the configured threshold. Surface the candidate for Operation Manager review.

### BE-04: Problem lifecycle

- Create Problem from one or more Signals.
- Link/unlink Incidents and recalculate `unreported`.
- Return a single Problem Detail aggregate.
- Generate rule-based Recommended Next Action from current state and Evidence.
- Append every lifecycle mutation to `history_events`.

### BE-05: Operation and Action lifecycle

- Enforce state transitions server-side.
- Require Objective, Owner, KPI target, Expected Outcome, and Evidence Requirement.
- Require owner and expected result for every Action.
- Require actual result and Evidence reference when completing fix/deployment Actions.
- Never infer Operation completion from all Actions being completed.

### BE-06: Evidence and Verification

- Normalize Probe, Availability, Incident, and Release evidence.
- Freeze the KPI target in `verification_runs.target_snapshot` when verification starts.
- Compare numerical values and units; reject incompatible units.
- Require explicit authorized decision after evidence collection.
- A failed verification keeps the Operation open and allows a new corrective Action and Verification Run.

### BE-07: Outcome transaction

- Create Outcome only from PASSED Verification.
- Calculate before/after deltas from linked Evidence, never from UI-submitted summary values.
- Store impact inputs and calculation version in `impact` metadata.
- Complete Operation, resolve Problem, archive related Signals, append History, and create Outbox records in one transaction.
- Return the complete Outcome aggregate.

### BE-08: Overview and attention queries

Overview must calculate:

- Operation Health from unresolved critical risk and failed/pending Verification.
- Total and Resolved Problems for the selected period.
- Verified Improvement only from verified Outcomes.
- Risk Reduction from documented versioned formula.
- Business impact only from verified Outcome impact.
- Completed Operations with before/after Evidence.
- Closed-loop funnel and conversion rates.
- Risk Service Ranking from unresolved Problems.
- Trend buckets based on selected time range.

Command Center must calculate current attention, not reuse Overview result cards.

### BE-09: Reliability and observability

- Metrics for ingest count, reject count, duplicate count, processing latency, correlation result, Probe callback latency, verification pass/fail, and closed-loop duration.
- Alert when Probe callback processing fails repeatedly.
- Outbox retry with exponential backoff and dead-letter status.
- Request audit log and domain history are separate concerns.
- Backup/restore runbook and migration runbook.

## 3.4 Backend test matrix

| Test | Expected |
| --- | --- |
| Failing unsolicited Probe Result | Signal created; no Incident required |
| Same Probe callback repeated | Same Signal/Evidence references returned |
| Correlated Probe + Availability | Problem Candidate with matched rule evidence |
| Create Operation without KPI | `422 KPI_REQUIRED` |
| Complete Action without Evidence | Rejected when Action type requires proof |
| Verification result over target | FAILED; no Outcome; Operation remains VERIFYING |
| Corrective Action then new passing Verification | New Verification Run; Outcome created once |
| Concurrent Operation update | One succeeds; stale version receives `409` |
| Overview after PASS | Resolved, completed, verified, impact and trend all update |

## 3.5 Backend acceptance gate

- Unit coverage is at least 80% for domain and state-machine modules.
- All state transitions have integration tests.
- Contract tests match the frozen OpenAPI examples.
- A full loop can be completed through API calls without using the UI.
- The browser-local prototype state is not imported by Backend.
- No production rule depends on `SIG-0001`, `PRB-204`, `OP-102`, or other fixed display IDs.

Owner: Backend Engineer.  
Reviewers: QA, Product, Frontend, Security.

---

# Step 4: Probe Integration

## 4.1 Goal

Connect the independent Probe product in both directions while preserving ownership boundaries.

```text
Operation asks Probe to execute
    → Probe owns execution
    → Probe returns result
    → Operation normalizes result into Signal or Evidence
```

## 4.2 Direct deliverables

```text
backend/src/modules/probe/probe-client.ts
backend/src/modules/probe/probe-result-adapter.ts
backend/src/modules/probe/probe-auth.ts
backend/src/modules/probe/probe-reconciliation-job.ts
backend/openapi/examples/probe-run-request.json
backend/openapi/examples/probe-result-detection.json
backend/openapi/examples/probe-result-verification.json
docs/integrations/probe-contract.md
docs/integrations/probe-runbook.md
docs/integrations/probe-field-mapping.csv
backend/test/contract/probe/*.test.ts
```

## 4.3 Operation to Probe request

Minimum request:

```json
{
  "clientRequestId": "UUID",
  "probeId": "MIB3_APPROVAL_DOWNLOAD_CN",
  "purpose": "VERIFICATION",
  "region": "China",
  "environment": "Production",
  "context": {
    "problemId": "PRB-...",
    "operationId": "OP-...",
    "actionId": null,
    "verificationId": "VRF-..."
  },
  "target": {
    "metric": "failure_rate",
    "operator": "LT",
    "value": 1,
    "unit": "%"
  },
  "callbackUrl": "https://operation.example/api/v1/integrations/probe/results"
}
```

Operation stores `clientRequestId` before calling Probe. Probe must return its `runId`; both IDs are required in all callbacks.

## 4.4 Probe to Operation callback

Minimum result:

```json
{
  "eventId": "probe-event-unique-id",
  "runId": "probe-run-id",
  "clientRequestId": "UUID",
  "probeId": "MIB3_APPROVAL_DOWNLOAD_CN",
  "purpose": "VERIFICATION",
  "service": "MIB3 Approval",
  "region": "China",
  "environment": "Production",
  "startedAt": "2026-09-04T02:00:00Z",
  "completedAt": "2026-09-04T02:05:00Z",
  "status": "COMPLETED",
  "metrics": [
    {
      "name": "failure_rate",
      "value": 0.4,
      "unit": "%",
      "sampleSize": 100
    }
  ],
  "resultUrl": "https://probe.example/runs/probe-run-id"
}
```

## 4.5 Result classification rules

| Probe context | Operation behavior |
| --- | --- |
| No Operation/Action/Verification context and metric is abnormal | Create source event, Signal, and Problem Evidence; allow Unreported Problem |
| Bound to diagnostic Action | Create Probe Run and Problem Evidence; link to Problem, Operation, Action |
| Bound to Verification Run | Create Outcome Evidence and populate actual snapshot; set Verification to PENDING_REVIEW |
| Probe execution failed technically | Mark Probe Run FAILED; do not treat technical execution failure as business KPI failure |
| Duplicate callback | Return existing resource references; create nothing new |
| Unknown Probe/service/region mapping | Quarantine source event and alert; do not create a misleading Signal |

## 4.6 Integration reliability

- Probe retries callback for network/5xx failures with the same Event ID.
- Operation returns success only after the source event is durably stored.
- Operation reconciliation polls Probe for `RUNNING` requests that exceed the callback SLA.
- Maximum accepted clock skew and timestamp rules are documented.
- Secrets are stored in a secret manager, never in repository files.
- Raw Probe payload is retained according to the agreed operational retention policy.
- Operation UI links to `resultUrl`; it does not duplicate the Probe analysis UI.

## 4.7 Probe acceptance gate

- Sandbox execution request returns a real Probe run ID.
- Successful callback is authenticated and stored.
- Replaying the callback produces no duplicate business records.
- Unsolicited failing result creates a Signal without an Incident.
- Verification result creates Outcome Evidence but does not auto-pass the decision.
- Operation UI can open the independent Probe result URL.
- Probe and Operation support teams approve the joint runbook.

Owner: Probe integration owner + Backend Engineer.  
Reviewers: Security, QA, Operation Manager.

---

# Step 5: Frontend Migration

## 5.1 Goal

Keep the existing visual language and page hierarchy, but replace browser-local business state with the real API.

## 5.2 Direct deliverables

```text
api-client.js                         -- typed/generated wrapper or thin browser adapter
remote-state.js                       -- loading/cache/refresh state, not business source of truth
app.js                                -- render functions consume API DTOs
index.html                            -- environment configuration and build assets
styles.css
styles-v11.css
styles-v12.css
frontend/config.example.js
frontend/test/unit/*
frontend/test/e2e/*
```

Keep `prototype-state.js` only behind an explicit local demo flag during migration. It must not load in production mode.

## 5.3 Page-to-API mapping

| Page | API |
| --- | --- |
| China Operation Overview | `GET /overview/regions/CN` |
| Command Center | `GET /command-center?region=CN` |
| Signal List/Detail | `GET /signals`, `GET /signals/{id}` |
| Problem List/Detail | `GET /problems`, `GET /problems/{id}`, recommendation endpoint |
| Operation List/Detail | `GET /operations`, `GET /operations/{id}` |
| Evidence List/Detail | `GET /evidence`, `GET /evidence/{id}` |
| Outcome Detail | `GET /outcomes/{id}` |
| History | Problem/Operation detail timeline or dedicated history query |
| Probe run action | `POST /operations/{id}/probe-runs` |

## 5.4 Frontend work packages

### FE-01: API foundation

- Runtime API base URL config.
- OIDC token acquisition/refresh.
- Generated DTOs or contract-derived types.
- Request correlation ID and structured error parsing.
- Abort stale requests on route change.
- Server is authoritative; no optimistic status transition for verification or closure.

### FE-02: Read migration

Migrate in this order:

```text
Overview
→ Command Center
→ Signal List/Detail
→ Problem List/Detail
→ Operation List/Detail
→ Evidence/Outcome/History
```

Every page must implement Loading, Empty, Error, Unauthorized, and Stale/Refresh states.

### FE-03: Command migration

Replace local state calls with API commands:

```text
Investigate Signal
Create Problem
Create Operation
Create/Start/Complete Action
Request Probe
Start Verification
Record PASS/FAIL decision
```

Disable commands while submitted and show the server-returned state after completion.

### FE-04: Refresh strategy

- Poll active Probe/Verification state every 10 seconds while the detail page is visible.
- Refresh Command Center and Overview every 30 seconds.
- Stop polling when the page is hidden.
- Manual refresh remains available.
- SSE/WebSocket is not required for the first closed loop.

### FE-05: Navigation and traceability

Required links:

```text
Signal → Problem
Problem → Operation
Operation → Action / Evidence / Verification / Outcome
Evidence → source reference and related objects
Outcome → Problem / Operation / Evidence
Risk Service → Problem Detail
Probe Result → independent Probe URL
```

### FE-06: UI regression protection

- Preserve dark navigation, light content, blue actions, current cards, typography, and routing.
- Preserve Unreported Problem as a first-class Command Center section.
- Preserve Recommended Next Action and Active Operations on Problem Detail.
- Preserve Executive Overview hierarchy and before/after comparisons.
- Do not turn the Overview into an Incident count dashboard.

## 5.5 Frontend acceptance gate

- Production build does not load or write `prototype-state.js` / `localStorage` business data.
- Refreshing any detail URL restores the same server-backed entity.
- API errors are visible and actionable; failed mutations do not show success state.
- Desktop 1440px and mobile 390px have no page-level horizontal overflow.
- Keyboard focus, labels, button disabled states, and color contrast pass accessibility checks.
- All required entity links resolve to a real detail view.
- End-to-end tests cover PASS and FAIL verification paths.

Owner: Frontend Engineer.  
Reviewers: Product Design, QA, Backend.

---

# Step 6: First Real Closed Loop

## 6.1 Fixed scenario

```text
Service: MIB3 Approval
Region: China
Environment: Production
Journey: Approval Download
Primary KPI: failure_rate < 1%
Secondary KPI: availability > 99.7%
Detection baseline: failure_rate 12.8%, availability 96.1%
Expected verified result: failure_rate 0.4%, availability 99.8%
Initial Incident count: 0
```

Do not hard-code generated Platform display IDs. Record the IDs returned by each API call in the execution report.

## 6.2 Preconditions

- MIB3 Approval, China, Production mappings exist in both systems.
- Probe `MIB3_APPROVAL_DOWNLOAD_CN` is approved for diagnostic and verification execution.
- Probe credentials and callback allow-list are active.
- Availability source can submit baseline and recovery evidence.
- Operation Manager, Backend MIB3, and Probe Ops actors can authenticate.
- KPI target and unit mapping have Product and Probe owner approval.
- Production exercise window and rollback contacts are agreed.

## 6.3 Execution script and expected outputs

| Step | Actor/system | Action | Required observable output |
| --- | --- | --- | --- |
| 1 | Probe | Send real unsolicited abnormal result: 12.8% | `202`; one `source_event`; one DETECTED Signal |
| 2 | Availability source | Send 96.1% degradation | Second Signal/Evidence linked by service, region, environment, time |
| 3 | Correlation service | Evaluate rules | Problem Candidate with matched Signals and rule explanation |
| 4 | Operation Manager | Create/adopt Problem | Problem has zero Incidents and `unreported=true` |
| 5 | UI | Open Problem Detail | Impact, Signals, Probe, Availability, Timeline, recommendation visible |
| 6 | Operation Manager | Create Operation | Objective, owner, KPI target, evidence requirement persisted |
| 7 | Operation Manager | Create diagnostic Probe Action | Action assigned to Probe Ops with expected result |
| 8 | Operation Platform | Request diagnostic Probe | External Probe run ID shown; callback creates Problem Evidence |
| 9 | Backend MIB3 | Complete investigation/fix Action | Actual result plus Release/Action Evidence attached |
| 10 | Operation Manager | Start Verification | Target snapshot frozen; Operation and Problem enter VERIFYING |
| 11 | Operation Platform | Request verification Probe | Result 0.4% creates Outcome Evidence and PENDING_REVIEW Verification |
| 12 | Availability source | Send recovery result 99.8% | Recovery Evidence joins the same Verification context |
| 13 | Authorized reviewer | Record PASS | Verification PASSED; Outcome VERIFIED; Operation COMPLETED; Problem RESOLVED; Signals ARCHIVED |
| 14 | UI | Open Outcome Detail | Before/after, Evidence, business impact, Operation and Problem links visible |
| 15 | UI | Open China Overview | Resolved, completed, verified improvement, impact, trend and insights update |

## 6.4 Required failure rehearsal

Before the final PASS run, execute one controlled failed Verification with `failure_rate = 4.8%`:

- Verification becomes FAILED.
- Operation remains VERIFYING.
- Problem is not resolved.
- No Outcome is created.
- UI recommends a corrective Action.
- A new Action and a new Verification Run can be created.
- The subsequent 0.4% run produces the only final Outcome.

## 6.5 Execution evidence package

Create:

```text
docs/acceptance/first-real-loop/execution-log.md
docs/acceptance/first-real-loop/api-transcript.json
docs/acceptance/first-real-loop/entity-ids.json
docs/acceptance/first-real-loop/database-checks.sql
docs/acceptance/first-real-loop/screenshots/
docs/acceptance/first-real-loop/probe-result-links.md
docs/acceptance/first-real-loop/known-issues.md
```

Screenshots required:

- Probe source result.
- Signal Detail.
- Unreported Problem in Command Center.
- Problem Detail recommendation.
- Active Operation and Actions.
- Failed Verification state.
- Corrective Action.
- Passed Verification and Outcome Detail.
- Updated China Operation Overview.
- Closed-loop History.

## 6.6 First-loop acceptance gate

- The entire flow uses real API and PostgreSQL state.
- At least the Probe result is generated by the independent Probe environment, not seeded or edited in the database.
- All object links can be traced from source event to Outcome.
- The FAIL rehearsal does not close the Operation.
- The PASS decision updates all aggregates in one transaction.
- No operator manually changes database status.
- All timestamps, actors, target values, actual values, and source references are present in History.

Owner: Operation Manager.  
Execution participants: Backend MIB3, Probe Ops, Backend Engineer, Frontend Engineer, QA.

---

# Step 7: Final Acceptance Standard

## 7.1 Product acceptance

Management can answer from the product:

1. Is China operation healthy?
2. What current risks need attention?
3. Which Problems were solved?
4. What Operations were executed and by whom?
5. What Evidence proves the result?
6. Did availability, failure rate, users affected, or downtime improve?

The answers must come from linked domain records, not dashboard-only mock values.

## 7.2 Functional acceptance

- Probe, Availability, and Incident are independent sources.
- Signal ingestion is idempotent.
- Correlation shows matched Signals and rules.
- Problem creation does not require an Incident.
- Recommended Next Action includes action, reason, Evidence, owner, and expected outcome.
- Operation includes accountable Actions and KPI target.
- Evidence is traceable to source and related entities.
- PASS and FAIL Verification behavior matches the state model.
- Outcome includes before, after, delta, impact, conclusion, and Evidence.
- Overview and Command Center serve different management questions.

## 7.3 Data integrity acceptance

- No orphan Signal, Evidence, Verification, Outcome, Action, or Operation records.
- One Probe event produces at most one source event and one context-appropriate business result.
- Outcome references one passed Verification and one Operation.
- Audit/History is append-only and ordered.
- Optimistic locking prevents silent overwrites.
- All metrics store numerical value and unit separately.
- Dashboard totals reconcile with detail queries for the same filters and period.

## 7.4 Security acceptance

- User and integration authentication are enforced.
- Roles separate Operation Manager, Backend Engineer, Probe Operator, Product Manager, and read-only Management access.
- Only authorized roles can record Verification decisions or cancel Operations.
- Integration credentials are scoped per source and stored outside the repository.
- Raw payload logging masks secrets and personal data.
- Dependency and container scans have no unresolved critical findings.

## 7.5 Reliability and performance acceptance

Initial targets:

| Measure | Target |
| --- | --- |
| Integration API availability | 99.9% monthly |
| Signal ingest acknowledgment | p95 < 500 ms after durable source-event storage |
| Signal visible in UI | p95 < 30 seconds from accepted callback |
| Detail query | p95 < 500 ms at agreed V1 data volume |
| Overview query | p95 < 2 seconds |
| Duplicate event rate | 0 duplicate business records |
| Lost accepted events | 0 |
| RPO | ≤ 15 minutes |
| RTO | ≤ 4 hours |

Load test volume must be agreed using actual source estimates before release; do not invent production throughput from prototype data.

## 7.6 UX acceptance

- China Overview answers health, solved Problems, business value, and risk trend without opening an Incident list.
- Command Center begins with current attention and Unreported Problems.
- Problem Detail preserves Impact → Signals/Incidents/Probe/Availability → Recommendation → Operation → Timeline.
- Probe is visibly labeled as an independent Evidence Generator.
- Mobile and desktop layouts have no incoherent overlap or horizontal page overflow.
- Loading, Empty, Error, Unauthorized, stale data, and retry states are implemented.

## 7.7 Operational readiness acceptance

- Deployment, rollback, migration, backup/restore, Probe reconciliation, and incident response runbooks exist.
- Dashboards and alerts exist for failed ingestion, callback delay, database health, API errors, and outbox backlog.
- Ownership and escalation contacts are documented.
- Feature flags can disable Probe outbound requests and real frontend writes independently.
- A staging rehearsal and production smoke test are recorded.

## 7.8 Go-live sign-off

| Role | Sign-off responsibility |
| --- | --- |
| Product Manager | Product model, KPI definitions, management answers |
| Operation Manager | Workflow usability and first real closed loop |
| Backend Lead | Persistence, API, state machine, reliability |
| Frontend Lead | Real API migration and UI regression |
| Probe Owner | Execution/callback contract and ownership boundary |
| QA Lead | Test evidence, regression, data reconciliation |
| Security | Authentication, authorization, secrets, audit |

Release is blocked if any of these conditions is true:

- A Problem still requires an Incident.
- Probe execution logic has been copied into Operation Platform.
- Action completion can directly complete an Operation.
- A failed Verification creates an Outcome or resolves a Problem.
- Overview uses independent hard-coded business totals in production.
- Accepted integration events can be lost or duplicated.
- Production frontend still uses browser-local business state.

---

# Implementation Backlog Summary

| ID | Deliverable | Dependency | Done evidence |
| --- | --- | --- | --- |
| DB-01 | Reference and actor schema | None | Migration tests |
| DB-02 | Source Event and Signal schema | DB-01 | Idempotency test |
| DB-03 | Problem and relationship schema | DB-02 | Unreported Problem test |
| DB-04 | Operation and Action schema | DB-03 | FK/state constraint tests |
| DB-05 | Evidence, Verification, Outcome schema | DB-04 | Outcome integrity test |
| DB-06 | History, outbox, indexes, seed | DB-05 | Migration/rollback report |
| API-01 | API conventions, auth, errors | DB model | OpenAPI lint report |
| API-02 | Integration contracts | API-01 | Probe/Availability examples |
| API-03 | Domain query/command contracts | API-01 | Generated client compiles |
| API-04 | Overview and Command Center contracts | API-03 | Product sign-off |
| BE-01 | Backend foundation | DB/API | Health/auth test |
| BE-02 | Ingestion and adapters | BE-01 | Replay/idempotency report |
| BE-03 | Correlation and Problem | BE-02 | Candidate/Unreported tests |
| BE-04 | Operation and Action state machine | BE-03 | Transition test suite |
| BE-05 | Evidence, Verification, Outcome | BE-04 | PASS/FAIL integration tests |
| BE-06 | Overview, History, observability | BE-05 | Reconciliation/performance report |
| PRB-01 | Probe outbound client | API-02/BE-01 | Sandbox run ID |
| PRB-02 | Probe callback adapter | BE-02 | Signed callback stored |
| PRB-03 | Retry and reconciliation | PRB-01/02 | Timeout/replay test |
| FE-01 | API/auth/remote-state foundation | API-03 | Client tests |
| FE-02 | Read pages migrated | BE queries | UI API trace |
| FE-03 | Commands migrated | BE commands | E2E workflow tests |
| FE-04 | Refresh/error/accessibility | FE-02/03 | UX regression report |
| E2E-01 | Real abnormal Probe → Signal | Probe + FE/BE | Execution evidence |
| E2E-02 | Unreported Problem → Operation | E2E-01 | Linked entity IDs |
| E2E-03 | Failed Verification rehearsal | E2E-02 | No Outcome assertion |
| E2E-04 | Corrective Action → PASS → Outcome | E2E-03 | Transaction/reconciliation proof |
| ACC-01 | Final acceptance and sign-off | All | Signed release checklist |

# Final Definition of Done

The release is done when the recorded source event can be followed through every persisted object:

```text
Real Probe Event
→ Signal
→ Unreported Problem
→ Operation
→ Action
→ Probe / Release / Availability Evidence
→ Failed Verification
→ Corrective Action
→ Passed Verification
→ Verified Outcome
→ Resolved Problem
→ Completed Operation
→ Updated China Operation Overview
→ Append-only Closed-loop History
```

Every arrow must be demonstrable through both API responses and UI links, with database reconciliation and no manual status edits.
