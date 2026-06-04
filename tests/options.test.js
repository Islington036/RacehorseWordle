const assert = require("node:assert");
const {
  OPTION_DECADE_FILTERS,
  filterQuestions,
  makeOptions,
  questionMatchesDecade
} = require("../src/options.js");

const questions = [
  { id: "nineties", wins: [{ year: 1995 }] },
  { id: "zeroes", wins: [{ year: 2003 }] },
  { id: "tens", wins: [{ year: 2012 }] },
  { id: "twenties", wins: [{ year: 2024 }] }
];

assert.deepStrictEqual(
  OPTION_DECADE_FILTERS.map((filter) => filter.label),
  ["制限なし", "1990年代以降", "2000年代以降", "2010年代以降", "2020年代以降"]
);

assert.deepStrictEqual(makeOptions({ hideHints: true, decadeFilter: "2020" }), {
  schemaVersion: 1,
  hideHints: true,
  decadeFilter: "2020"
});

assert.strictEqual(makeOptions({ decadeFilter: "future" }).decadeFilter, "all");
assert.strictEqual(questionMatchesDecade(questions[0], "2000"), false);
assert.strictEqual(questionMatchesDecade(questions[1], "2000"), true);

assert.deepStrictEqual(
  filterQuestions(questions, { decadeFilter: "2010" }).map((question) => question.id),
  ["tens", "twenties"]
);

assert.deepStrictEqual(
  filterQuestions(questions, { decadeFilter: "2020" }).map((question) => question.id),
  ["twenties"]
);
