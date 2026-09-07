import crypto from "node:crypto";
import { redactPayload } from "./redaction.mjs";

function canonicalize(value) {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonicalize(value[key])]));
}

function hashPayload(value) {
  return crypto.createHash("sha256").update(JSON.stringify(canonicalize(value))).digest("hex");
}

/**
 * Normalizes an inbound source event. The returned payload is safe for normal
 * querying. Raw data is only accepted when the caller supplies an application
 * encryption function; this module never stores or returns plaintext raw data.
 */
export async function prepareSourceEvent(input, {
  pseudonymSecret,
  storeRaw = false,
  encryptRawPayload
} = {}) {
  const { payload } = input;
  if (storeRaw && typeof encryptRawPayload !== "function") {
    throw new Error("Raw payload storage requires an application encryption function.");
  }
  const sanitizedPayload = redactPayload(payload, { pseudonymSecret, mode: "storage" });
  const result = {
    ...input,
    payload: sanitizedPayload,
    payloadHash: hashPayload(payload),
    rawPayloadCiphertext: null,
    rawPayloadKeyRef: null,
    dataClassification: "L1_SANITIZED_OPERATIONAL_EVENT"
  };
  delete result.rawPayload;
  if (storeRaw) {
    const encrypted = await encryptRawPayload(payload);
    if (!encrypted?.ciphertext || !encrypted?.keyRef) {
      throw new Error("Encryption function must return ciphertext and keyRef.");
    }
    result.rawPayloadCiphertext = encrypted.ciphertext;
    result.rawPayloadKeyRef = encrypted.keyRef;
    result.dataClassification = "L4_ENCRYPTED_RAW_EVENT";
  }
  return result;
}

export { canonicalize, hashPayload };
