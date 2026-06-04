const assert = require("node:assert");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const indexHtml = fs.readFileSync(path.join(root, "index.html"), "utf8");
const layoutCss = fs.readFileSync(path.join(root, "styles", "layout.css"), "utf8");
const wordleCss = fs.readFileSync(path.join(root, "styles", "wordle.css"), "utf8");
const packageJson = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"));
const scriptPaths = Array.from(indexHtml.matchAll(/<script[^>]+src="([^"]+)"/g), (match) => match[1].split("?")[0]);
const shippedSourcePaths = scriptPaths.filter((file) => file.startsWith("src/"));
const sourceFiles = shippedSourcePaths.map((file) => fs.readFileSync(path.join(root, file), "utf8"));
const sourceText = sourceFiles.join("\n");
const orphanSources = listJsFiles(path.join(root, "src"))
  .map((file) => path.relative(root, file).split(path.sep).join("/"))
  .filter((file) => !shippedSourcePaths.includes(file));

function listJsFiles(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) return listJsFiles(file);
    return entry.name.endsWith(".js") ? [file] : [];
  });
}

function indexOfScript(file) {
  return scriptPaths.indexOf(file);
}

assert.ok(indexHtml.includes("data/questions.embedded.js"), "embedded data script is required for file:// use");
assert.ok(indexHtml.includes("src/kana-input.js"), "kana input helper is loaded for dakuten and handakuten keys");
assert.ok(indexHtml.includes("src/options.js"), "options helper is loaded before app bootstrap");
assert.ok(indexHtml.includes("src/ui/constants.js"), "UI constants are loaded explicitly");
assert.ok(indexHtml.includes("src/ui/renderers.js"), "UI renderers are loaded explicitly");
assert.ok(indexHtml.includes("src/ui/coordinator.js"), "UI coordinator is loaded explicitly");
assert.ok(indexOfScript("src/ui/constants.js") < indexOfScript("src/ui/renderers.js"), "UI constants load before renderers");
assert.ok(indexOfScript("src/ui/renderers.js") < indexOfScript("src/ui/coordinator.js"), "UI renderers load before UI coordinator");
assert.ok(indexOfScript("src/ui/coordinator.js") < indexOfScript("src/main.js"), "UI coordinator loads before app bootstrap");
assert.ok(indexOfScript("src/options.js") < indexOfScript("src/main.js"), "options helper loads before app bootstrap");
assert.ok(indexHtml.includes("native-input"), "native input is present for IME text entry");
assert.ok(indexHtml.includes("キーボードで直接入力できます"), "native input guidance replaces the waiting placeholder");
assert.ok(indexHtml.includes("sire-hint-button"), "sire reveal hint button is present");
assert.ok(indexHtml.includes("1回消費してヒントを表示"), "hint button explains that it consumes one attempt");
assert.ok(indexHtml.includes('class="hint-row" hidden'), "sire hint row should not reserve vertical space before it unlocks");
assert.ok(indexHtml.includes("options-button"), "top-left button opens options");
assert.ok(indexHtml.includes("オプションを表示"), "top-left button is labelled as options");
assert.ok(!indexHtml.includes("統計を表示"), "top-left stats label should be removed");
assert.ok(indexHtml.includes("⚙"), "top-left options button uses a gear icon");
assert.ok(indexHtml.includes("options-modal"), "options dialog is present");
assert.ok(indexHtml.includes("ヒントを表示しない"), "options dialog can hide hints");
assert.ok(indexHtml.includes("出題する競走馬の年代を制限"), "options dialog can limit question decades");
assert.ok(indexHtml.includes("制限なし"), "decade filter includes no-limit option");
assert.ok(indexHtml.includes("1990年代以降"), "decade filter includes 1990s option");
assert.ok(indexHtml.includes("2000年代以降"), "decade filter includes 2000s option");
assert.ok(indexHtml.includes("2010年代以降"), "decade filter includes 2010s option");
assert.ok(indexHtml.includes("2020年代以降"), "decade filter includes 2020s option");
assert.ok(indexHtml.includes("confirm-reset-modal"), "reset confirmation dialog is present");
assert.ok(indexHtml.includes("本当にリセットしますか？"), "reset confirmation copy is present");
assert.ok(indexHtml.includes("現在の問題を失敗扱い"), "reset confirmation explains forfeit behavior");
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
assert.ok(indexHtml.includes("履歴リセット"), "options dialog includes a history reset button");
assert.ok(!sourceText.includes('id="clear-history"'), "history reset should not be rendered inside the stats panel");
assert.ok(sourceText.includes("absent-known"), "keyboard can mark globally absent letters");
assert.ok(sourceText.includes("horseBoardCols: 9"), "horse board uses nine fixed boxes for the Japanese edition");
assert.ok(sourceText.includes("pedigreeBoardCols: 18"), "sire and dam boards use eighteen fixed boxes");
assert.ok(sourceText.includes("showInput: false"), "top history board should only render submitted guesses");
assert.ok(sourceText.includes("minRows: 0"), "top history board should not render empty placeholder rows");
assert.ok(sourceText.includes("padRows: false"), "top history board should not pad submitted guesses with empty boxes");
assert.ok(sourceText.includes("openResetConfirm"), "topbar reset opens a confirmation dialog before forfeit");
assert.ok(sourceText.includes("openOptionsModal"), "top-left button opens the options dialog");
assert.ok(sourceText.includes("filterQuestions"), "question list can be filtered by option settings");
assert.ok(sourceText.includes("rhw:options:v1"), "options are persisted in localStorage");
assert.ok(sourceText.includes("closeResetConfirm"), "reset confirmation dialog can be closed before or after reset");
assert.ok(!sourceText.includes("openNextConfirm"), "result next-question confirmation must not remain");
assert.ok(sourceText.includes('"#reset-button").addEventListener("click", () => RHW.ui.openResetConfirm())'), "topbar reset should ask before forfeiting");
assert.ok(sourceText.includes('"#next-question").addEventListener("click", () => nextQuestion())'), "result next button should move directly to the next question");
assert.ok(sourceText.includes('"#confirm-reset-question").addEventListener("click", () =>'), "reset confirm button should own the forfeit path");
assert.ok(!indexHtml.includes("race-wins.audit.json"), "public page must not reference audit JSON");
assert.ok(!fs.existsSync(path.join(root, "README.md")), "README.md should be removed for this release prep");
assert.strictEqual(packageJson.scripts.check, "npm test && npm run validate:data", "release check script should run tests and data validation");
assert.ok(!layoutCss.includes(".target-tabs"), "unused target tab styles should not remain");
assert.ok(!layoutCss.includes(".reveal-line"), "unused reveal line styles should not remain");
assert.ok(!layoutCss.includes(".section-heading strong"), "unused section heading strong styles should not remain");
assert.ok(!layoutCss.includes(".legend-panel .legend-note"), "unused legend note styles should not remain");
assert.ok(layoutCss.includes(".hint-row[hidden]"), "hidden sire hint row should not reserve vertical space");
assert.ok(wordleCss.includes("align-content: start"), "history rows should stay packed at the top of fixed-height boards");
assert.ok(wordleCss.includes("grid-auto-rows: max-content"), "history rows should not stretch apart when fewer than five rows exist");
assert.ok(!wordleCss.includes(".tile-row.reserved"), "unused reserved row styles should not remain");
assert.deepStrictEqual(orphanSources, [], "all runtime src files should be loaded by index.html");

for (const source of sourceFiles) {
  assert.ok(!/\bfetch\s*\(/.test(source), "runtime source must not fetch local JSON for file:// support");
}
