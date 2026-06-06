(function attachConfig(root) {
  const RULES = {
    normal: {
      attemptLimit: 12,
      sireHintUnlockAttempts: 5
    },
    easy: {
      attemptLimit: 8,
      sireHintUnlockAttempts: 0
    },
    maxInputLength: 18,
    recentQuestionLimit: 8,
    statsHistoryLimit: 8,
    boardColumns: {
      horse: 9,
      pedigree: 18
    },
    toastDurationMs: 2600,
    tileFlipDelayMs: 80
  };

  const CONFIG = {
    storageKeys: {
      stats: "rhw:stats:v1",
      current: "rhw:current:v1",
      options: "rhw:options:v1"
    },
    rules: RULES,
    attemptLimit: RULES.normal.attemptLimit,
    easyAttemptLimit: RULES.easy.attemptLimit,
    maxInputLength: RULES.maxInputLength
  };

  root.RHW = Object.assign(root.RHW || {}, { CONFIG });
})(typeof globalThis !== "undefined" ? globalThis : window);
