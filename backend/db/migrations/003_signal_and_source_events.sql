CREATE TABLE source_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id UUID NOT NULL REFERENCES signal_sources(id) ON DELETE RESTRICT,
  external_event_id VARCHAR(255) NOT NULL,
  idempotency_key VARCHAR(255) NOT NULL,
  event_type VARCHAR(120) NOT NULL,
  occurred_at TIMESTAMPTZ NOT NULL,
  received_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  payload JSONB NOT NULL,
  payload_hash CHAR(64) NOT NULL,
  raw_payload_ciphertext BYTEA,
  raw_payload_key_ref VARCHAR(255),
  data_classification VARCHAR(64) NOT NULL DEFAULT 'L1_SANITIZED_OPERATIONAL_EVENT',
  processing_status VARCHAR(32) NOT NULL DEFAULT 'RECEIVED' CHECK (processing_status IN ('RECEIVED', 'PROCESSED', 'QUARANTINED', 'FAILED')),
  processing_error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT source_events_raw_pair CHECK ((raw_payload_ciphertext IS NULL) = (raw_payload_key_ref IS NULL)),
  UNIQUE (source_id, external_event_id),
  UNIQUE (source_id, idempotency_key)
);

CREATE TABLE signals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  display_id VARCHAR(32) NOT NULL UNIQUE,
  source_event_id UUID REFERENCES source_events(id) ON DELETE RESTRICT,
  source_id UUID NOT NULL REFERENCES signal_sources(id) ON DELETE RESTRICT,
  signal_type VARCHAR(80) NOT NULL,
  service_id UUID NOT NULL REFERENCES services(id) ON DELETE RESTRICT,
  region_id UUID NOT NULL REFERENCES regions(id) ON DELETE RESTRICT,
  environment_id UUID NOT NULL REFERENCES environments(id) ON DELETE RESTRICT,
  severity VARCHAR(16) NOT NULL CHECK (severity IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
  status VARCHAR(32) NOT NULL DEFAULT 'DETECTED' CHECK (status IN ('DETECTED', 'ANALYZING', 'CORRELATED', 'PROBLEM_CREATED', 'ARCHIVED', 'DISMISSED')),
  metric_name VARCHAR(120) NOT NULL,
  metric_value NUMERIC NOT NULL,
  metric_threshold NUMERIC,
  metric_unit VARCHAR(32),
  users_affected INTEGER NOT NULL DEFAULT 0 CHECK (users_affected >= 0),
  business_impact VARCHAR(32),
  description TEXT NOT NULL,
  detected_at TIMESTAMPTZ NOT NULL,
  correlation_score NUMERIC(5, 2) CHECK (correlation_score IS NULL OR (correlation_score >= 0 AND correlation_score <= 100)),
  version INTEGER NOT NULL DEFAULT 1 CHECK (version > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER signals_updated_at BEFORE UPDATE ON signals
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

INSERT INTO schema_migrations(version) VALUES ('003_signal_and_source_events')
ON CONFLICT (version) DO NOTHING;
