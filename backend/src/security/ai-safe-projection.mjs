const ALLOWED_FIELDS = Object.freeze([
  "displayId", "service", "region", "environment", "issueFamily", "severity",
  "status", "metricName", "metricValue", "metricThreshold", "metricUnit",
  "usersAffected", "businessImpact", "detectedAt", "firstDetectedAt",
  "lastDetectedAt", "incidentCount", "signalCount", "probeEvidenceCount",
  "availabilityImpact", "risk", "unreported", "operationStatus",
  "verificationStatus", "expectedOutcome", "evidenceTypes"
]);

export function projectForAI(record = {}) {
  const projection = {};
  for (const key of ALLOWED_FIELDS) {
    if (record[key] !== undefined) projection[key] = record[key];
  }
  projection.dataClassification = "AI_SAFE_OPERATIONAL_SUMMARY";
  projection.sourcePayloadIncluded = false;
  return projection;
}

export function projectCollectionForAI(records = []) {
  return records.map(projectForAI);
}

export const aiSafeFields = ALLOWED_FIELDS;
