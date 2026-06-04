const assert = require("node:assert");
const { transformLastKana } = require("../src/kana-input.js");

assert.strictEqual(transformLastKana("カ", "゛"), "ガ");
assert.strictEqual(transformLastKana("ハ", "゜"), "パ");
assert.strictEqual(transformLastKana("ツ", "小"), "ッ");
assert.strictEqual(transformLastKana("アカ", "゛"), "アガ");
assert.strictEqual(transformLastKana("", "゛"), "");
assert.strictEqual(transformLastKana("ン", "゛"), "ン");
