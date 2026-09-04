(function (root) {
  const stateApi = root.prototypeState;

  const service = {
    list() {
      return stateApi.getSignals();
    },
    get(id) {
      return stateApi.getSignalById(id);
    },
    create(input) {
      return stateApi.createSignal(input);
    },
    correlate(signalIds) {
      return stateApi.correlateSignals(signalIds);
    },
    createProblem(signalIds, input) {
      return stateApi.createProblemFromSignals(signalIds, input);
    }
  };

  root.signalService = service;
  if (typeof module !== "undefined") module.exports = service;
})(typeof window !== "undefined" ? window : globalThis);
