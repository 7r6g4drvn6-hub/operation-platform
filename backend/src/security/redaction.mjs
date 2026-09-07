import crypto from "node:crypto";

const SENSITIVE_KEY_PATTERNS = [
  /authorization/i,
  /cookie/i,
  /password/i,
  /passcode/i,
  /secret/i,
  /token/i,
  /api[_-]?key/i,
  /private[_-]?key/i,
  /client[_-]?secret/i,
  /webhook[_-]?signature/i,
  /raw[_-]?payload/i
];

const PSEUDONYM_KEY_PATTERNS = [
  { pattern: /^(e[-_]?mail|emailAddress)$/i, prefix: "contact" },
  { pattern: /^(phone|phoneNumber|mobile)$/i, prefix: "phone" },
  { pattern: /^(vin|vehicleIdentificationNumber)$/i, prefix: "vehicle" },
  { pattern: /^(deviceId|deviceSerial|serialNumber)$/i, prefix: "device" },
  { pattern: /^(userId|customerId|accountId)$/i, prefix: "subject" }
];

const DEFAULT_ALLOWED_LOG_KEYS = new Set([
  "traceId", "source", "eventType", "service", "region", "environment",
  "signalType", "severity", "metric", "metricValue", "metricUnit",
  "status", "durationMs", "aggregateId", "result", "errorCode"
]);

function isSensitiveKey(key) {
  return SENSITIVE_KEY_PATTERNS.some((pattern) => pattern.test(key));
}

function pseudonymRule(key) {
  return PSEUDONYM_KEY_PATTERNS.find(({ pattern }) => pattern.test(key));
}

function digest(value, secret) {
  if (!secret || secret.length < 16) {
    throw new Error("Pseudonymization secret must be at least 16 characters.");
  }
  return crypto.createHmac("sha256", secret).update(String(value)).digest("hex").slice(0, 16);
}

function maskString(value) {
  const input = String(value);
  if (input.length <= 4) return "[REDACTED]";
  return `${input.slice(0, 2)}…${input.slice(-2)}`;
}

/**
 * Redacts an untrusted source payload before it is logged or stored as a
 * queryable payload. Sensitive credentials are removed; identity fields are
 * deterministically pseudonymized so correlation can still work.
 */
export function redactPayload(value, { pseudonymSecret, mode = "storage" } = {}) {
  if (Array.isArray(value)) return value.map((item) => redactPayload(item, { pseudonymSecret, mode }));
  if (!value || typeof value !== "object") return value;

  const output = {};
  for (const [key, child] of Object.entries(value)) {
    if (isSensitiveKey(key)) {
      output[key] = "[REDACTED]";
      continue;
    }
    const rule = pseudonymRule(key);
    if (rule && child !== null && child !== undefined) {
      if (mode === "log") {
        output[key] = `${rule.prefix}_${digest(child, pseudonymSecret)}`;
      } else {
        output[key] = `${rule.prefix}_${digest(child, pseudonymSecret)}`;
      }
      continue;
    }
    output[key] = redactPayload(child, { pseudonymSecret, mode });
  }
  return output;
}

/**
 * Produces a strict allow-list projection for structured application logs.
 * Unknown fields are omitted rather than heuristically inspected.
 */
export function safeLogContext(context = {}) {
  const output = {};
  for (const key of DEFAULT_ALLOWED_LOG_KEYS) {
    if (context[key] !== undefined) output[key] = context[key];
  }
  return output;
}

export function assertNoPlaintextSecrets(value) {
  const visit = (current, parentKey = "") => {
    if (Array.isArray(current)) {
      current.forEach((item) => visit(item, parentKey));
      return;
    }
    if (!current || typeof current !== "object") {
      if (isSensitiveKey(parentKey) && current !== null && current !== undefined && current !== "[REDACTED]") {
        throw new Error("Plaintext sensitive value detected.");
      }
      return;
    }
    for (const [key, child] of Object.entries(current)) {
      if (isSensitiveKey(key)) {
        if (child !== null && child !== undefined && child !== "[REDACTED]") {
          throw new Error("Plaintext sensitive value detected.");
        }
        continue;
      }
      visit(child, key);
    }
  };
  visit(value);
  return true;
}

export function redactError(error) {
  return {
    name: error?.name || "Error",
    message: maskString(error?.message || "Unexpected error"),
    code: error?.code || "INTERNAL_ERROR"
  };
}

export const securityPatterns = Object.freeze({
  sensitiveKeys: SENSITIVE_KEY_PATTERNS,
  pseudonymKeys: PSEUDONYM_KEY_PATTERNS
});
