const assert = require("node:assert");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const questions = JSON.parse(fs.readFileSync(path.join(root, "data", "questions.json"), "utf8"));
const audit = JSON.parse(fs.readFileSync(path.join(root, "data", "race-wins.audit.json"), "utf8"));

function isOldNarOnlyQuestion(horse) {
  const wins = horse?.wins || [];
  return wins.length > 0 && wins.every((win) => win.jurisdiction === "NAR" && Number(win.year) <= 2000);
}

const playableOldNarOnly = questions.horses.filter(isOldNarOnlyQuestion);
assert.deepStrictEqual(playableOldNarOnly.map((horse) => horse.nameJa), []);

const auditedOldNarOnly = audit.excludedQuestions.filter((item) => item.excludedReason === "only NAR top-level wins in 2000 or earlier");
assert.ok(auditedOldNarOnly.length > 0, "old NAR-only exclusions should remain in the audit log");
assert.strictEqual(audit.meta.excludedQuestionCountForOldNarOnly, auditedOldNarOnly.length);
