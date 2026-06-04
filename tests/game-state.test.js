const assert = require("node:assert");
global.RHW = Object.assign(
  {},
  require("../src/normalize.js"),
  require("../src/evaluator.js")
);
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
assert.strictEqual(game.validateGuess(round, question, "sire", "短い").ok, false);

let result = game.submitGuess(round, question, "sire", "テストサイアー");
round = result.round;
assert.strictEqual(result.correct, true);
assert.strictEqual(round.targets.sire.solved, true);
assert.strictEqual(round.pedigreeAttemptsUsed, 1);

round.activeTarget = "horse";
result = game.submitGuess(round, question, "horse", "テストホース");
round = result.round;
assert.strictEqual(round.status, "won");

let stats = game.makeStats();
const recorded = game.recordResult(stats, round, question);
stats = recorded.stats;
round = recorded.round;
assert.strictEqual(stats.rounds.length, 1);
assert.strictEqual(game.recordResult(stats, round, question).stats.rounds.length, 1);

let failed = game.makeRound(question);
failed.activeTarget = "dam";
for (let i = 0; i < 15; i += 1) {
  failed = game.submitGuess(failed, question, "dam", "アイウエオ").round;
}
assert.strictEqual(failed.pedigreeRevealed, true);
