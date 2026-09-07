import test from "node:test";
import assert from "node:assert/strict";
import { assertNoPlaintextSecrets, redactPayload, safeLogContext } from "../../src/security/redaction.mjs";
import { projectForAI } from "../../src/security/ai-safe-projection.mjs";

const secret = "local-test-secret-please-change";

test("redacts credentials recursively and pseudonymizes identity fields", () => {
  const result = redactPayload({
    authorization: "Bearer production-token",
    customer: { email: "person@example.com", phoneNumber: "+86 138 0000 0000" },
    vehicle: { vin: "LSV123456789", deviceId: "device-42" },
    metrics: [{ name: "failure_rate", value: 12.8 }]
  }, { pseudonymSecret: secret });

  assert.equal(result.authorization, "[REDACTED]");
  assert.match(result.customer.email, /^contact_[0-9a-f]{16}$/);
  assert.match(result.customer.phoneNumber, /^phone_[0-9a-f]{16}$/);
  assert.match(result.vehicle.vin, /^vehicle_[0-9a-f]{16}$/);
  assert.match(result.vehicle.deviceId, /^device_[0-9a-f]{16}$/);
  assert.equal(result.metrics[0].value, 12.8);
  assert.doesNotMatch(JSON.stringify(result), /production-token|person@example.com|LSV123456789/);
});

test("the same identity is stable while raw value is not exposed", () => {
  const first = redactPayload({ userId: "customer-001" }, { pseudonymSecret: secret });
  const second = redactPayload({ userId: "customer-001" }, { pseudonymSecret: secret });
  assert.equal(first.userId, second.userId);
  assert.notEqual(first.userId, "customer-001");
});

test("redacts credentials inside nested arrays and rejects missing or weak pseudonym secrets", () => {
  const result = redactPayload({ batches: [{ token: "secret-token", headers: [{ cookie: "session" }] }] }, { pseudonymSecret: secret });
  assert.equal(result.batches[0].token, "[REDACTED]");
  assert.equal(result.batches[0].headers[0].cookie, "[REDACTED]");
  assert.throws(() => redactPayload({ email: "person@example.com" }), /Pseudonymization secret/);
  assert.throws(() => redactPayload({ email: "person@example.com" }, { pseudonymSecret: "short" }), /Pseudonymization secret/);
});

test("safeLogContext uses an allow-list", () => {
  const result = safeLogContext({ traceId: "t-1", service: "MIB3 Approval", password: "do-not-log", rawPayload: "no" });
  assert.deepEqual(result, { traceId: "t-1", service: "MIB3 Approval" });
});

test("AI projection excludes source payload and personal identifiers", () => {
  const result = projectForAI({
    displayId: "PRB-204",
    service: "MIB3 Approval",
    region: "CN",
    metricValue: 12.8,
    email: "person@example.com",
    rawPayload: { authorization: "secret" }
  });
  assert.deepEqual(result, {
    displayId: "PRB-204",
    service: "MIB3 Approval",
    region: "CN",
    metricValue: 12.8,
    dataClassification: "AI_SAFE_OPERATIONAL_SUMMARY",
    sourcePayloadIncluded: false
  });
  assert.equal("email" in result, false);
  assert.equal("rawPayload" in result, false);
});

test("plaintext scanner accepts sanitized values and rejects credential values", () => {
  assert.equal(assertNoPlaintextSecrets({ authorization: "[REDACTED]", nested: { token: "[REDACTED]" } }), true);
  assert.throws(() => assertNoPlaintextSecrets({ authorization: "Bearer production-token" }), /Plaintext sensitive value/);
});
