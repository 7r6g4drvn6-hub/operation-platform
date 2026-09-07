CREATE TABLE operations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  display_id VARCHAR(32) NOT NULL UNIQUE,
  problem_id UUID NOT NULL REFERENCES problems(id) ON DELETE RESTRICT,
  title VARCHAR(240) NOT NULL,
  objective TEXT NOT NULL,
  trigger_summary TEXT NOT NULL,
  scope JSONB NOT NULL DEFAULT '{}',
  priority VARCHAR(16) NOT NULL CHECK (priority IN ('P1', 'P2', 'P3', 'P4')),
  risk VARCHAR(16) CHECK (risk IS NULL OR risk IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
  owner_actor_id UUID NOT NULL REFERENCES actors(id) ON DELETE RESTRICT,
  expected_outcome TEXT NOT NULL,
  kpi_definition JSONB NOT NULL,
  evidence_requirement JSONB NOT NULL,
  start_at TIMESTAMPTZ,
  target_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  status VARCHAR(32) NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'PLANNED', 'IN_PROGRESS', 'BLOCKED', 'VERIFYING', 'COMPLETED', 'CANCELLED')),
  verification_status VARCHAR(32) NOT NULL DEFAULT 'NOT_STARTED' CHECK (verification_status IN ('NOT_STARTED', 'REQUESTED', 'PENDING_REVIEW', 'PASSED', 'FAILED')),
  version INTEGER NOT NULL DEFAULT 1 CHECK (version > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE operation_stakeholders (
  operation_id UUID NOT NULL REFERENCES operations(id) ON DELETE RESTRICT,
  actor_id UUID NOT NULL REFERENCES actors(id) ON DELETE RESTRICT,
  role VARCHAR(80) NOT NULL,
  PRIMARY KEY (operation_id, actor_id, role)
);

CREATE TABLE actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  display_id VARCHAR(32) NOT NULL UNIQUE,
  operation_id UUID NOT NULL REFERENCES operations(id) ON DELETE RESTRICT,
  title VARCHAR(240) NOT NULL,
  description TEXT NOT NULL,
  action_type VARCHAR(64) NOT NULL,
  owner_actor_id UUID NOT NULL REFERENCES actors(id) ON DELETE RESTRICT,
  priority VARCHAR(16) NOT NULL CHECK (priority IN ('P1', 'P2', 'P3', 'P4')),
  status VARCHAR(32) NOT NULL DEFAULT 'PLANNED' CHECK (status IN ('PLANNED', 'IN_PROGRESS', 'BLOCKED', 'COMPLETED', 'CANCELLED')),
  due_at TIMESTAMPTZ,
  expected_result TEXT NOT NULL,
  actual_result TEXT,
  completed_at TIMESTAMPTZ,
  version INTEGER NOT NULL DEFAULT 1 CHECK (version > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER operations_updated_at BEFORE UPDATE ON operations
FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER actions_updated_at BEFORE UPDATE ON actions
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

INSERT INTO schema_migrations(version) VALUES ('005_operation_action')
ON CONFLICT (version) DO NOTHING;
