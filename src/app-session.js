(function attachAppSession(root) {
  const RHW = root.RHW || {};
  const RECENT_QUESTION_LIMIT = RHW.CONFIG.rules.recentQuestionLimit;

  function makeRecentQuestionIds(ids, currentId) {
    const uniqueIds = [];
    (ids || []).forEach((id) => {
      if (id && id !== currentId && !uniqueIds.includes(id)) {
        uniqueIds.push(id);
      }
    });
    if (currentId) uniqueIds.push(currentId);
    return uniqueIds.slice(-RECENT_QUESTION_LIMIT);
  }

  function getQuestionPool(questions, options) {
    return RHW.filterQuestions(questions, options);
  }

  function createInitialState(questions, persisted) {
    const stats = RHW.makeStats(persisted?.stats);
    const options = RHW.makeOptions(persisted?.options);
    const restored = persisted?.round || null;
    const restoredRecentQuestionIds = makeRecentQuestionIds(restored?.recentQuestionIds, restored?.questionId);
    const restoredQuestion = RHW.canRestoreRound(restored, options)
      ? questions.find((question) => question.id === restored.questionId)
      : null;
    const questionPool = getQuestionPool(questions, options);
    const canUseRestoredQuestion = Boolean(restoredQuestion);
    const question = canUseRestoredQuestion
      ? restoredQuestion
      : RHW.pickQuestion(questionPool, stats, restored?.questionId || null, {
        recentQuestionIds: restoredRecentQuestionIds
      });
    const round = canUseRestoredQuestion ? RHW.makeRound(question, restored) : RHW.makeRound(question);

    return {
      question,
      round,
      stats,
      options,
      recentQuestionIds: makeRecentQuestionIds(restoredRecentQuestionIds, question.id)
    };
  }

  function pickNextQuestion(state, questions) {
    const questionPool = getQuestionPool(questions, state.options);
    const question = RHW.pickQuestion(questionPool, state.stats, state.question.id, {
      recentQuestionIds: state.recentQuestionIds
    });
    return {
      question,
      round: RHW.makeRound(question),
      recentQuestionIds: makeRecentQuestionIds(state.recentQuestionIds, question.id)
    };
  }

  const api = {
    RECENT_QUESTION_LIMIT,
    makeRecentQuestionIds,
    getQuestionPool,
    createInitialState,
    pickNextQuestion
  };

  root.RHW = Object.assign(root.RHW || {}, api);
  if (typeof module !== "undefined") {
    module.exports = api;
  }
})(typeof globalThis !== "undefined" ? globalThis : window);
