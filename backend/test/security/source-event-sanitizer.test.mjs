import test from "node:test";
import assert from "node:assert/strict";
import { prepareSourceEvent } from "../../src/security/source-event-sanitizer.mjs";

const secret = "local-test-secret-please-change";

test("stores sanitized payload and never requires raw data", async () => {
  const event = await prepareSourceEvent({
    externalEventId: "probe-event-1",
    payload: { email: "person@example.com", authorization: "Bearer secret", failureRate: 12.8 }
  }, { pseudonymSecret: secret });
  assert.match(event.payload.email, /^contact_[0-9a-f]{16}$/);
  assert.equal(event.payload.authorization, "[REDACTED]");
  assert.equal(event.rawPayloadCiphertext, null);
  assert.equal(event.dataClassification, "L1_SANITIZED_OPERATIONAL_EVENT");
  assert.equal(event.payloadHash.length, 64);
  assert.equal("rawPayload" in event, false);
});

test("requires an encryption boundary for raw payload retention", async () => {
  await assert.rejects(
    prepareSourceEvent({ payload: { token: "secret" } }, { pseudonymSecret: secret, storeRaw: true }),
    /encryption function/
  );
});

test("raw retention returns ciphertext and key reference only", async () => {
  const event = await prepareSourceEvent({ payload: { issue: "timeout" } }, {
    pseudonymSecret: secret,
    storeRaw: true,
    encryptRawPayload: async () => ({ ciphertext: "ciphertext-bytes", keyRef: "kms://key/operation-events" })
  });
  assert.equal(event.rawPayloadCiphertext, "ciphertext-bytes");
  assert.equal(event.rawPayloadKeyRef, "kms://key/operation-events");
  assert.equal(event.dataClassification, "L4_ENCRYPTED_RAW_EVENT");
  assert.equal("rawPayload" in event, false);
});
