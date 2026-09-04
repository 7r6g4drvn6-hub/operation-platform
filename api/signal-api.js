(function (root) {
  const service = root.signalService;
  const adapters = root.sourceAdapters || {};
  const routes = {
    "POST /api/signals": (body) => service.create(body),
    "GET /api/signals": () => service.list(),
    "GET /api/signals/:id": (body, id) => service.get(id),
    "POST /api/problems/from-signals": (body) => service.createProblem(body.signalIds || [], body),
    "POST /api/integration/probe/result": (body) => service.create(adapters.probe.receive(body)),
    "POST /api/integration/incident": (body) => service.create(adapters.incident.receive(body)),
    "POST /api/integration/smo-ticket": (body) => service.create(adapters.smo.receive(body)),
    "POST /api/integration/availability": (body) => service.create(adapters.availability.receive(body)),
    "POST /api/integration/release": (body) => service.create(adapters.release.receive(body))
  };
  const api = { routes, request(method, path, body) { const key = `${method.toUpperCase()} ${path.replace(/\/[^/]+$/, path.startsWith("/api/signals/") ? "/:id" : path)}`; const route = routes[key]; if (!route) throw new Error(`Mock route not found: ${key}`); return route(body, path.split("/").pop()); } };
  root.signalApi = api;
  if (typeof module !== "undefined") module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
