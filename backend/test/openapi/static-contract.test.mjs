import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const spec = fs.readFileSync(path.join(root, "openapi/operation-platform-v1.yaml"), "utf8");

test("OpenAPI contract declares required domains and paths", () => {
  assert.match(spec, /^openapi: 3\.1\.0/m);
  for (const pathName of [
    "/integrations/probe/results:",
    "/problems/{problemId}:",
    "/problems/{problemId}/recommendation:",
    "/operations/{operationId}/probe-runs:",
    "/verification-runs/{verificationId}/decision:",
    "/overview/regions/{regionCode}:",
    "/command-center:"
  ]) assert.match(spec, new RegExp(`^  ${pathName.replace(/[{}]/g, "\\$&")}`, "m"));
});

test("OpenAPI contract excludes raw payload fields from public schemas", () => {
  // The YAML block scalar intentionally wraps this sentence across lines.
  assert.match(spec, /Raw source payloads and\s+credentials are never returned/);
  assert.doesNotMatch(spec, /rawPayloadCiphertext|rawPayloadKeyRef/);
  assert.match(spec, /sourcePayloadIncluded:\s*\{type:\s*boolean\b/);
  assert.match(spec, /Problem may exist without an Incident|without requiring an Incident/);
});

test("OpenAPI examples cover unsolicited Probe, verification PASS and FAIL", () => {
  const examples = fs.readdirSync(path.join(root, "openapi/examples"));
  assert.ok(examples.includes("probe-result-detection.json"));
  assert.ok(examples.includes("verification-decision-pass.json"));
  assert.ok(examples.includes("verification-decision-fail.json"));
  assert.ok(examples.includes("problem-detail-unreported.json"));
  assert.ok(examples.includes("command-center-cn.json"));
  assert.ok(examples.includes("outcome-detail.json"));
  assert.ok(examples.includes("optimistic-lock-conflict.json"));
});
