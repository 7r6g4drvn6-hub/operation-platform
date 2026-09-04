(function (root) {
  const adapter = {
    receive(data) { return this.convertToSignal(this.validate(this.normalize(data))); },
    normalize(data = {}) { const actual = Number(data.actual || 0); return { ...data, source: "Availability", type: data.type || "Availability Degradation", value: actual, relatedObjects: data.availabilityId ? [data.availabilityId] : [] }; },
    validate(data) { if (!data.service || !data.region || data.actual == null) throw new Error("Availability signal requires service, region, and actual"); return data; },
    convertToSignal(data) { return { ...data, severity: data.severity || (Number(data.actual) < 99 ? "High" : "Medium"), metric: { name: "availability", value: Number(data.actual), threshold: Number(data.expected || 99.7), unit: "%" }, impact: data.impact || { userAffected: data.userAffected || 0, businessImpact: Number(data.actual) < 99 ? "High" : "Medium" }, description: data.description || "Availability record is below the target." }; }
  };
  root.sourceAdapters = root.sourceAdapters || {}; root.sourceAdapters.availability = adapter;
  if (typeof module !== "undefined") module.exports = adapter;
})(typeof window !== "undefined" ? window : globalThis);
