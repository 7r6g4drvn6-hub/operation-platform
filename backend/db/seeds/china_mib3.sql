-- Reference seed only. No fake completed Problem, Operation or Outcome is inserted.
INSERT INTO regions(code, name, timezone) VALUES ('CN', 'China', 'Asia/Shanghai') ON CONFLICT (code) DO NOTHING;
INSERT INTO environments(code, name) VALUES ('PRODUCTION', 'Production') ON CONFLICT (code) DO NOTHING;
INSERT INTO services(code, name) VALUES ('MIB3_APPROVAL', 'MIB3 Approval') ON CONFLICT (code) DO NOTHING;

INSERT INTO signal_sources(code, name, source_type) VALUES
  ('PROBE', 'Independent Probe', 'PROBE'),
  ('AVAILABILITY', 'Availability', 'AVAILABILITY'),
  ('INCIDENT', 'Backend Incident', 'INCIDENT'),
  ('RELEASE', 'Release / CR', 'RELEASE')
ON CONFLICT (code) DO NOTHING;

INSERT INTO actors(external_subject, display_name, actor_type) VALUES
  ('seed:operation-manager', 'Operation Manager', 'USER'),
  ('seed:backend-mib3', 'Backend MIB3', 'USER'),
  ('seed:probe-ops', 'Probe Ops', 'USER'),
  ('seed:product-manager', 'Product Manager', 'USER'),
  ('seed:management-readonly', 'Management Read Only', 'USER')
ON CONFLICT (external_subject) DO NOTHING;

INSERT INTO probe_refs(external_probe_id, display_name, service_id, region_id, environment_id, external_url)
SELECT 'MIB3_APPROVAL_DOWNLOAD_CN', 'Approval Download - China', s.id, r.id, e.id,
       'https://probe.example.invalid/runs'
FROM services s, regions r, environments e
WHERE s.code = 'MIB3_APPROVAL' AND r.code = 'CN' AND e.code = 'PRODUCTION'
ON CONFLICT (external_probe_id) DO NOTHING;
