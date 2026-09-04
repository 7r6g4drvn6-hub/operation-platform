(function (root) {
  const adapter = {
    receive(data) { return this.convertToSignal(this.validate(this.normalize(data))); },
    normalize(data = {}) { return { ...data, source: "Probe", type: data.type || "Availability Degradation", metric: { name: data.metric || "failure_rate", value: Number(data.value || 0), threshold: Number(data.threshold ?? 1), unit: data.unit || "%" }, relatedObjects: data.probeId ? [data.probeId] : [] }; },
    validate(data) { if (!data.service || !data.region) throw new Error("Probe signal requires service and region"); return data; },
    convertToSignal(data) { return { ...data, severity: data.severity || (data.value > data.threshold * 5 ? "Critical" : "High"), impact: data.impact || { userAffected: data.userAffected || 0, businessImpact: data.value > data.threshold ? "High" : "Medium" }, description: data.description || "Probe reported an abnormal system behavior." }; }
  };
  root.sourceAdapters = root.sourceAdapters || {}; root.sourceAdapters.probe = adapter;
  if (typeof module !== "undefined") module.exports = adapter;
})(typeof window !== "undefined" ? window : globalThis);
