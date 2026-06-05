(function attachQuestionPicker(root) {
  function defaultRandom() {
    const cryptoObj = root.crypto;
    if (cryptoObj?.getRandomValues) {
      const values = new Uint32Array(1);
      cryptoObj.getRandomValues(values);
      return values[0] / 0x100000000;
    }
    return Math.random();
  }

  function randomIndex(length, random) {
    const value = Math.max(0, Math.min((random || defaultRandom)(), 0.999999999));
    return Math.floor(value * length);
  }

  function pickQuestion(questions, stats, previousQuestionId, options) {
    const random = options?.random || defaultRandom;
    const recentQuestionIds = options?.recentQuestionIds || [];
    const rounds = Array.isArray(stats?.rounds) ? stats.rounds : [];
    const playedIds = new Set(rounds.map((round) => round.questionId));
    const unplayed = questions.filter((question) => !playedIds.has(question.id));
    const basePool = unplayed.length > 0 ? unplayed : questions;
    const excludedIds = new Set([previousQuestionId].concat(recentQuestionIds).filter(Boolean));
    let filteredPool = basePool.length > 1
      ? basePool.filter((question) => !excludedIds.has(question.id))
      : basePool;

    if (!filteredPool.length && basePool.length > 1) {
      filteredPool = basePool.filter((question) => question.id !== previousQuestionId);
    }
    if (!filteredPool.length) {
      filteredPool = basePool;
    }

    return filteredPool[randomIndex(filteredPool.length, random)];
  }

  const api = { pickQuestion };
  root.RHW = Object.assign(root.RHW || {}, api);
  if (typeof module !== "undefined") {
    module.exports = api;
  }
})(typeof globalThis !== "undefined" ? globalThis : window);
