(function attachOptions(root) {
  const OPTION_DECADE_FILTERS = [
    { value: "all", label: "制限なし", sinceYear: null },
    { value: "1990", label: "1990年代以降", sinceYear: 1990 },
    { value: "2000", label: "2000年代以降", sinceYear: 2000 },
    { value: "2010", label: "2010年代以降", sinceYear: 2010 },
    { value: "2020", label: "2020年代以降", sinceYear: 2020 }
  ];
  const OPTION_WIN_COUNT_FILTERS = [
    { value: "all", label: "制限無し", minWins: null, maxWins: null },
    { value: "2", label: "2勝", minWins: 2, maxWins: 2 },
    { value: "3", label: "3勝", minWins: 3, maxWins: 3 },
    { value: "4", label: "4勝", minWins: 4, maxWins: 4 },
    { value: "5plus", label: "5勝以上", minWins: 5, maxWins: null }
  ];
  const DEFAULT_OPTIONS = {
    schemaVersion: 1,
    hideHints: false,
    decadeFilter: "all",
    winCountFilter: "all"
  };

  function makeOptions(existing) {
    const next = Object.assign({}, DEFAULT_OPTIONS, existing || {});
    if (!OPTION_DECADE_FILTERS.some((filter) => filter.value === next.decadeFilter)) {
      next.decadeFilter = DEFAULT_OPTIONS.decadeFilter;
    }
    if (!OPTION_WIN_COUNT_FILTERS.some((filter) => filter.value === next.winCountFilter)) {
      next.winCountFilter = DEFAULT_OPTIONS.winCountFilter;
    }
    next.hideHints = Boolean(next.hideHints);
    return next;
  }

  function filterQuestions(questions, options) {
    const normalized = makeOptions(options);
    const filtered = questions.filter((question) =>
      questionMatchesDecade(question, normalized.decadeFilter)
      && questionMatchesWinCount(question, normalized.winCountFilter)
    );
    return filtered.length ? filtered : questions;
  }

  function questionMatchesDecade(question, filterValue) {
    const filter = OPTION_DECADE_FILTERS.find((item) => item.value === filterValue) || OPTION_DECADE_FILTERS[0];
    if (!filter.sinceYear) return true;
    return (question.wins || []).some((win) => Number(win.year) >= filter.sinceYear);
  }

  function questionMatchesWinCount(question, filterValue) {
    const filter = OPTION_WIN_COUNT_FILTERS.find((item) => item.value === filterValue)
      || OPTION_WIN_COUNT_FILTERS[0];
    if (!filter.minWins) return true;
    const winCount = (question.wins || []).length;
    if (filter.maxWins) return winCount >= filter.minWins && winCount <= filter.maxWins;
    return winCount >= filter.minWins;
  }

  const api = {
    OPTION_DECADE_FILTERS,
    OPTION_WIN_COUNT_FILTERS,
    makeOptions,
    filterQuestions,
    questionMatchesDecade,
    questionMatchesWinCount
  };

  root.RHW = Object.assign(root.RHW || {}, api);
  if (typeof module !== "undefined") {
    module.exports = api;
  }
})(typeof globalThis !== "undefined" ? globalThis : window);
