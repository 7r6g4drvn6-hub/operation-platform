(function (root) {
  const adapter = {
    receive(data) { return this.convertToSignal(this.validate(this.normalize(data))); },
    normalize(data = {}) { return { ...data, source: "Incident", type: data.type || "Backend Failure", relatedObjects: data.incidentId ? [data.incidentId] : [] }; },
    validate(data) { if (!data.service || !data.region) throw new Error("Incident signal requires service and region"); return data; },
    convertToSignal(data) { return { ...data, severity: data.severity || "High", metric: data.metric || { name: "error_rate", value: Number(data.value || 0), threshold: 1, unit: "%" }, impact: data.impact || { userAffected: data.userAffected || 0, businessImpact: "High" }, description: data.description || `${data.errorCode || "Backend failure"} reported by the Incident source.` }; }
  };
  root.sourceAdapters = root.sourceAdapters || {}; root.sourceAdapters.incident = adapter;
  if (typeof module !== "undefined") module.exports = adapter;
})(typeof window !== "undefined" ? window : globalThis);
