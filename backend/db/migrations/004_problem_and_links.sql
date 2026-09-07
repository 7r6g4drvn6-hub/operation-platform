CREATE TABLE incidents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  display_id VARCHAR(32) NOT NULL UNIQUE,
  external_incident_id VARCHAR(255) NOT NULL,
  source_event_id UUID REFERENCES source_events(id) ON DELETE RESTRICT,
  title VARCHAR(240) NOT NULL,
  description TEXT,
  priority VARCHAR(16) NOT NULL CHECK (priority IN ('P1', 'P2', 'P3', 'P4')),
  status VARCHAR(32) NOT NULL,
  owner_actor_id UUID REFERENCES actors(id) ON DELETE RESTRICT,
  service_id UUID NOT NULL REFERENCES services(id) ON DELETE RESTRICT,
  region_id UUID NOT NULL REFERENCES regions(id) ON DELETE RESTRICT,
  created_at_source TIMESTAMPTZ NOT NULL,
  resolved_at_source TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (external_incident_id)
);

CREATE TABLE problems (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  display_id VARCHAR(32) NOT NULL UNIQUE,
  title VARCHAR(240) NOT NULL,
  description TEXT NOT NULL,
  service_id UUID NOT NULL REFERENCES services(id) ON DELETE RESTRICT,
  region_id UUID NOT NULL REFERENCES regions(id) ON DELETE RESTRICT,
  issue_family VARCHAR(120) NOT NULL,
  risk VARCHAR(16) NOT NULL CHECK (risk IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
  impact_summary TEXT,
  status VARCHAR(32) NOT NULL DEFAULT 'DETECTED' CHECK (status IN ('DETECTED', 'INVESTIGATING', 'ACTIVE', 'VERIFYING', 'RESOLVED', 'CLOSED')),
  owner_actor_id UUID REFERENCES actors(id) ON DELETE RESTRICT,
  first_detected_at TIMESTAMPTZ NOT NULL,
  last_detected_at TIMESTAMPTZ NOT NULL,
  unreported BOOLEAN NOT NULL DEFAULT true,
  version INTEGER NOT NULL DEFAULT 1 CHECK (version > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE problem_signals (
  problem_id UUID NOT NULL REFERENCES problems(id) ON DELETE RESTRICT,
  signal_id UUID NOT NULL REFERENCES signals(id) ON DELETE RESTRICT,
  relation_type VARCHAR(32) NOT NULL CHECK (relation_type IN ('PRIMARY', 'SUPPORTING', 'CORRELATED')),
  correlation_score NUMERIC(5, 2) CHECK (correlation_score IS NULL OR (correlation_score >= 0 AND correlation_score <= 100)),
  linked_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  linked_by UUID REFERENCES actors(id) ON DELETE RESTRICT,
  PRIMARY KEY (problem_id, signal_id)
);

CREATE TABLE problem_incidents (
  problem_id UUID NOT NULL REFERENCES problems(id) ON DELETE RESTRICT,
  incident_id UUID NOT NULL REFERENCES incidents(id) ON DELETE RESTRICT,
  linked_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  linked_by UUID REFERENCES actors(id) ON DELETE RESTRICT,
  PRIMARY KEY (problem_id, incident_id)
);

CREATE TRIGGER problems_updated_at BEFORE UPDATE ON problems
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

INSERT INTO schema_migrations(version) VALUES ('004_problem_and_links')
ON CONFLICT (version) DO NOTHING;
