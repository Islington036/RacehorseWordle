const assert = require("node:assert");
const { pickQuestion } = require("../src/question-picker.js");

const questions = [
  { id: "first" },
  { id: "second" },
  { id: "third" },
  { id: "fourth" }
];

assert.notStrictEqual(
  pickQuestion(questions, { rounds: [] }, "first", { random: () => 0 }).id,
  "first"
);

assert.strictEqual(
  pickQuestion(questions, { rounds: [] }, "first", {
    recentQuestionIds: ["first", "second"],
    random: () => 0
  }).id,
  "third"
);

const sequence = [];
for (let index = 0; index < 4; index += 1) {
  sequence.push(pickQuestion(questions, { rounds: [] }, "first", { random: () => index / 4 }).id);
}
assert.deepStrictEqual(new Set(sequence), new Set(["second", "third", "fourth"]));

assert.strictEqual(
  pickQuestion([{ id: "only" }], { rounds: [] }, "only", { random: () => 0 }).id,
  "only"
);
