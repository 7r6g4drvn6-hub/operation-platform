(function (root) {
  const adapter = {
    receive(data) { return this.convertToSignal(this.validate(this.normalize(data))); },
    normalize(data = {}) { return { ...data, source: "SMO", type: data.type || "Customer Impact", relatedObjects: data.ticketId ? [data.ticketId] : [] }; },
    validate(data) { if (!data.category || !data.region) throw new Error("SMO signal requires category and region"); return data; },
    convertToSignal(data) { return { ...data, service: data.service || data.category, severity: data.severity || "High", metric: data.metric || { name: "customer_tickets", value: Number(data.value || 1), threshold: 10, unit: "tickets" }, impact: data.impact && typeof data.impact === "object" ? data.impact : { userAffected: data.userAffected || 0, businessImpact: data.impact || "High" }, description: data.description || "SMO reported customer impact." }; }
  };
  root.sourceAdapters = root.sourceAdapters || {}; root.sourceAdapters.smo = adapter;
  if (typeof module !== "undefined") module.exports = adapter;
})(typeof window !== "undefined" ? window : globalThis);
