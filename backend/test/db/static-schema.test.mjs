import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const migrationDir = path.join(root, "db/migrations");

test("database migrations exist in the required order", () => {
  const files = fs.readdirSync(migrationDir).filter((name) => name.endsWith(".sql")).sort();
  assert.deepEqual(files, [
    "001_extensions.sql",
    "002_reference_tables.sql",
    "003_signal_and_source_events.sql",
    "004_problem_and_links.sql",
    "005_operation_action.sql",
    "006_probe_evidence_verification.sql",
    "007_outcome_history_outbox.sql",
    "008_indexes.sql"
  ]);
});

test("schema includes security and closed-loop integrity constraints", () => {
  const sql = fs.readFileSync(path.join(migrationDir, "003_signal_and_source_events.sql"), "utf8");
  const outcome = fs.readFileSync(path.join(migrationDir, "006_probe_evidence_verification.sql"), "utf8");
  const problem = fs.readFileSync(path.join(migrationDir, "004_problem_and_links.sql"), "utf8");
  assert.match(sql, /raw_payload_ciphertext BYTEA/);
  assert.match(sql, /raw_payload_key_ref VARCHAR/);
  assert.match(sql, /UNIQUE \(source_id, external_event_id\)/);
  assert.match(sql, /UNIQUE \(source_id, idempotency_key\)/);
  assert.match(problem, /unreported BOOLEAN NOT NULL DEFAULT true/);
  assert.match(outcome, /Outcome requires a PASSED verification run/);
});

test("seed does not create a fake completed outcome", () => {
  const seed = fs.readFileSync(path.join(root, "db/seeds/china_mib3.sql"), "utf8");
  assert.doesNotMatch(seed, /INSERT INTO outcomes/i);
  assert.match(seed, /MIB3_APPROVAL_DOWNLOAD_CN/);
});
