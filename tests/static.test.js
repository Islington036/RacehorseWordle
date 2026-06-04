const assert = require("node:assert");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const indexHtml = fs.readFileSync(path.join(root, "index.html"), "utf8");
const sourceFiles = fs.readdirSync(path.join(root, "src"))
  .filter((file) => file.endsWith(".js"))
  .map((file) => fs.readFileSync(path.join(root, "src", file), "utf8"));

assert.ok(indexHtml.includes("data/questions.embedded.js"), "embedded data script is required for file:// use");
assert.ok(!/type=["']module["']/.test(indexHtml), "module scripts are avoided for direct file opening");
assert.ok(!/https?:\/\//.test(indexHtml), "index.html must not depend on CDN assets");
assert.ok(!/data-target=/.test(indexHtml), "target tabs are removed for unified input");
assert.ok(indexHtml.includes("0/18文字 / 0/15"), "unified input shows the 18 character capacity");
assert.ok(!indexHtml.includes("5回"), "horse-only five attempt copy should not remain");
assert.ok(indexHtml.includes("別の問題を出題"), "refresh button starts a different question");

for (const source of sourceFiles) {
  assert.ok(!/\bfetch\s*\(/.test(source), "runtime source must not fetch local JSON for file:// support");
}
