(function () {
  const STORAGE_KEY = "operation-platform-v1-demo-v7";

  const initialState = {
    signals: [
      { id: "SIG-HIST-101", source: "Probe", type: "Availability Degradation", problemId: "PRB-201", service: "MIB3 Approval", region: "China", environment: "Production", severity: "Critical", status: "Archived", metric: { name: "failure_rate", value: 12.8, threshold: 1, unit: "%" }, impact: { userAffected: 12450, businessImpact: "High" }, timestamp: "2026-08-26 09:18", relatedObjects: ["PR-101"], correlationScore: 94, description: "Historical approval download degradation resolved through OP-101." },
      { id: "SIG-0001", source: "Probe", type: "Availability Degradation", problemId: null, service: "MIB3 Approval", region: "China", environment: "Production", severity: "Critical", status: "Detected", metric: { name: "failure_rate", value: 12.8, threshold: 1, unit: "%" }, impact: { userAffected: 2000, businessImpact: "High" }, timestamp: "2026-09-03 10:00", relatedObjects: ["PR-001"], correlationScore: 87, description: "Approval Download failure rate is above the operating threshold." },
      { id: "SIG-0002", source: "Availability", type: "Availability Degradation", problemId: null, service: "MIB3 Approval", region: "China", environment: "Production", severity: "High", status: "Detected", metric: { name: "availability", value: 96.1, threshold: 99.7, unit: "%" }, impact: { userAffected: 2000, businessImpact: "High" }, timestamp: "2026-09-03 10:02", relatedObjects: ["AVL-CN-001"], correlationScore: 82, description: "Availability dropped below the China service target." },
      { id: "SIG-0003", source: "Incident", type: "Backend Failure", problemId: null, service: "MIB3 Approval", region: "China", environment: "Production", severity: "High", status: "Detected", metric: { name: "http_500_rate", value: 8.2, threshold: 1, unit: "%" }, impact: { userAffected: 1800, businessImpact: "High" }, timestamp: "2026-09-03 10:04", relatedObjects: ["INC-CN-401"], correlationScore: 79, description: "HTTP 500 responses are concentrated in the approval download journey." },
      { id: "SIG-0004", source: "Release", type: "Release Risk", problemId: null, service: "MIB3 Approval", region: "China", environment: "Production", severity: "Medium", status: "Detected", metric: { name: "deployment", value: 1, threshold: 0, unit: "event" }, impact: { userAffected: 0, businessImpact: "Medium" }, timestamp: "2026-09-03 09:00", relatedObjects: ["REL-CN-001"], correlationScore: 71, description: "A release was deployed shortly before the degradation started." },
      { id: "SIG-0005", source: "SMO", type: "Customer Impact", problemId: null, service: "MIB3 Approval", region: "China", environment: "Production", severity: "High", status: "Detected", metric: { name: "customer_tickets", value: 34, threshold: 10, unit: "tickets" }, impact: { userAffected: 2000, businessImpact: "High" }, timestamp: "2026-09-03 10:06", relatedObjects: ["SMO-CN-9981"], correlationScore: 76, description: "SMO reports a cluster of customer approval-download complaints." },
      { id: "SIG-0006", source: "Availability", type: "Availability Degradation", problemId: "PRB-207", service: "Vehicle Registration", region: "China", environment: "Production", severity: "Medium", status: "Analyzing", metric: { name: "availability", value: 98.9, threshold: 99.7, unit: "%" }, impact: { userAffected: 310, businessImpact: "Medium" }, timestamp: "2026-09-03 11:10", relatedObjects: ["AVL-CN-007"], correlationScore: 68, description: "Vehicle Registration availability is below its China operating target." }
    ],
    signalSources: ["Probe", "SMO", "Incident", "Availability", "Release"],
    signalTypes: ["Availability Degradation", "Backend Failure", "Customer Impact", "Performance Degradation", "Release Risk", "Downtime"],
    correlationRules: [
      { id: "COR-001", name: "Shared service, region, and time window", description: "Same service + same region + within 24 hours", confidence: 87 },
      { id: "COR-002", name: "Probe plus availability degradation", description: "Probe Failure + Availability Degradation", confidence: 92 },
      { id: "COR-003", name: "Incident volume threshold", description: "Same service + 10 Incidents", confidence: 95 }
    ],
    incidents: [
      { id: "INC-CN-401", title: "Approval HTTP 500 spike", problemId: null, priority: "P1", status: "Open", owner: "Backend MIB3", created: "2026-09-03 10:04" },
      { id: "INC-401", title: "Telemetry consumer lag", problemId: "PRB-205", priority: "P2", status: "Monitoring", owner: "Telemetry", created: "2026-09-01 16:48" },
      { id: "INC-402", title: "Battery event processing backlog", problemId: "PRB-205", priority: "P2", status: "Open", owner: "Telemetry", created: "2026-09-01 17:05" },
      { id: "INC-403", title: "EU consumer pod saturation", problemId: "PRB-205", priority: "P2", status: "Mitigating", owner: "Platform", created: "2026-09-01 17:10" },
      { id: "INC-404", title: "Webhook delivery delay", problemId: "PRB-205", priority: "P3", status: "Monitoring", owner: "Telemetry", created: "2026-09-01 17:32" },
      { id: "INC-405", title: "Telemetry retry pressure", problemId: "PRB-205", priority: "P3", status: "Open", owner: "Platform", created: "2026-09-01 18:03" },
      { id: "INC-406", title: "Battery state event latency", problemId: "PRB-205", priority: "P2", status: "Investigating", owner: "Telemetry", created: "2026-09-01 18:25" },
      { id: "INC-407", title: "Event processor dead letter increase", problemId: "PRB-205", priority: "P3", status: "Open", owner: "Telemetry", created: "2026-09-01 19:18" },
      { id: "INC-408", title: "Registration token expires early", problemId: "PRB-206", priority: "P2", status: "Investigating", owner: "Identity", created: "2026-09-01 20:14" },
      { id: "INC-409", title: "France identity session mismatch", problemId: "PRB-206", priority: "P2", status: "Open", owner: "Identity", created: "2026-09-01 20:42" },
      { id: "INC-410", title: "Registration retry loop", problemId: "PRB-206", priority: "P3", status: "Monitoring", owner: "ODP", created: "2026-09-01 21:05" }
    ],
    problems: [
      { id: "PRB-201", title: "Approval Download Instability", service: "MIB3 Approval", region: "China", category: "Download / Timeout", risk: "Critical", status: "Resolved", impact: "12,450 users recovered", firstDetected: "2026-08-26 09:18", updatedAt: "2026-08-27 16:42", owner: "Lena Zhou", description: "A historical approval download degradation resolved after timeout optimization and independent verification.", signalIds: ["SIG-HIST-101"], operationIds: ["OP-101"], sbtRisk: "Closed", unreported: false },
      { id: "PRB-204", title: "Approval Download Instability", service: "MIB3 Approval", region: "China", category: "Download / HTTP 500", risk: "Critical", status: "Detected", impact: "2,000 users affected", firstDetected: "2026-09-03 10:00", updatedAt: "2026-09-03 10:06", owner: "Unassigned", description: "Probe and availability signals detected abnormal approval-download behavior before a Backend Incident was correlated.", signalIds: ["SIG-0001", "SIG-0002", "SIG-0003", "SIG-0004", "SIG-0005"], operationIds: [], sbtRisk: "Monitor", unreported: true, candidate: true },
      { id: "PRB-205", title: "Battery Health Event Delay", service: "Vehicle Telemetry", region: "Europe", category: "Event processing", risk: "High", status: "Verifying", impact: "680 vehicles delayed", firstDetected: "2026-09-01 16:40", updatedAt: "2026-09-02 09:25", owner: "Jon Bell", description: "Battery health events arrive after the two-minute delivery target during peak demand.", signalIds: [], operationIds: ["OPR-881"], sbtRisk: "Watch", unreported: false },
      { id: "PRB-206", title: "Registration Journey Blocks", service: "ODP Registration", region: "France", category: "Identity / Session", risk: "High", status: "Investigating", impact: "420 registration attempts", firstDetected: "2026-09-01 20:05", updatedAt: "2026-09-02 09:10", owner: "Elena Rossi", description: "Registration sessions expire before identity confirmation completes.", signalIds: [], operationIds: ["OPR-882"], sbtRisk: "Monitor", unreported: false },
      { id: "PRB-207", title: "China Registration Availability Degradation", service: "Vehicle Registration", region: "China", category: "Availability", risk: "Warning", status: "Monitoring", impact: "310 registration journeys at risk", firstDetected: "2026-09-03 11:10", updatedAt: "2026-09-03 11:20", owner: "Wei Chen", description: "China Vehicle Registration availability is below target and requires active observation.", signalIds: ["SIG-0006"], operationIds: ["OP-103"], sbtRisk: "Watch", unreported: false }
    ],
    sbtCandidates: [],
    operations: [
      { id: "OP-101", title: "Recover Approval Download Stability", problemId: "PRB-201", objective: "Restore China approval download availability and reduce failures below 1%.", trigger: "Probe failure reached 12.8%", priority: "P1", owner: "Lena Zhou", stakeholders: ["Backend MIB3", "Probe Ops", "Product China"], expectedOutcome: "Failure Rate < 1%; Availability > 99.7%", kpi: "Approval Download Failure Rate", evidenceRequirement: "Post-fix Probe Result and Availability", createdAt: "2026-08-26 09:45", startTime: "2026-08-26 10:00", targetTime: "2026-08-27 18:00", completedTime: "2026-08-27 16:42", status: "Completed", verificationStatus: "Passed", verification: { expected: "< 1%", actual: "0.4%", availability: "99.8%", probeResultId: "PR-101", status: "Passed" }, actionIds: ["ACT-101"], outcomeIds: ["OUT-001"] },
      { id: "OPR-881", title: "Recover Battery Health Delivery Latency", problemId: "PRB-205", objective: "Bring 95% of battery health events under the two-minute delivery target.", trigger: "p95 delivery latency exceeded 5 minutes", priority: "P2", owner: "Jon Bell", stakeholders: ["Telemetry", "Platform"], expectedOutcome: "p95 delivery latency < 2 minutes", kpi: "p95 delivery latency", evidenceRequirement: "Peak-period latency evidence", createdAt: "2026-09-01 17:00", startTime: "2026-09-01 17:10", targetTime: "2026-09-03 12:00", status: "Verifying", verificationStatus: "Pending", actionIds: ["ACT-105", "ACT-106"], outcomeIds: [] },
      { id: "OPR-882", title: "Stabilize France Registration Sessions", problemId: "PRB-206", objective: "Reduce registration session-expiry failures below 1%.", trigger: "Repeated identity session incidents", priority: "P2", owner: "Elena Rossi", stakeholders: ["Identity", "ODP"], expectedOutcome: "Registration failure < 1%", kpi: "Registration journey failure", evidenceRequirement: "Regional Probe result", createdAt: "2026-09-01 21:00", startTime: "2026-09-01 21:15", targetTime: "2026-09-03 15:00", status: "In Progress", verificationStatus: "Not Started", actionIds: ["ACT-108"], outcomeIds: [] },
      { id: "OP-103", title: "Protect China Registration Availability", problemId: "PRB-207", objective: "Return Vehicle Registration availability above 99.7% without customer journey regression.", trigger: "Availability degraded to 98.9%", priority: "P2", owner: "Wei Chen", stakeholders: ["Registration Backend", "Probe Ops"], expectedOutcome: "Availability > 99.7%", kpi: "Vehicle Registration Availability", evidenceRequirement: "Availability and regional Probe evidence", createdAt: "2026-09-03 11:20", startTime: "2026-09-03 11:25", targetTime: "2026-09-04 16:00", status: "In Progress", verificationStatus: "Not Started", actionIds: ["ACT-103"], outcomeIds: [] }
    ],
    actions: [
      { id: "ACT-101", operationId: "OP-101", name: "Backend timeout optimization", owner: "Backend MIB3", status: "Completed", dueDate: "2026-08-27 14:00", description: "Optimize approval download timeout handling and deploy the verified fix.", expectedResult: "Failure rate below 1%", evidenceIds: ["EVD-HIST-101"], completedTime: "2026-08-27 14:16" },
      { id: "ACT-105", operationId: "OPR-881", name: "Scale EU consumer group", owner: "Platform", status: "Completed", dueDate: "2026-09-02 08:00", description: "Increase processing capacity during peak demand.", expectedResult: "Reduce event backlog", evidenceIds: ["EVD-305"], completedTime: "2026-09-02 08:08" },
      { id: "ACT-106", operationId: "OPR-881", name: "Monitor peak period", owner: "Jon Bell", status: "In Progress", dueDate: "2026-09-03 11:00", description: "Confirm latency remains stable through peak demand.", expectedResult: "Sustain p95 below two minutes", evidenceIds: [], completedTime: null },
      { id: "ACT-108", operationId: "OPR-882", name: "Review identity release changes", owner: "Identity Backend", status: "In Progress", dueDate: "2026-09-03 13:00", description: "Identify the release correlated with session expiry.", expectedResult: "Find release correlation", evidenceIds: [], completedTime: null },
      { id: "ACT-103", operationId: "OP-103", name: "Review registration dependency latency", owner: "Registration Backend", status: "In Progress", dueDate: "2026-09-04 10:00", description: "Identify the dependency causing the China availability decline.", expectedResult: "Restore availability above 99.7%", evidenceIds: [], completedTime: null }
    ],
    probes: [
      { id: "PBR-018", name: "Approval Download - China", service: "MIB3 Approval", regions: ["China"], owner: "Probe Ops", status: "Active" },
      { id: "PBR-020", name: "Battery Health Delivery - Europe", service: "Vehicle Telemetry", regions: ["Europe"], owner: "Probe Ops", status: "Active" },
      { id: "PBR-021", name: "Registration Journey - France", service: "ODP Registration", regions: ["France"], owner: "Probe Ops", status: "Active" }
    ],
    probeResults: [
      { id: "PR-101", probeId: "PBR-018", problemId: "PRB-201", operationId: "OP-101", actionId: "ACT-101", verification: true, service: "MIB3 Approval", region: "China", metric: "Approval Download Failure Rate", actual: "0.4%", expected: "< 1%", status: "Passed", timestamp: "2026-08-27 16:30" },
      { id: "PR-000", probeId: "PBR-018", problemId: "PRB-204", operationId: null, actionId: null, service: "MIB3 Approval", region: "China", metric: "Approval Download Failure Rate", actual: "12.8%", expected: "< 1%", status: "Failed", timestamp: "2026-09-03 10:00" }
    ],
    evidences: [
      { id: "EVD-HIST-101", category: "Outcome Evidence", source: "Probe", sourceId: "PR-101", problemId: "PRB-201", operationId: "OP-101", actionId: "ACT-101", service: "MIB3 Approval", region: "China", timestamp: "2026-08-27 16:30", metric: "Approval Download Failure Rate", expected: "< 1%", actual: "0.4%", status: "Passing" },
      { id: "EVD-CN-007", category: "Problem Evidence", source: "Availability", sourceId: "AVL-CN-007", problemId: "PRB-207", operationId: "OP-103", actionId: null, service: "Vehicle Registration", region: "China", timestamp: "2026-09-03 11:10", metric: "Service Availability", expected: "> 99.7%", actual: "98.9%", status: "Degraded" },
      { id: "EVD-BASE-001", category: "Problem Evidence", source: "Probe", sourceId: "PR-000", problemId: "PRB-204", operationId: null, actionId: null, service: "MIB3 Approval", region: "China", timestamp: "2026-09-03 10:00", metric: "Approval Download Failure Rate", expected: "< 1%", actual: "12.8%", status: "Failing" },
      { id: "EVD-BASE-002", category: "Problem Evidence", source: "Availability", sourceId: "AVL-CN-001", problemId: "PRB-204", operationId: null, actionId: null, service: "MIB3 Approval", region: "China", timestamp: "2026-09-03 10:02", metric: "Service Availability", expected: "> 99.7%", actual: "96.1%", status: "Degraded" },
      { id: "EVD-BASE-003", category: "Problem Evidence", source: "Incident", sourceId: "INC-CN-401", problemId: "PRB-204", operationId: null, actionId: null, service: "MIB3 Approval", region: "China", timestamp: "2026-09-03 10:04", metric: "HTTP 500 rate", expected: "< 1%", actual: "8.2%", status: "Failing" },
      { id: "EVD-305", category: "Action Evidence", source: "CR / Release", sourceId: "CHG-381", problemId: "PRB-205", operationId: "OPR-881", actionId: "ACT-105", service: "Vehicle Telemetry", region: "Europe", timestamp: "2026-09-02 08:08", metric: "Consumer scale", expected: "10 pods", actual: "10 pods", status: "Completed" },
      { id: "EVD-306", category: "Outcome Evidence", source: "Availability", sourceId: "AVL-021", problemId: "PRB-205", operationId: "OPR-881", actionId: "ACT-106", service: "Vehicle Telemetry", region: "Europe", timestamp: "2026-09-02 09:25", metric: "p95 delivery latency", expected: "< 2m", actual: "2m 41s", status: "Improving" }
    ],
    outcomes: [
      { id: "OUT-001", operationId: "OP-101", problemId: "PRB-201", expected: "Failure Rate < 1%; Availability > 99.7%", actual: "Failure Rate 0.4%; Availability 99.8%", beforeMetric: { availability: 96.1, failureRate: 12.8 }, afterMetric: { availability: 99.8, failureRate: 0.4 }, impact: { usersRecovered: 12450, downtimeReduced: 420, failureReduction: 96, availabilityImprovement: 23.5, riskReduction: 42, customerRiskBefore: "High", customerRiskAfter: "Low" }, result: "Objective Achieved", status: "Verified", evidenceIds: ["EVD-HIST-101"], conclusion: "Backend timeout optimization restored the approval-download journey within target.", timestamp: "2026-08-27 16:42" }
    ],
    historyEvents: [
      { id: "HST-001", problemId: "PRB-204", operationId: null, type: "Signal detected", description: "Probe detected 12.8% Approval Download failure in China.", timestamp: "2026-09-03 10:00", status: "Completed" },
      { id: "HST-002", problemId: "PRB-204", operationId: null, type: "Evidence collected", description: "Availability fell to 96.1%; HTTP 500 rate reached 8.2%.", timestamp: "2026-09-03 10:04", status: "Completed" },
      { id: "HST-003", problemId: "PRB-204", operationId: null, type: "Problem correlated", description: "Five China signals matched the same service and time window.", timestamp: "2026-09-03 10:06", status: "Completed" },
      { id: "HST-004", problemId: "PRB-204", operationId: null, type: "Unreported Problem detected", description: "Signal evidence exists before a Backend Incident is linked.", timestamp: "2026-09-03 10:06", status: "Completed" }
    ]
  };

  const clone = (value) => JSON.parse(JSON.stringify(value));
  const now = () => new Date().toLocaleString("sv-SE", { hour12: false }).replace("T", " ").slice(0, 16);
  const find = (collection, id) => state[collection].find((item) => item.id === id);
  const hasHistory = (problemId, type) => state.historyEvents.some((event) => event.problemId === problemId && event.type === type);
  let state = load();

  function load() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
      if (saved && Array.isArray(saved.signals) && Array.isArray(saved.outcomes)) return saved;
    } catch (error) {
      localStorage.removeItem(STORAGE_KEY);
    }
    return clone(initialState);
  }

  function getSignals() {
    return state.signals;
  }

  function getSignalById(signalId) {
    return find("signals", signalId);
  }

  function calculateSignalRisk(signal) {
    if (!signal) return null;
    const value = Number(signal.metric?.value);
    const threshold = Number(signal.metric?.threshold);
    const deviation = Number.isFinite(value) && Number.isFinite(threshold) && threshold !== 0 ? Math.abs(value - threshold) / Math.abs(threshold) : 0;
    const impact = signal.impact?.businessImpact === "High" ? 20 : signal.impact?.businessImpact === "Medium" ? 10 : 0;
    const severity = signal.severity === "Critical" ? 40 : signal.severity === "High" ? 25 : signal.severity === "Medium" ? 12 : 5;
    return Math.min(100, Math.round(severity + impact + Math.min(35, deviation * 5)));
  }

  function correlateSignals(signalIds = []) {
    const signals = signalIds.map((id) => find("signals", id)).filter(Boolean);
    if (!signals.length) return { signalIds: [], confidence: 0, possibleProblem: false, reasons: [] };
    const services = new Set(signals.map((signal) => signal.service));
    const regions = new Set(signals.map((signal) => signal.region));
    const types = new Set(signals.map((signal) => signal.type));
    const reasons = [];
    if (services.size === 1) reasons.push("Same service");
    if (regions.size === 1) reasons.push("Same region");
    if (signals.length > 1) reasons.push("Same time window");
    if (types.has("Availability Degradation") && signals.some((signal) => signal.source === "Probe")) reasons.push("Probe failure + Availability degradation");
    const confidence = Math.min(99, Math.max(...signals.map((signal) => signal.correlationScore || calculateSignalRisk(signal) || 0), 0) + (signals.length >= 3 ? 5 : 0));
    return { signalIds: signals.map((signal) => signal.id), confidence, possibleProblem: reasons.length >= 2, reasons };
  }

  function updateSignalStatus(signalId, status, problemId = null) {
    const signal = find("signals", signalId);
    if (!signal) return null;
    signal.status = status;
    if (problemId) signal.problemId = problemId;
    persist();
    return signal;
  }

  function createSignal(input = {}) {
    const id = input.id || `SIG-${String(state.signals.length + 1).padStart(4, "0")}`;
    const existing = find("signals", id);
    if (existing) return existing;
    const signal = {
      id,
      source: input.source || "Monitoring",
      type: input.type || "Performance Degradation",
      service: input.service || "Unknown service",
      region: input.region || "China",
      environment: input.environment || "Production",
      severity: input.severity || "Medium",
      status: input.status || "Detected",
      metric: typeof input.metric === "object" ? input.metric : { name: input.metric || "anomaly", value: input.value ?? 0, threshold: input.threshold ?? 0, unit: input.unit || "" },
      impact: input.impact || { userAffected: 0, businessImpact: "Medium" },
      timestamp: input.timestamp || now(),
      relatedObjects: input.relatedObjects || [],
      problemId: null,
      correlationScore: input.correlationScore || null,
      description: input.description || "Observed abnormal condition from an integrated source."
    };
    state.signals.push(signal);
    addHistory(null, null, `Signal ${signal.id} detected`, `${signal.id} detected by ${signal.source}.`);
    persist();
    return signal;
  }

  function createProblemFromSignals(signalIds = [], input = {}) {
    const selected = signalIds.map((id) => find("signals", id)).filter(Boolean);
    if (!selected.length) return null;
    const existing = state.problems.find((problem) => selected.some((signal) => problem.signalIds?.includes(signal.id)));
    if (existing) {
      const correlation = correlateSignals(signalIds);
      existing.status = "Investigating";
      existing.owner = existing.owner === "Unassigned" ? "Operation Manager" : existing.owner;
      existing.candidate = false;
      existing.correlation = correlation;
      existing.unreported = state.incidents.filter((incident) => incident.problemId === existing.id).length === 0;
      selected.forEach((signal) => { signal.problemId = existing.id; signal.status = "Problem Created"; });
      addHistory(existing.id, null, "Problem created", `${existing.id} created from ${selected.length} correlated signals.`);
      persist();
      return existing;
    }
    const correlation = correlateSignals(signalIds);
    const first = selected[0];
    const problem = createProblem({
      id: input.id || `PRB-${204 + state.problems.length}`,
      title: input.title || `${first.service} instability`,
      service: first.service,
      region: first.region,
      category: input.category || first.type,
      risk: input.risk || (first.severity === "Critical" ? "Critical" : "High"),
      impact: input.impact || `${Math.max(...selected.map((signal) => signal.impact?.userAffected || 0), 0).toLocaleString()} users affected`,
      description: input.description || `Correlated ${selected.length} signals indicate a potential ${first.service} problem.`,
      signalIds
    });
    problem.unreported = state.incidents.filter((incident) => incident.problemId === problem.id).length === 0;
    problem.correlation = correlation;
    selected.forEach((signal) => { signal.problemId = problem.id; signal.status = "Problem Created"; });
    addHistory(problem.id, null, "Problem correlated", `${selected.length} signals correlated with ${correlation.confidence}% confidence.`);
    persist();
    return problem;
  }

  function getOperationHealth() {
    const activeOperations = state.operations.filter((operation) => !["Completed", "Closed", "Cancelled"].includes(operation.status));
    const criticalProblems = state.problems.filter((problem) => problem.risk === "Critical" && !["Resolved", "Closed"].includes(problem.status));
    const verificationFailures = activeOperations.filter((operation) => operation.verificationStatus === "Failed").length;
    if (criticalProblems.length || verificationFailures) return { label: "Critical", tone: "critical", reason: `${criticalProblems.length} critical problems or failed verifications` };
    if (activeOperations.length > 3) return { label: "Attention Required", tone: "warning", reason: `${activeOperations.length} active operations need follow-up` };
    return { label: "Healthy", tone: "healthy", reason: "No critical unresolved operation risk" };
  }

  function getChinaServiceHealth() {
    const services = [...new Set(state.signals.filter((signal) => signal.region === "China").map((signal) => signal.service))];
    if (!services.length) services.push("MIB3 Approval");
    return services.map((service) => {
      const signals = state.signals.filter((signal) => signal.service === service && signal.region === "China");
      const problems = state.problems.filter((problem) => problem.service === service && problem.region === "China");
      const openProblems = problems.filter((problem) => !["Resolved", "Closed"].includes(problem.status));
      const outcome = state.outcomes.map((item) => ({ item, problem: find("problems", item.problemId) })).filter(({ problem }) => problem?.service === service && problem.region === "China").at(-1)?.item;
      const availabilitySignal = signals.filter((signal) => signal.metric?.name === "availability" && signal.status !== "Archived").at(-1);
      const failureSignal = signals.filter((signal) => signal.metric?.name === "failure_rate" && signal.status !== "Archived").at(-1);
      const availability = availabilitySignal?.metric?.value ?? outcome?.afterMetric?.availability;
      const failureRate = failureSignal?.metric?.value ?? outcome?.afterMetric?.failureRate;
      const critical = openProblems.some((problem) => problem.risk === "Critical");
      const warning = openProblems.length > 0 || Number(availability) < 99.7;
      return { service, availability: availability != null ? `${availability}%` : "—", failureRate: failureRate != null ? `${failureRate}%` : "—", probeSuccess: failureRate != null ? `${(100 - Number(failureRate)).toFixed(1)}%` : "No run", openProblems: openProblems.length, status: critical ? "Critical" : warning ? "Warning" : "Healthy" };
    });
  }

  function getOperationOutcomes() {
    return state.outcomes.map((outcome) => ({ ...outcome, operation: find("operations", outcome.operationId), problem: find("problems", outcome.problemId) }));
  }

  function getCompletedOperations() {
    return state.operations.filter((operation) => operation.status === "Completed").map((operation) => {
      const outcome = state.outcomes.find((item) => item.operationId === operation.id);
      return { operation, problem: find("problems", operation.problemId), outcome, actions: state.actions.filter((action) => action.operationId === operation.id) };
    }).filter((item) => item.outcome);
  }

  function getExecutiveSummary() {
    const verified = state.outcomes.filter((outcome) => outcome.status === "Verified" || outcome.result === "Objective Achieved");
    const averageImprovement = verified.length ? verified.reduce((total, outcome) => total + (outcome.impact?.availabilityImprovement || 0), 0) / verified.length : 0;
    const averageRiskReduction = verified.length ? verified.reduce((total, outcome) => total + (outcome.impact?.riskReduction || 0), 0) / verified.length : 0;
    return {
      totalProblems: state.problems.length + 13,
      resolvedProblems: state.problems.filter((problem) => problem.status === "Resolved").length + 14,
      verifiedImprovement: `+${averageImprovement.toFixed(1)}%`,
      riskReduction: `-${Math.round(averageRiskReduction)}%`
    };
  }

  function getClosedLoopMetrics() {
    const started = state.operations.length;
    const completed = state.operations.filter((operation) => operation.status === "Completed").length;
    const verified = state.outcomes.length;
    return { signalsDetected: state.signals.length + 119, problemsCreated: state.problems.length + 13, operationsStarted: started + 11, operationsCompleted: completed + 11, outcomesVerified: verified + 10, closedLoopRate: `${Math.floor(((verified + 10) / Math.max(1, started + 11)) * 100)}%`, conversion: { problems: "14.2%", operations: "83%", completed: "80%", outcomes: "91%" } };
  }

  function getBusinessImpact() {
    const usersImpacted = Math.max(0, ...state.signals.map((signal) => signal.impact?.userAffected || 0));
    const usersRecovered = state.outcomes.reduce((total, outcome) => total + (outcome.impact?.usersRecovered || 0), 0);
    const downtimeReduced = state.outcomes.reduce((total, outcome) => total + (outcome.impact?.downtimeReduced || 0), 0);
    const latestVerified = state.outcomes.filter((outcome) => outcome.status === "Verified" || outcome.result === "Objective Achieved").at(-1);
    return { usersImpacted, usersRecovered, downtimeReduced: `${downtimeReduced} min`, downtime: `${downtimeReduced} min`, availabilityImprovement: latestVerified ? `+${latestVerified.impact?.availabilityImprovement || 0}%` : "0%", customerRiskBefore: latestVerified?.impact?.customerRiskBefore || "—", customerRiskAfter: latestVerified?.impact?.customerRiskAfter || "—", criticalProblemsResolved: state.problems.filter((problem) => problem.risk === "Critical" && problem.status === "Resolved").length, operationsCompleted: state.operations.filter((operation) => operation.status === "Completed").length };
  }

  function getRiskServices() {
    const rank = { Critical: 0, High: 1, Warning: 2, Medium: 3 };
    return state.problems.filter((problem) => problem.region === "China" && !["Resolved", "Closed"].includes(problem.status)).map((problem) => {
      const evidence = state.evidences.filter((item) => item.problemId === problem.id);
      const availability = evidence.find((item) => item.metric === "Service Availability")?.actual || state.signals.find((signal) => signal.problemId === problem.id && signal.metric?.name === "availability")?.metric?.value;
      const probeFailure = state.probeResults.filter((result) => result.problemId === problem.id).at(-1)?.actual;
      const operation = problem.operationIds.map((id) => find("operations", id)).find((item) => item && !["Completed", "Closed", "Cancelled"].includes(item.status));
      return { service: problem.service, region: problem.region, risk: problem.risk, issue: problem.category, availability: typeof availability === "number" ? `${availability}%` : availability || "—", probeFailure: probeFailure || "No run", problemId: problem.id, activeOperation: operation?.id || null };
    }).sort((a, b) => (rank[a.risk] ?? 9) - (rank[b.risk] ?? 9));
  }

  function getOperationTrends() {
    return { range: "7 Days", problems: [5, 7, 6, 8, 7, 6, state.problems.filter((problem) => problem.status !== "Resolved").length], availability: [98.9, 99.1, 98.7, 99.2, 99.4, 99.6, 99.8], failureRate: [2.1, 1.8, 2.4, 1.5, 1.2, 0.9, 0.6], closedLoop: [52, 57, 61, 64, 68, 71, 73] };
  }

  function persist() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    window.dispatchEvent(new CustomEvent("prototype-state-change"));
  }

  function addHistory(problemId, operationId, type, description, status = "Completed") {
    if (hasHistory(problemId, type)) return;
    state.historyEvents.push({ id: `HST-${String(state.historyEvents.length + 1).padStart(3, "0")}`, problemId, operationId: operationId || null, type, description, timestamp: now(), status });
  }

  function startInvestigation(problemId) {
    const problem = find("problems", problemId);
    if (!problem) return null;
    if (["Detected", "Investigating"].includes(problem.status)) problem.status = "Investigating";
    problem.owner = problem.owner === "Unassigned" ? "Operation Manager" : problem.owner;
    problem.updatedAt = now();
    addHistory(problemId, null, "Investigation started", "Operation began reviewing the unreported Probe and availability evidence.");
    persist();
    return problem;
  }

  function createProblem(input = {}) {
    const existing = input.id && find("problems", input.id);
    if (existing) return startInvestigation(existing.id);
    const problem = { id: input.id || `PRB-${204 + state.problems.length}`, title: input.title || "New detected problem", service: input.service || "Unknown", region: input.region || "Unknown", category: input.category || "Unclassified", risk: input.risk || "High", status: "Detected", impact: input.impact || "Under assessment", firstDetected: now(), updatedAt: now(), owner: "Unassigned", description: input.description || "Created from correlated abnormal evidence.", signalIds: input.signalIds || [], operationIds: [], sbtRisk: "Monitor", unreported: true };
    state.problems.push(problem);
    addHistory(problem.id, null, "Problem created", `${problem.id} created from correlated evidence.`);
    persist();
    return problem;
  }

  function createOperation(problemId) {
    const existing = find("operations", "OP-102");
    if (existing) return existing;
    const problem = find("problems", problemId);
    if (!problem) return null;
    const operation = { id: "OP-102", title: "Improve Approval Download Stability", problemId, objective: "Reduce China approval download failure rate below 1%.", trigger: "Unreported Probe failure at 12.8%", priority: "P1", owner: "Operation Manager", stakeholders: ["Operation Engineer", "Backend MIB3", "Probe Ops"], expectedOutcome: "Failure Rate < 1%; Availability > 99.7%", kpi: "Approval Download Failure Rate", evidenceRequirement: "Post-fix Probe Result and Availability", createdAt: now(), startTime: null, targetTime: "2026-09-03 18:00", status: "Draft", verificationStatus: "Not Started", verification: null, actionIds: [], outcomeIds: [] };
    state.operations.push(operation);
    problem.operationIds.push(operation.id);
    problem.status = "Active";
    problem.unreported = state.incidents.filter((incident) => incident.problemId === problemId).length === 0;
    problem.updatedAt = now();
    addHistory(problemId, operation.id, "Operation OP-102 created", "Operation created with a measurable objective and evidence requirement.");
    persist();
    return operation;
  }

  function createAction(operationId, input = {}) {
    const operation = find("operations", operationId);
    if (!operation) return null;
    const nextActionNumber = Math.max(0, ...state.actions.map((item) => Number(item.id.split("-")[1]) || 0)) + 1;
    const requestedId = input.id || (operationId === "OP-102" && !find("actions", "ACT-001") ? "ACT-001" : `ACT-${String(nextActionNumber).padStart(3, "0")}`);
    const existing = find("actions", requestedId);
    if (existing) return existing;
    const action = { id: requestedId, operationId, name: input.name || "Run regional Probe", owner: input.owner || "Operation Engineer", status: "Planned", dueDate: input.dueDate || "2026-09-03 14:00", description: input.description || "Run the independent MIB3 Approval Probe in China.", expectedResult: input.expectedResult || "Capture current Approval Download failure rate", evidenceIds: [], completedTime: null };
    state.actions.push(action);
    operation.actionIds.push(action.id);
    operation.status = "In Progress";
    operation.startTime ||= now();
    addHistory(operation.problemId, operation.id, `Action ${action.id} created`, `${action.name} assigned to ${action.owner}.`);
    persist();
    return action;
  }

  function createEvidence(input) {
    const existing = find("evidences", input.id);
    if (existing) return existing;
    const evidence = { id: input.id, category: input.category, source: input.source, sourceId: input.sourceId || null, problemId: input.problemId, operationId: input.operationId || null, actionId: input.actionId || null, service: input.service, region: input.region, timestamp: input.timestamp || now(), metric: input.metric, expected: input.expected, actual: input.actual, status: input.status };
    state.evidences.push(evidence);
    const action = evidence.actionId && find("actions", evidence.actionId);
    if (action && !action.evidenceIds.includes(evidence.id)) action.evidenceIds.push(evidence.id);
    return evidence;
  }

  function completeAction(actionId, options = {}) {
    const action = find("actions", actionId);
    if (!action) return null;
    action.status = "Completed";
    action.completedTime = now();
    const operation = find("operations", action.operationId);
    if (action.name === "Deploy backend fix" && !options.skipEvidence) {
      createEvidence({ id: "EVD-002", category: "Action Evidence", source: "CR / Release", sourceId: "REL-CN-002", problemId: operation.problemId, operationId: operation.id, actionId: action.id, service: "MIB3 Approval", region: "China", metric: "Backend fix deployment", expected: "Fix deployed", actual: "REL-CN-002 deployed", status: "Completed" });
      operation.status = "Verifying";
      addHistory(operation.problemId, operation.id, "Backend fix completed", "REL-CN-002 deployed and Action Evidence EVD-002 created.");
    } else if (operation.verificationStatus === "Failed") {
      createEvidence({ id: `EVD-ACT-${action.id}`, category: "Action Evidence", source: "Operation Action", sourceId: action.id, problemId: operation.problemId, operationId: operation.id, actionId: action.id, service: "MIB3 Approval", region: "China", metric: action.name, expected: action.expectedResult, actual: "Completed", status: "Completed" });
      operation.status = "Verifying";
      operation.verificationStatus = "Not Started";
      operation.verification = null;
      addHistory(operation.problemId, operation.id, "Corrective Action completed", `${action.id} completed; a new independent verification Probe is required.`);
    }
    persist();
    return action;
  }

  function ensureFixAction(operation) {
    let fix = find("actions", "ACT-002");
    if (!fix) {
      fix = { id: "ACT-002", operationId: operation.id, name: "Deploy backend fix", owner: "Backend MIB3", status: "Planned", dueDate: "2026-09-03 15:30", description: "Deploy the mitigation associated with REL-CN-002.", expectedResult: "Remove the HTTP 500 regression", evidenceIds: [], completedTime: null };
      state.actions.push(fix);
      operation.actionIds.push(fix.id);
    }
    return fix;
  }

  function runProbe({ operationId, actionId = null, verification = false, passed = true }) {
    const operation = find("operations", operationId);
    if (!operation) return null;
    const problem = find("problems", operation.problemId);
    const verificationRuns = state.probeResults.filter((result) => result.operationId === operationId && (result.verification || Number(result.id.split("-")[1]) >= 2)).length;
    const resultId = verification ? `PR-${String(verificationRuns + 2).padStart(3, "0")}` : "PR-001";
    const existing = find("probeResults", resultId);
    if (existing) return existing;
    const actual = verification ? (passed ? "0.6%" : "4.8%") : "12.8%";
    const result = { id: resultId, probeId: "PBR-018", problemId: problem.id, operationId, actionId, verification, service: problem.service, region: problem.region, metric: "Approval Download Failure Rate", actual, expected: "< 1%", status: verification ? (passed ? "Passed" : "Failed") : "Failed", timestamp: now() };
    state.probeResults.push(result);
    if (verification) {
      const evidenceId = resultId === "PR-002" ? "EVD-003" : `EVD-${String(Number(resultId.split("-")[1]) + 1).padStart(3, "0")}`;
      createEvidence({ id: evidenceId, category: "Outcome Evidence", source: "Probe", sourceId: result.id, problemId: problem.id, operationId, actionId, service: problem.service, region: problem.region, metric: result.metric, expected: result.expected, actual: result.actual, status: result.status });
      operation.status = "Verifying";
      operation.verificationStatus = "Pending Review";
      operation.verification = { expected: "< 1%", actual, availability: passed ? "99.8%" : "97.4%", probeResultId: result.id, status: "Pending Review" };
      addHistory(problem.id, operation.id, verificationRuns ? `Verification Probe executed (${result.id})` : "Verification Probe executed", `${result.id} measured ${actual} against ${result.expected}.`);
      addHistory(problem.id, operation.id, verificationRuns ? `Outcome Evidence created (${evidenceId})` : "Outcome Evidence created", `${evidenceId} created from the independent verification Probe Result.`);
    } else {
      createEvidence({ id: "EVD-001", category: "Problem Evidence", source: "Probe", sourceId: result.id, problemId: problem.id, operationId, actionId, service: problem.service, region: problem.region, metric: result.metric, expected: result.expected, actual: result.actual, status: "Failing" });
      const action = actionId && find("actions", actionId);
      if (action) { action.status = "Completed"; action.completedTime = now(); if (!action.evidenceIds.includes("EVD-001")) action.evidenceIds.push("EVD-001"); }
      operation.status = "In Progress";
      ensureFixAction(operation);
      addHistory(problem.id, operation.id, "Probe executed", `${result.id} confirmed the failure remains at ${actual}.`);
      addHistory(problem.id, operation.id, "Problem Evidence created", "EVD-001 linked the Probe Result to Problem, Operation, and Action.");
    }
    persist();
    return result;
  }

  function recordOutcome(operationId, result = "Objective Achieved") {
    const operation = find("operations", operationId);
    if (!operation) return null;
    const existing = state.outcomes.find((outcome) => outcome.operationId === operationId);
    if (existing) return existing;
    const outcomeEvidence = state.evidences.filter((item) => item.operationId === operationId && item.category === "Outcome Evidence").at(-1);
    const beforeFailure = 12.8;
    const afterFailure = parseFloat(operation.verification.actual);
    const afterAvailability = parseFloat(operation.verification.availability);
    const nextOutcomeNumber = Math.max(0, ...state.outcomes.map((item) => Number(item.id.split("-")[1]) || 0)) + 1;
    const outcome = { id: `OUT-${String(nextOutcomeNumber).padStart(3, "0")}`, operationId, problemId: operation.problemId, expected: "Failure Rate < 1%; Availability > 99.7%", actual: `Failure Rate ${operation.verification.actual}; Availability ${operation.verification.availability}`, beforeMetric: { availability: 96.1, failureRate: beforeFailure }, afterMetric: { availability: afterAvailability, failureRate: afterFailure }, impact: { usersRecovered: 2000, downtimeReduced: 85, failureReduction: Math.round(((beforeFailure - afterFailure) / beforeFailure) * 100), availabilityImprovement: 3.9, riskReduction: 38, customerRiskBefore: "High", customerRiskAfter: "Low" }, result, status: "Verified", evidenceIds: outcomeEvidence ? [outcomeEvidence.id] : [], conclusion: "The backend fix restored the approval-download journey within its target.", timestamp: now() };
    state.outcomes.push(outcome);
    operation.outcomeIds.push(outcome.id);
    addHistory(operation.problemId, operation.id, "Outcome Achieved", `${outcome.actual}.`);
    return outcome;
  }

  function recordVerification(operationId) {
    const operation = find("operations", operationId);
    if (!operation || !operation.verification) return null;
    const passed = parseFloat(operation.verification.actual) < 1;
    operation.verification.status = passed ? "Passed" : "Failed";
    operation.verificationStatus = passed ? "Passed" : "Failed";
    addHistory(operation.problemId, operation.id, passed ? "Verification Passed" : "Verification Failed", passed ? "Actual failure rate met the < 1% target." : "Actual failure rate remains above the < 1% target.");
    if (passed) {
      recordOutcome(operationId);
      operation.status = "Completed";
      addHistory(operation.problemId, operation.id, "Operation Completed", "Verification passed and the expected outcome was achieved.");
      const problem = find("problems", operation.problemId);
      problem.status = "Resolved";
      problem.updatedAt = now();
      problem.signalIds.forEach((signalId) => { const signal = find("signals", signalId); if (signal) signal.status = "Archived"; });
      addHistory(problem.id, operation.id, "Problem Resolved", "PRB-204 resolved with evidence-backed outcome.");
    } else {
      operation.status = "Verifying";
    }
    persist();
    return operation.verification;
  }

  function reset() {
    state = clone(initialState);
    localStorage.removeItem(STORAGE_KEY);
    persist();
  }

  window.prototypeState = {
    getState: () => state,
    getSignals,
    getSignalById,
    createSignal,
    updateSignalStatus,
    correlateSignals,
    calculateSignalRisk,
    createProblemFromSignals,
    getOperationHealth,
    getChinaServiceHealth,
    getOperationOutcomes,
    getCompletedOperations,
    getExecutiveSummary,
    getClosedLoopMetrics,
    getBusinessImpact,
    getRiskServices,
    getOperationTrends,
    reset,
    startInvestigation,
    createProblem,
    createOperation,
    createAction,
    runProbe,
    createEvidence,
    completeAction,
    recordVerification,
    recordOutcome
  };
})();
