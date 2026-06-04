const assert = require("node:assert");
const { pickQuestion } = require("../src/question-picker.js");

const questions = [
  { id: "first" },
  { id: "second" }
];

assert.notStrictEqual(
  pickQuestion(questions, { rounds: [] }, "first").id,
  "first"
);
