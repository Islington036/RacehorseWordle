const assert = require("node:assert");
const { normalizeName, splitAnswer } = require("../src/normalize.js");

assert.strictEqual(normalizeName(" Sunday Silence "), "SUNDAYSILENCE");
assert.strictEqual(normalizeName("サンデー・サイレンス"), "サンデサイレンス");
assert.strictEqual(normalizeName("ｱｰﾓﾝﾄﾞ ｱｲ"), "アモンドアイ");
assert.deepStrictEqual(splitAnswer("ドウデュース"), ["ド", "ウ", "デ", "ュ", "ス"]);
