const assert = require("node:assert");
const { normalizeName, splitAnswer, displayLength } = require("../src/normalize.js");

assert.strictEqual(normalizeName(" Sunday Silence "), "SUNDAYSILENCE");
assert.strictEqual(normalizeName("サンデー・サイレンス"), "サンデーサイレンス");
assert.strictEqual(normalizeName("ｱｰﾓﾝﾄﾞ ｱｲ"), "アーモンドアイ");
assert.deepStrictEqual(splitAnswer("ドウデュース"), ["ド", "ウ", "デ", "ュ", "ー", "ス"]);
assert.strictEqual(displayLength("ドウデュース"), 6);
