# Operation Platform V1 Prototype

## Run locally

```bash
node server.js
```

Open `http://localhost:4174/`.

## GitHub Pages

The `main` branch is published through GitHub Pages at:

`https://7r6g4drvn6-hub.github.io/operation-platform/`

The hosted page is the static UI prototype and uses mock browser state. The local
`server.js` remains the development server; no production API or database is
included in this prototype.

## Progress report

- [Product progress report (PDF)](./docs/Operation_Platform_Product_Progress_Report.pdf)
- [Product progress report (Word)](./docs/Operation_Platform_Product_Progress_Report.docx)
- [Product progress report (Markdown)](./docs/Operation_Platform_Product_Progress_Report.md)
- [Execution backlog](./docs/Operation_Platform_Execution_Backlog.md)
- [Architecture and data flow diagrams](./docs/architecture/architecture.md)

This is a UI-first prototype for an evidence-driven Operation Platform. It uses local mock data and a browser-local shared State Layer. It has no production integrations, email ingestion, AI correlation, or server-side persistence.

## V1 domain model

```text
Signal --correlates_to--> Problem --drives--> Operation --contains--> Action
Incident --contributes_to--> Problem
Probe --generates--> Evidence --verifies--> Action / Operation
Availability --generates--> Evidence
CR / Release --generates--> Evidence
Operation --measures--> Outcome
Problem --may_escalate_to--> SBT Candidate --becomes--> SBT
```

### Ownership boundaries

| Object | Purpose | Key relationships |
| --- | --- | --- |
| Signal | Smallest indication that a potential issue may exist | source reference; correlated Problem |
| Incident | Confirmed or investigated technical issue | source Signal; related Problem |
| Problem | Pattern inferred from multiple signals and evidence | signals, incidents, evidence, operations |
| SBT | Systemic business/technical issue | linked Problem; configurable trigger rule |
| Operation | Time-bound effort to reduce a Problem or risk | problem, actions, KPI, verification, outcome |
| Action | Executable task within an Operation | owner, expected result, evidence |
| Probe | Independent evidence generator | result becomes Evidence; can be bound to an Operation |
| Evidence | Objective basis for existence, impact or effectiveness | source, related Problem, Action and Operation |
| Outcome | Measured conclusion after verification | before/after KPI and supporting Evidence |

## Information architecture

```text
Command Center
Problems
  - Problem List
  - Problem Detail
Operations
  - Operation List
  - Operation Detail
Evidence
  - Evidence List
  - Evidence Detail (prototype drawer)
Incidents (route placeholder in V1)
Probe (route placeholder in V1)
History
  - Closed-loop History
```

## State Layer

`prototype-state.js` is the single source of truth for the prototype. All pages consume the same local model and rerender when an action changes state.

```text
signals
incidents
problems
sbtCandidates
operations
actions
probes
probeResults
evidences
outcomes
historyEvents
```

The public State functions are:

```text
startInvestigation()
createProblem()
createOperation()
createAction()
createEvidence()
completeAction()
runProbe()
recordVerification()
recordOutcome()
reset()
```

## Demo Flow

The primary V1 scenario starts from an unreported problem, not an Incident:

```text
PRB-204 / China / MIB3 Approval / Approval Download

Initial evidence
  Probe failure: 12.8%
  Expected: < 1%
  Incident count: 0
  Availability: 96.1%
  Problem status: Detected / Unreported

Investigate
  -> PRB-204 becomes Investigating

Create Operation
  -> OP-102 Improve Approval Download Stability

Create Action
  -> ACT-001 Run regional Probe

Run Probe
  -> PR-001 and EVD-001

Deploy backend fix
  -> ACT-002 and EVD-002

Run verification Probe
  -> PR-002 and EVD-003

Record Verification (Passed)
  -> OUT-001 Objective Achieved
  -> OP-102 Completed
  -> PRB-204 Resolved
```

## Verification Rule

An Action being completed does not complete an Operation. An Outcome can only be recorded when an independent verification Probe passes the target:

```text
Action completed
  + Evidence
  + Verification Probe
  + Explicit passed decision
  = Outcome
```

When verification fails, the Operation remains `Verifying`; it does not generate an Outcome or resolve the Problem. The user can create a corrective Action, complete it, and run another independent verification Probe. The initial verification keeps the fixed `PR-002 / EVD-003` identifiers; later cycles use subsequent identifiers.

## History Rule

Closed-loop History is derived from the same State Layer, rather than maintained as a separate static page. The primary scenario records:

```text
Signal detected
Unreported Problem detected
Investigation started
Operation created
Action assigned
Probe executed
Problem Evidence created
Backend fix completed
Verification Probe executed
Outcome Evidence created
Verification Passed or Failed
Outcome Achieved (passed only)
Operation Completed (passed only)
Problem Resolved (passed only)
```

## V1.1 Signal Intelligence Architecture

V1.1 adds the Signal Intelligence Layer ahead of the existing closed loop. External China-region Probe, Incident, SMO Ticket, Availability, and Release events are received by source-specific integration adapters, normalized into a common Signal model, and correlated into a Problem Candidate.

`Signal` is the unified entry object. It is not an Incident, and a Problem can be created from correlated Signal and Evidence even when no Backend Incident exists. Probe remains an independent evidence generator; Operation consumes Probe Results as Evidence.

V1.1 also adds **China Operation Overview**, a business-facing aggregation of Health, Business Impact, Outcome, Trend, and Closed-loop performance. It is separate from Command Center: Overview answers how China operation is performing, while Command Center answers what needs attention now.

The API integration surface is represented as prototype contracts only:

```text
POST /api/integration/probe/result
POST /api/integration/incident
POST /api/integration/smo-ticket
POST /api/integration/availability
POST /api/integration/release
```

The detailed API architecture, China signal resolution flow, and Overview architecture are in [docs/architecture/architecture.md](./docs/architecture/architecture.md).

## Run

```bash
cd /Users/xuxuan/Documents/codex/operation-platform
node server.js
```

Open `http://localhost:4174`.
