CREATE TABLE probe_refs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  external_probe_id VARCHAR(255) NOT NULL UNIQUE,
  display_name VARCHAR(240) NOT NULL,
  service_id UUID NOT NULL REFERENCES services(id) ON DELETE RESTRICT,
  region_id UUID NOT NULL REFERENCES regions(id) ON DELETE RESTRICT,
  environment_id UUID NOT NULL REFERENCES environments(id) ON DELETE RESTRICT,
  external_url TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE probe_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  display_id VARCHAR(32) NOT NULL UNIQUE,
  probe_ref_id UUID NOT NULL REFERENCES probe_refs(id) ON DELETE RESTRICT,
  operation_id UUID REFERENCES operations(id) ON DELETE RESTRICT,
  action_id UUID REFERENCES actions(id) ON DELETE RESTRICT,
  verification_run_id UUID,
  client_request_id UUID NOT NULL UNIQUE,
  external_run_id VARCHAR(255) UNIQUE,
  purpose VARCHAR(32) NOT NULL CHECK (purpose IN ('DETECTION', 'DIAGNOSTIC', 'VERIFICATION')),
  status VARCHAR(32) NOT NULL DEFAULT 'REQUESTED' CHECK (status IN ('REQUESTED', 'RUNNING', 'COMPLETED', 'FAILED', 'QUARANTINED')),
  requested_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  finished_at TIMESTAMPTZ,
  result_url TEXT,
  source_event_id UUID REFERENCES source_events(id) ON DELETE RESTRICT
);

CREATE TABLE evidence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  display_id VARCHAR(32) NOT NULL UNIQUE,
  evidence_type VARCHAR(32) NOT NULL CHECK (evidence_type IN ('PROBLEM', 'ACTION', 'OUTCOME')),
  source_type VARCHAR(32) NOT NULL CHECK (source_type IN ('PROBE', 'AVAILABILITY', 'INCIDENT', 'RELEASE', 'MONITORING')),
  source_ref VARCHAR(255) NOT NULL,
  problem_id UUID NOT NULL REFERENCES problems(id) ON DELETE RESTRICT,
  operation_id UUID REFERENCES operations(id) ON DELETE RESTRICT,
  action_id UUID REFERENCES actions(id) ON DELETE RESTRICT,
  service_id UUID NOT NULL REFERENCES services(id) ON DELETE RESTRICT,
  region_id UUID NOT NULL REFERENCES regions(id) ON DELETE RESTRICT,
  observed_at TIMESTAMPTZ NOT NULL,
  metric_name VARCHAR(120) NOT NULL,
  expected_value NUMERIC,
  actual_value NUMERIC,
  unit VARCHAR(32),
  status VARCHAR(32) NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (source_type, source_ref, evidence_type)
);

CREATE TABLE verification_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  display_id VARCHAR(32) NOT NULL UNIQUE,
  operation_id UUID NOT NULL REFERENCES operations(id) ON DELETE RESTRICT,
  probe_run_id UUID REFERENCES probe_runs(id) ON DELETE RESTRICT,
  status VARCHAR(32) NOT NULL DEFAULT 'REQUESTED' CHECK (status IN ('REQUESTED', 'RUNNING', 'PENDING_REVIEW', 'PASSED', 'FAILED')),
  target_snapshot JSONB NOT NULL,
  actual_snapshot JSONB,
  decision_reason TEXT,
  decided_by UUID REFERENCES actors(id) ON DELETE RESTRICT,
  decided_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE probe_runs ADD CONSTRAINT probe_runs_verification_fk
  FOREIGN KEY (verification_run_id) REFERENCES verification_runs(id) ON DELETE RESTRICT;

CREATE TABLE outcomes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  display_id VARCHAR(32) NOT NULL UNIQUE,
  operation_id UUID NOT NULL UNIQUE REFERENCES operations(id) ON DELETE RESTRICT,
  problem_id UUID NOT NULL REFERENCES problems(id) ON DELETE RESTRICT,
  verification_run_id UUID NOT NULL UNIQUE REFERENCES verification_runs(id) ON DELETE RESTRICT,
  status VARCHAR(32) NOT NULL DEFAULT 'VERIFIED' CHECK (status = 'VERIFIED'),
  expected_snapshot JSONB NOT NULL,
  before_metric JSONB NOT NULL,
  after_metric JSONB NOT NULL,
  impact JSONB NOT NULL,
  conclusion TEXT NOT NULL,
  verified_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE OR REPLACE FUNCTION validate_outcome_verification()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE verification_status VARCHAR(32);
BEGIN
  SELECT status INTO verification_status FROM verification_runs WHERE id = NEW.verification_run_id;
  IF verification_status IS DISTINCT FROM 'PASSED' THEN
    RAISE EXCEPTION 'Outcome requires a PASSED verification run';
  END IF;
  RETURN NEW;
END;
$$;

CREATE CONSTRAINT TRIGGER outcomes_require_passed_verification
AFTER INSERT OR UPDATE ON outcomes
DEFERRABLE INITIALLY DEFERRED
FOR EACH ROW EXECUTE FUNCTION validate_outcome_verification();

INSERT INTO schema_migrations(version) VALUES ('006_probe_evidence_verification')
ON CONFLICT (version) DO NOTHING;
