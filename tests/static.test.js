const assert = require("node:assert");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const indexHtml = fs.readFileSync(path.join(root, "index.html"), "utf8");
const layoutCss = fs.readFileSync(path.join(root, "styles", "layout.css"), "utf8");
const wordleCss = fs.readFileSync(path.join(root, "styles", "wordle.css"), "utf8");
const packageJson = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"));
const sourceFiles = fs.readdirSync(path.join(root, "src"))
  .filter((file) => file.endsWith(".js"))
  .map((file) => fs.readFileSync(path.join(root, "src", file), "utf8"));
const sourceText = sourceFiles.join("\n");

assert.ok(indexHtml.includes("data/questions.embedded.js"), "embedded data script is required for file:// use");
assert.ok(indexHtml.includes("src/kana-input.js"), "kana input helper is loaded for dakuten and handakuten keys");
assert.ok(indexHtml.includes("native-input"), "native input is present for IME text entry");
assert.ok(indexHtml.includes("キーボードで直接入力できます"), "native input guidance replaces the waiting placeholder");
assert.ok(indexHtml.includes("sire-hint-button"), "sire reveal hint button is present");
assert.ok(indexHtml.includes("confirm-next-modal"), "next-question confirmation dialog is present");
assert.ok(indexHtml.includes("本当にリセットしますか？"), "next-question confirmation copy is present");
assert.ok(indexHtml.includes("history-tabs"), "history tabs are present for switching horse/sire/dam evaluations");
assert.ok(indexHtml.includes("data-history-target=\"sire\""), "sire history tab is present");
assert.ok(indexHtml.includes("data-history-target=\"dam\""), "dam history tab is present");
assert.ok(indexHtml.includes("id=\"sire-board\""), "fixed sire display remains below the input");
assert.ok(indexHtml.includes("id=\"dam-board\""), "fixed dam display remains below the input");
assert.ok(!/type=["']module["']/.test(indexHtml), "module scripts are avoided for direct file opening");
assert.ok(!/https?:\/\//.test(indexHtml), "index.html must not depend on CDN assets");
assert.ok(!/data-target=/.test(indexHtml), "target tabs are removed for unified input");
assert.ok(indexHtml.includes("0/18文字 / 0/15"), "unified input shows the 18 character capacity");
assert.ok(!indexHtml.includes("5回"), "horse-only five attempt copy should not remain");
assert.ok(!indexHtml.includes("青 / 水色"), "sire-specific color copy should not remain");
assert.ok(!indexHtml.includes("桃 / 薄桃"), "dam-specific color copy should not remain");
assert.ok(indexHtml.includes("別の問題を出題"), "refresh button is available");
assert.ok(!sourceText.includes("父と母は正解後"), "fixed pedigree explanation copy should not remain");
assert.ok(!sourceText.includes('addEventListener("click", nextQuestion)'), "next question click must not pass MouseEvent as a toast message");
assert.ok(sourceText.includes("[\"ワ\", \"ラ\", \"ヤ\", \"マ\", \"ハ\", \"ナ\", \"タ\", \"サ\", \"カ\", \"ア\"]"), "keyboard top row is traditional right-to-left gojuon order");
assert.ok(sourceText.includes("使用できない文字が含まれています"), "invalid IME input warning is present");
assert.ok(sourceText.includes("forfeitRound"), "refresh button should forfeit and reveal the current answer");
assert.ok(sourceText.includes("履歴リセット"), "stats panel includes a history reset button");
assert.ok(sourceText.includes("absent-known"), "keyboard can mark globally absent letters");
assert.ok(sourceText.includes("HORSE_BOARD_COLS = 9"), "horse board uses nine fixed boxes for the Japanese edition");
assert.ok(sourceText.includes("PEDIGREE_BOARD_COLS = 18"), "sire and dam boards use eighteen fixed boxes");
assert.ok(sourceText.includes("openNextConfirm"), "next-question button opens confirmation dialog");
assert.ok(sourceText.includes("closeNextConfirm"), "confirmation dialog can be closed before or after reset");
assert.ok(!indexHtml.includes("race-wins.audit.json"), "public page must not reference audit JSON");
assert.ok(!fs.existsSync(path.join(root, "README.md")), "README.md should be removed for this release prep");
assert.strictEqual(packageJson.scripts.check, "npm test && npm run validate:data", "release check script should run tests and data validation");
assert.ok(!layoutCss.includes(".target-tabs"), "unused target tab styles should not remain");
assert.ok(!layoutCss.includes(".reveal-line"), "unused reveal line styles should not remain");
assert.ok(!layoutCss.includes(".section-heading strong"), "unused section heading strong styles should not remain");
assert.ok(!layoutCss.includes(".legend-panel .legend-note"), "unused legend note styles should not remain");
assert.ok(!wordleCss.includes(".tile-row.reserved"), "unused reserved row styles should not remain");

for (const source of sourceFiles) {
  assert.ok(!/\bfetch\s*\(/.test(source), "runtime source must not fetch local JSON for file:// support");
}
