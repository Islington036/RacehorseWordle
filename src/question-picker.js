(function attachQuestionPicker(root) {
  function createSeed() {
    const today = new Date();
    return Number(`${today.getFullYear()}${today.getMonth() + 1}${today.getDate()}`);
  }

  function seededIndex(length, salt) {
    const x = Math.sin((createSeed() + salt) * 9301) * 10000;
    return Math.abs(Math.floor(x)) % length;
  }

  function pickQuestion(questions, stats, previousQuestionId) {
    const playedIds = new Set((stats.rounds || []).map((round) => round.questionId));
    const unplayed = questions.filter((question) => !playedIds.has(question.id));
    const pool = unplayed.length > 0 ? unplayed : questions;
    const filteredPool = pool.length > 1
      ? pool.filter((question) => question.id !== previousQuestionId)
      : pool;
    return filteredPool[seededIndex(filteredPool.length, stats.rounds?.length || 0)];
  }

  const api = { pickQuestion };
  root.RHW = Object.assign(root.RHW || {}, api);
  if (typeof module !== "undefined") {
    module.exports = api;
  }
})(typeof globalThis !== "undefined" ? globalThis : window);
