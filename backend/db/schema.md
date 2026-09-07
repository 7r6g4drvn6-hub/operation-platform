# Operation Platform V1 Database Schema

PostgreSQL 16 is the source of truth for the first production release. The migration order is fixed:

```text
001 extensions
→ 002 reference tables
→ 003 source events and signals
→ 004 problems and links
→ 005 operations and actions
→ 006 probes, evidence, verification, outcomes
→ 007 history and outbox
→ 008 indexes
```

## Security boundary

- `source_events.payload` is the sanitized, queryable payload.
- `raw_payload_ciphertext` and `raw_payload_key_ref` are optional and must be populated together.
- Application code must encrypt raw payloads before insertion; SQL does not accept plaintext raw payload fields.
- Normal API DTOs never return raw ciphertext, key references or unsanitized payloads.
- `history_events` is append-only. Domain objects use lifecycle states instead of hard deletion.

## Integrity rules

1. A Problem may have zero Incidents and still be `unreported = true`.
2. Source event idempotency is enforced by `(source_id, external_event_id)` and `(source_id, idempotency_key)`.
3. A Probe remains external; `probe_refs` stores references only.
4. An Outcome is unique per Operation and Verification Run and requires a `PASSED` Verification Run.
5. `version` fields are used for optimistic locking on Signal, Problem, Operation and Action.
6. Link tables have composite primary keys to prevent duplicate relationships.
