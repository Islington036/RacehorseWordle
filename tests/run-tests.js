#!/usr/bin/env node
const fs = require("node:fs");
const path = require("node:path");

const testFiles = fs.readdirSync(__dirname)
  .filter((file) => file.endsWith(".test.js"))
  .sort();

let passed = 0;
for (const file of testFiles) {
  require(path.join(__dirname, file));
  passed += 1;
}

console.log(`All tests passed (${passed} files).`);
