(function attachConfig(root) {
  const CONFIG = {
    storageKeys: {
      stats: "rhw:stats:v1",
      current: "rhw:current:v1"
    },
    attemptLimit: 15,
    maxInputLength: 18,
    targets: {
      horse: { label: "馬名", shortLabel: "馬", className: "horse" },
      sire: { label: "父", shortLabel: "父", className: "sire" },
      dam: { label: "母", shortLabel: "母", className: "dam" }
    }
  };

  root.RHW = Object.assign(root.RHW || {}, { CONFIG });
})(typeof globalThis !== "undefined" ? globalThis : window);
