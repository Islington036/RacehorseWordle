(function attachOptions(root) {
  const OPTION_DECADE_FILTERS = [
    { value: "all", label: "制限なし", sinceYear: null },
    { value: "1990", label: "1990年代以降", sinceYear: 1990 },
    { value: "2000", label: "2000年代以降", sinceYear: 2000 },
    { value: "2010", label: "2010年代以降", sinceYear: 2010 },
    { value: "2020", label: "2020年代以降", sinceYear: 2020 }
  ];
  const DEFAULT_OPTIONS = {
    schemaVersion: 1,
    hideHints: false,
    decadeFilter: "all"
  };

  function makeOptions(existing) {
    const next = Object.assign({}, DEFAULT_OPTIONS, existing || {});
    if (!OPTION_DECADE_FILTERS.some((filter) => filter.value === next.decadeFilter)) {
      next.decadeFilter = DEFAULT_OPTIONS.decadeFilter;
    }
    next.hideHints = Boolean(next.hideHints);
    return next;
  }

  function filterQuestions(questions, options) {
    const normalized = makeOptions(options);
    const filtered = questions.filter((question) => questionMatchesDecade(question, normalized.decadeFilter));
    return filtered.length ? filtered : questions;
  }

  function questionMatchesDecade(question, filterValue) {
    const filter = OPTION_DECADE_FILTERS.find((item) => item.value === filterValue) || OPTION_DECADE_FILTERS[0];
    if (!filter.sinceYear) return true;
    return (question.wins || []).some((win) => Number(win.year) >= filter.sinceYear);
  }

  const api = {
    OPTION_DECADE_FILTERS,
    makeOptions,
    filterQuestions,
    questionMatchesDecade
  };

  root.RHW = Object.assign(root.RHW || {}, api);
  if (typeof module !== "undefined") {
    module.exports = api;
  }
})(typeof globalThis !== "undefined" ? globalThis : window);
