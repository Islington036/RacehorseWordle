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
  ["correct", "correct", "correct", "correct", "correct", "correct", "correct"]
);

result = game.submitGuess(round, question, "テストダム");
round = result.round;
assert.strictEqual(round.targets.dam.solved, true);
assert.deepStrictEqual(
  round.targets.dam.guesses[1].evaluation.map((item) => item.state),
  ["correct", "correct", "correct", "correct", "correct"]
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

let fixedPedigree = game.makeRound(question);
fixedPedigree = game.submitGuess(fixedPedigree, question, "テストサイアー").round;
fixedPedigree = game.submitGuess(fixedPedigree, question, "アイウエオ").round;
assert.strictEqual(fixedPedigree.targets.sire.guesses.length, 2);
assert.strictEqual(fixedPedigree.targets.sire.guesses[0].correct, true);
assert.strictEqual(fixedPedigree.targets.sire.guesses[1].value, "アイウエオ");
assert.strictEqual(fixedPedigree.targets.horse.guesses.length, 2);

const restoredTarget = game.makeRound(question, { historyTarget: "dam" });
assert.strictEqual(restoredTarget.historyTarget, "dam");
const invalidRestoredTarget = game.makeRound(question, { historyTarget: "owner" });
assert.strictEqual(invalidRestoredTarget.historyTarget, "horse");

const corruptRound = game.makeRound(question, {
  schemaVersion: 2,
  status: "playing",
  attemptsUsed: "not-a-number",
  targets: {
    horse: { solved: "yes", guesses: [{ value: "アイ", evaluation: [{ char: "<", state: "script" }] }] },
    sire: { guesses: "broken" },
    dam: null
  }
});
assert.strictEqual(corruptRound.attemptsUsed, 1);
assert.strictEqual(corruptRound.targets.horse.guesses[0].evaluation[0].state, "absent");
assert.deepStrictEqual(corruptRound.targets.sire.guesses, []);
assert.deepStrictEqual(corruptRound.targets.dam.guesses, []);

const corruptStats = game.makeStats({
  rounds: [{
    horseName: "<img src=x onerror=alert(1)>",
    attemptsUsed: "<script>",
    status: "maybe"
  }]
});
assert.strictEqual(corruptStats.rounds[0].status, "lost");
assert.strictEqual(corruptStats.rounds[0].attemptsUsed, 0);
assert.strictEqual(game.summarizeStats({ rounds: "broken" }).total, 0);

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
assert.strictEqual(game.canRestoreRound(failed), false);
assert.strictEqual(game.submitGuess(failed, question, "テストホース").accepted, false);

let lateWin = game.makeRound(question);
for (let i = 0; i < 14; i += 1) {
  lateWin = game.submitGuess(lateWin, question, "アイウエオ").round;
}
lateWin = game.submitGuess(lateWin, question, "テストホース").round;
assert.strictEqual(lateWin.status, "won");
assert.strictEqual(lateWin.attemptsUsed, 15);
assert.strictEqual(game.canRestoreRound(lateWin), false);

let restorable = game.makeRound(question);
for (let i = 0; i < 14; i += 1) {
  restorable = game.submitGuess(restorable, question, "アイウエオ").round;
}
assert.strictEqual(game.canRestoreRound(restorable), true);
assert.strictEqual(game.canRestoreRound({ ...restorable, attemptsUsed: 15 }), false);
assert.strictEqual(game.canRestoreRound({ ...restorable, status: "lost" }), false);
assert.strictEqual(game.canRestoreRound({ ...restorable, status: "won" }), false);
assert.strictEqual(game.canRestoreRound({ ...restorable, schemaVersion: 1 }), false);

let hintRound = game.makeRound(question);
for (let i = 0; i < 8; i += 1) {
  hintRound = game.submitGuess(hintRound, question, "アイウエオ").round;
}
assert.strictEqual(game.canUseSireHint(hintRound), false);
hintRound = game.submitGuess(hintRound, question, "カキクケコ").round;
assert.strictEqual(game.canUseSireHint(hintRound), true);
hintRound.sireHintUsed = true;
assert.strictEqual(game.canUseSireHint(hintRound), false);

let forfeited = game.makeRound(question);
forfeited = game.submitGuess(forfeited, question, "アイウエオ").round;
forfeited = game.forfeitRound(forfeited);
assert.strictEqual(forfeited.status, "lost");
assert.strictEqual(forfeited.attemptsUsed, 1);
assert.strictEqual(forfeited.forfeited, true);
const forfeitStats = game.recordResult(game.makeStats(), forfeited, question).stats;
assert.strictEqual(forfeitStats.rounds.length, 1);
assert.strictEqual(forfeitStats.rounds[0].status, "lost");
assert.strictEqual(forfeitStats.rounds[0].forfeited, true);
