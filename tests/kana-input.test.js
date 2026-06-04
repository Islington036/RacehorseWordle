const assert = require("node:assert");
const { transformLastKana, normalizeTypedKana, isUsableKanaInput } = require("../src/kana-input.js");

assert.strictEqual(transformLastKana("カ", "゛"), "ガ");
assert.strictEqual(transformLastKana("ハ", "゜"), "パ");
assert.strictEqual(transformLastKana("ツ", "小"), "ッ");
assert.strictEqual(transformLastKana("アカ", "゛"), "アガ");
assert.strictEqual(transformLastKana("", "゛"), "");
assert.strictEqual(transformLastKana("ン", "゛"), "ン");

assert.strictEqual(normalizeTypedKana("ｶﾀｶﾅｰ"), "カタカナー");
assert.strictEqual(isUsableKanaInput("カタカナー"), true);
assert.strictEqual(isUsableKanaInput("ｶﾀｶﾅｰ"), true);
assert.strictEqual(isUsableKanaInput("かな"), false);
assert.strictEqual(isUsableKanaInput("ABC"), false);
