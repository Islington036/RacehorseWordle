const assert = require("node:assert");

global.RHW = {};
require("../src/config.js");
require("../src/normalize.js");
require("../src/evaluator.js");
const game = require("../src/game-state.js");

const question = {
  id: "test",
  nameJa: "テストホース",
  nameKana: "テストホース",
  nameEn: "Test Horse",
  sire: { nameJa: "テストサイアー", aliases: [] },
  dam: { nameJa: "テストダム", aliases: [] },
  wins: [{ year: 2020, raceNameJa: "テストG1" }]
};

let round = game.makeRound(question);
assert.strictEqual(game.validateGuess(round, question, "").ok, false);
assert.strictEqual(game.validateGuess(round, question, "アイウエオカキクケコサシスセソタチツテト").ok, false);

let result = game.submitGuess(round, question, "テストサイアー");
round = result.round;
assert.strictEqual(result.accepted, true);
assert.strictEqual(result.correct, false);
assert.strictEqual(round.targets.sire.solved, true);
assert.strictEqual(round.targets.horse.solved, false);
assert.strictEqual(round.attemptsUsed, 1);
assert.deepStrictEqual(
  round.targets.sire.guesses[0].evaluation.map((item) => item.state),
  ["sire-correct", "sire-correct", "sire-correct", "sire-correct", "sire-correct", "sire-correct", "sire-correct"]
);

result = game.submitGuess(round, question, "テストダム");
round = result.round;
assert.strictEqual(round.targets.dam.solved, true);
assert.deepStrictEqual(
  round.targets.dam.guesses[1].evaluation.map((item) => item.state),
  ["dam-correct", "dam-correct", "dam-correct", "dam-correct", "dam-correct"]
);

result = game.submitGuess(round, question, "テストホース");
round = result.round;
assert.strictEqual(round.status, "won");
assert.strictEqual(round.targets.horse.solved, true);
assert.strictEqual(round.attemptsUsed, 3);

let stats = game.makeStats();
const recorded = game.recordResult(stats, round, question);
stats = recorded.stats;
round = recorded.round;
assert.strictEqual(stats.rounds.length, 1);
assert.strictEqual(stats.rounds[0].attemptsUsed, 3);
assert.strictEqual(game.recordResult(stats, round, question).stats.rounds.length, 1);

let failed = game.makeRound(question);
for (let i = 0; i < 14; i += 1) {
  failed = game.submitGuess(failed, question, "アイウエオ").round;
}
assert.strictEqual(failed.status, "playing");
assert.strictEqual(failed.attemptsUsed, 14);

failed = game.submitGuess(failed, question, "カキクケコ").round;
assert.strictEqual(failed.status, "lost");
assert.strictEqual(failed.attemptsUsed, 15);
assert.strictEqual(game.canSubmit(failed), false);
assert.strictEqual(game.submitGuess(failed, question, "テストホース").accepted, false);

let lateWin = game.makeRound(question);
for (let i = 0; i < 14; i += 1) {
  lateWin = game.submitGuess(lateWin, question, "アイウエオ").round;
}
lateWin = game.submitGuess(lateWin, question, "テストホース").round;
assert.strictEqual(lateWin.status, "won");
assert.strictEqual(lateWin.attemptsUsed, 15);
