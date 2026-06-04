(function attachConfig(root) {
  const CONFIG = {
    storageKeys: {
      stats: "rhw:stats:v1",
      current: "rhw:current:v1"
    },
    horseAttemptLimit: 5,
    pedigreeAttemptLimit: 15,
    defaultTarget: "sire",
    targets: {
      horse: { label: "馬名", shortLabel: "馬", className: "horse" },
      sire: { label: "父", shortLabel: "父", className: "sire" },
      dam: { label: "母", shortLabel: "母", className: "dam" }
    }
  };

  root.RHW = Object.assign(root.RHW || {}, { CONFIG });
})(typeof globalThis !== "undefined" ? globalThis : window);
