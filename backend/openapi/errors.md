# API Errors

Every error uses the same envelope and must include a trace ID. Error messages
must not echo request bodies, credentials, raw source payloads or personal data.

```json
{
  "error": {
    "code": "INVALID_STATE_TRANSITION",
    "message": "Operation must be VERIFYING before a verification decision.",
    "details": {},
    "traceId": "tr_01J..."
  }
}
```

Required codes include `BAD_REQUEST`, `VALIDATION_ERROR`, `UNAUTHORIZED`,
`FORBIDDEN`, `NOT_FOUND`, `IDEMPOTENCY_CONFLICT`, `INVALID_STATE_TRANSITION`,
`VERSION_CONFLICT`, `UNIT_MISMATCH`, `KPI_REQUIRED`, `EVIDENCE_REQUIRED`, and
`PROBE_MAPPING_UNKNOWN`.
