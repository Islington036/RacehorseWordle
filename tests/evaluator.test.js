const assert = require("node:assert");
global.RHW = require("../src/normalize.js");
const { scoreGuess, isCorrectGuess } = require("../src/evaluator.js");

assert.strictEqual(isCorrectGuess("ドウデュース", "ドウデュース"), true);
assert.strictEqual(isCorrectGuess(" ドウ デュース ", "ドウデュース"), true);
assert.strictEqual(isCorrectGuess("ドウデュス", "ドウデュース"), false);

const longVowel = scoreGuess("ドウデュース", "ドウデュース").map((item) => item.state);
assert.deepStrictEqual(longVowel, ["correct", "correct", "correct", "correct", "correct", "correct"]);

const duplicate = scoreGuess("アアア", "アカア").map((item) => item.state);
assert.deepStrictEqual(duplicate, ["correct", "absent", "correct"]);

const present = scoreGuess("カアア", "アカア").map((item) => item.state);
assert.deepStrictEqual(present, ["present", "present", "correct"]);
