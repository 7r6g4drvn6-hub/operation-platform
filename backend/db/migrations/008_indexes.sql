CREATE INDEX signals_service_region_detected_idx ON signals(service_id, region_id, detected_at DESC);
CREATE INDEX signals_status_severity_detected_idx ON signals(status, severity, detected_at DESC);
CREATE INDEX source_events_processing_idx ON source_events(processing_status, received_at);
CREATE INDEX problems_region_status_risk_updated_idx ON problems(region_id, status, risk, updated_at DESC);
CREATE INDEX operations_problem_status_updated_idx ON operations(problem_id, status, updated_at DESC);
CREATE INDEX actions_operation_status_due_idx ON actions(operation_id, status, due_at);
CREATE INDEX evidence_problem_observed_idx ON evidence(problem_id, observed_at DESC);
CREATE INDEX evidence_operation_type_observed_idx ON evidence(operation_id, evidence_type, observed_at DESC);
CREATE INDEX verification_runs_operation_created_idx ON verification_runs(operation_id, created_at DESC);
CREATE INDEX history_events_problem_occurred_idx ON history_events(problem_id, occurred_at);
CREATE INDEX history_events_operation_occurred_idx ON history_events(operation_id, occurred_at);
CREATE INDEX outbox_pending_retry_idx ON outbox_events(status, next_attempt_at, created_at);

INSERT INTO schema_migrations(version) VALUES ('008_indexes')
ON CONFLICT (version) DO NOTHING;
