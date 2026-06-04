(function attachConfig(root) {
  const CONFIG = {
    storageKeys: {
      stats: "rhw:stats:v1",
      current: "rhw:current:v1",
      options: "rhw:options:v1"
    },
    attemptLimit: 15,
    maxInputLength: 18
  };

  root.RHW = Object.assign(root.RHW || {}, { CONFIG });
})(typeof globalThis !== "undefined" ? globalThis : window);
