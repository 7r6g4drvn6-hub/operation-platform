# API Authentication

## User APIs

User-facing queries and commands require an OIDC bearer token. The API maps the
token subject to an `actors` row and enforces role permissions. Only authorized
reviewers may record Verification PASS/FAIL decisions or cancel an Operation.

## Integration APIs

Probe, Availability and Incident integrations use source-scoped OAuth2 client
credentials. A signed webhook is allowed for Probe only when OAuth2 is not
supported. Credentials are stored in a Secret Manager, rotated independently,
and never logged or committed to the repository.

## Data boundary

Integration responses expose IDs, processing status and sanitized domain data.
They never expose raw credentials, raw payloads, ciphertext, encryption key
references or unmasked personal identifiers.
