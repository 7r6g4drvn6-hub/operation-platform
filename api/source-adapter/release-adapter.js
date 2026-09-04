(function (root) {
  const adapter = {
    receive(data) { return this.convertToSignal(this.validate(this.normalize(data))); },
    normalize(data = {}) { return { ...data, source: "Release", type: data.type || "Release Risk", relatedObjects: data.releaseId ? [data.releaseId] : [] }; },
    validate(data) { if (!data.service || !data.region) throw new Error("Release signal requires service and region"); return data; },
    convertToSignal(data) { return { ...data, severity: data.severity || "Medium", metric: data.metric || { name: "deployment", value: 1, threshold: 0, unit: "event" }, impact: data.impact || { userAffected: 0, businessImpact: "Medium" }, timestamp: data.timestamp || data.deployTime, description: data.description || "Release event available for correlation." }; }
  };
  root.sourceAdapters = root.sourceAdapters || {}; root.sourceAdapters.release = adapter;
  if (typeof module !== "undefined") module.exports = adapter;
})(typeof window !== "undefined" ? window : globalThis);
