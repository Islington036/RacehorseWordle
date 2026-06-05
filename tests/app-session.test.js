const assert = require("node:assert");

global.RHW = {};
require("../src/config.js");
require("../src/normalize.js");
require("../src/evaluator.js");
require("../src/options.js");
require("../src/question-picker.js");
require("../src/game-state.js");
const session = require("../src/app-session.js");

const questions = [
  {
    id: "old",
    nameJa: "オールド",
    nameKana: "オールド",
    sire: { nameJa: "サイアー", aliases: [] },
    dam: { nameJa: "ダム", aliases: [] },
    wins: [{ year: 1995, raceNameJa: "テストG1" }]
  },
  {
    id: "new",
    nameJa: "ニュー",
    nameKana: "ニュー",
    sire: { nameJa: "ニュースター", aliases: [] },
    dam: { nameJa: "ニューダム", aliases: [] },
    wins: [{ year: 2024, raceNameJa: "テストG1" }]
  }
];

assert.deepStrictEqual(session.makeRecentQuestionIds(["old", "new"], "old"), ["old", "new"]);

const restoredState = session.createInitialState(questions, {
  stats: { rounds: [] },
  options: { decadeFilter: "2020" },
  round: {
    schemaVersion: 2,
    questionId: "old",
    status: "playing",
    attemptsUsed: 1,
    targets: {
      horse: { solved: false, guesses: [] },
      sire: { solved: false, guesses: [] },
      dam: { solved: false, guesses: [] }
    }
  }
});
assert.strictEqual(restoredState.question.id, "new", "restored question outside the active filter should be replaced");
assert.strictEqual(restoredState.options.decadeFilter, "2020");

const next = session.pickNextQuestion(restoredState, questions);
assert.strictEqual(next.question.id, "new", "single filtered question can repeat when it is the only valid question");
