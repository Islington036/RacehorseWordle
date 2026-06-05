const assert = require("node:assert");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const questionsPath = path.join(root, "data", "questions.json");
const embeddedPath = path.join(root, "data", "questions.embedded.js");
const questionsText = fs.readFileSync(questionsPath, "utf8");
const embeddedText = fs.readFileSync(embeddedPath, "utf8");
const questions = JSON.parse(questionsText);
const embeddedQuestions = JSON.parse(embeddedText.replace(/^window\.RHW_QUESTIONS = /, ""));

function isOldNarOnlyQuestion(horse) {
  const wins = horse?.wins || [];
  return wins.length > 0 && wins.every((win) => win.jurisdiction === "NAR" && Number(win.year) <= 2000);
}

const playableOldNarOnly = questions.horses.filter(isOldNarOnlyQuestion);
assert.deepStrictEqual(playableOldNarOnly.map((horse) => horse.nameJa), []);

assert.ok(questions.meta.excludedQuestionCountForOldNarOnly > 0, "old NAR-only exclusions should remain summarized in public metadata");
assert.deepStrictEqual(embeddedQuestions, questions, "embedded data should exactly match public JSON");
assert.strictEqual(questions.meta.questionCount, questions.horses.length, "metadata question count should match horse list length");
assert.ok(!questionsText.includes("sourceUrls"), "public questions JSON must not expose sourceUrls");
assert.ok(!embeddedText.includes("sourceUrls"), "embedded data must not expose sourceUrls");
assert.ok(!/https?:\/\//.test(questionsText), "public questions JSON must not expose source URLs");
assert.ok(!/https?:\/\//.test(embeddedText), "embedded data must not expose source URLs");

for (const horse of questions.horses) {
  for (const win of horse.wins || []) {
    assert.ok(!/^第[0-9０-９]+回$/.test(win.course || ""), `${horse.nameJa}: course should be venue, not race edition`);
  }
}
