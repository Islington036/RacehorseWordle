#!/usr/bin/env node
/* eslint-disable no-console */

const fs = require("node:fs");
const path = require("node:path");
const { normalizeName } = require("../src/normalize.js");

const file = path.resolve(__dirname, "..", "data", "questions.json");
const data = JSON.parse(fs.readFileSync(file, "utf8"));
const errors = [];
const warnings = [];
const horseKeys = new Set();
const MAX_INPUT_LENGTH = 18;
const INPUTABLE_KATAKANA = /^[ァ-ヶー]+$/u;

if (!data.meta || data.meta.schemaVersion !== 1) {
  errors.push("meta.schemaVersion must be 1");
}

if (!Array.isArray(data.horses) || data.horses.length === 0) {
  errors.push("horses must be a non-empty array");
}

for (const horse of data.horses || []) {
  const key = normalizeName(horse.nameJa);
  if (!horse.id) errors.push(`${horse.nameJa}: id is missing`);
  if (!horse.nameJa) errors.push(`${horse.id}: nameJa is missing`);
  if (horseKeys.has(key)) errors.push(`${horse.nameJa}: duplicate normalized horse name`);
  horseKeys.add(key);
  if (!horse.sire?.nameJa) errors.push(`${horse.nameJa}: sire.nameJa is missing`);
  if (!horse.dam?.nameJa) errors.push(`${horse.nameJa}: dam.nameJa is missing`);
  if (!Array.isArray(horse.wins) || horse.wins.length === 0) errors.push(`${horse.nameJa}: wins are missing`);

  for (const target of [horse.nameJa, horse.sire?.nameJa, horse.dam?.nameJa]) {
    const normalizedTarget = normalizeName(target);
    if (normalizedTarget.length === 0) errors.push(`${horse.nameJa}: empty normalized target`);
    if (!INPUTABLE_KATAKANA.test(normalizedTarget)) errors.push(`${horse.nameJa}: target '${target}' contains unsupported input characters`);
    if (Array.from(normalizedTarget).length > MAX_INPUT_LENGTH) errors.push(`${horse.nameJa}: target '${target}' exceeds ${MAX_INPUT_LENGTH} characters`);
  }

  for (const win of horse.wins || []) {
    if (!win.date || win.date > "2026-06-04") errors.push(`${horse.nameJa}: invalid win date ${win.date}`);
    if (!/^(GI|G1|GⅠ|JpnI|Jpn1|JpnⅠ)$/.test(win.gradeAtRun)) errors.push(`${horse.nameJa}: invalid grade ${win.gradeAtRun}`);
    if (/J・/.test(win.gradeAtRun)) errors.push(`${horse.nameJa}: J-GI must be excluded`);
  }
}

if (errors.length) {
  console.error("Data validation failed:");
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}

warnings.forEach((warning) => console.warn(`Warning: ${warning}`));
console.log(`Data validation passed: ${data.horses.length} horses.`);
