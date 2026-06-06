(function attachOptions(root) {
  const textApi = root.RHW?.text || (typeof require !== "undefined" ? require("./text.js").text : null);
  const text = (path) => textApi?.get(path) || "";
  const OPTION_DECADE_FILTERS = [
    { value: "all", label: text("options.decadeFilters.all"), sinceYear: null },
    { value: "1990", label: text("options.decadeFilters.1990"), sinceYear: 1990 },
    { value: "2000", label: text("options.decadeFilters.2000"), sinceYear: 2000 },
    { value: "2010", label: text("options.decadeFilters.2010"), sinceYear: 2010 },
    { value: "2020", label: text("options.decadeFilters.2020"), sinceYear: 2020 }
  ];
  const OPTION_WIN_COUNT_FILTERS = [
    { value: "all", label: text("options.winCountFilters.all"), minWins: null, maxWins: null },
    { value: "2", label: text("options.winCountFilters.2"), minWins: 2, maxWins: null },
    { value: "3", label: text("options.winCountFilters.3"), minWins: 3, maxWins: null },
    { value: "4", label: text("options.winCountFilters.4"), minWins: 4, maxWins: null },
    { value: "5plus", label: text("options.winCountFilters.5plus"), minWins: 5, maxWins: null }
  ];
  const DEFAULT_OPTIONS = {
    schemaVersion: 2,
    hideHints: false,
    decadeFilter: "all",
    winCountFilter: "all",
    easyMode: false,
    easyModePromptSeen: false
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
    next.easyMode = Boolean(next.easyMode);
    next.easyModePromptSeen = Boolean(next.easyModePromptSeen);
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
