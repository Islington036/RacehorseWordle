#!/usr/bin/env node
/* eslint-disable no-console */

const fs = require("node:fs/promises");
const path = require("node:path");

const ROOT = path.resolve(__dirname, "..");
const CACHE_DIR = path.join(ROOT, ".cache", "sources");
const OUT_QUESTIONS = path.join(ROOT, "data", "questions.json");
const OUT_EMBEDDED = path.join(ROOT, "data", "questions.embedded.js");
const OUT_AUDIT = path.join(ROOT, "data", "race-wins.audit.json");

const FROM_YEAR = 1990;
const CUTOFF = new Date("2026-06-04T23:59:59+09:00");

const JRA_RACES = [
  { id: "jra:feb", slug: "feb", raceNameJa: "フェブラリーステークス", fromYear: 1997, course: "東京", surface: "dirt", distanceM: 1600 },
  { id: "jra:takamatsu", slug: "takamatsu", raceNameJa: "高松宮記念", fromYear: 1996, course: "中京", surface: "turf", distanceM: 1200 },
  { id: "jra:osaka", slug: "osaka", raceNameJa: "大阪杯", fromYear: 2017, course: "阪神", surface: "turf", distanceM: 2000 },
  { id: "jra:ouka", slug: "ouka", raceNameJa: "桜花賞", fromYear: 1990, course: "阪神", surface: "turf", distanceM: 1600 },
  { id: "jra:satsuki", slug: "satsuki", raceNameJa: "皐月賞", fromYear: 1990, course: "中山", surface: "turf", distanceM: 2000 },
  { id: "jra:haruten", slug: "haruten", raceNameJa: "天皇賞（春）", fromYear: 1990, course: "京都", surface: "turf", distanceM: 3200 },
  { id: "jra:nmc", slug: "nmc", raceNameJa: "NHKマイルカップ", fromYear: 1996, course: "東京", surface: "turf", distanceM: 1600 },
  { id: "jra:victoria", slug: "victoria", raceNameJa: "ヴィクトリアマイル", fromYear: 2006, course: "東京", surface: "turf", distanceM: 1600 },
  { id: "jra:oaks", slug: "oaks", raceNameJa: "優駿牝馬", fromYear: 1990, course: "東京", surface: "turf", distanceM: 2400 },
  { id: "jra:derby", slug: "derby", raceNameJa: "東京優駿", fromYear: 1990, course: "東京", surface: "turf", distanceM: 2400 },
  { id: "jra:yasuda", slug: "yasuda", raceNameJa: "安田記念", fromYear: 1990, course: "東京", surface: "turf", distanceM: 1600 },
  { id: "jra:takara", slug: "takara", raceNameJa: "宝塚記念", fromYear: 1990, course: "阪神", surface: "turf", distanceM: 2200 },
  { id: "jra:sprint", slug: "sprint", raceNameJa: "スプリンターズステークス", fromYear: 1990, course: "中山", surface: "turf", distanceM: 1200 },
  { id: "jra:shuka", slug: "shuka", raceNameJa: "秋華賞", fromYear: 1996, course: "京都", surface: "turf", distanceM: 2000 },
  { id: "jra:kikka", slug: "kikka", raceNameJa: "菊花賞", fromYear: 1990, course: "京都", surface: "turf", distanceM: 3000 },
  { id: "jra:akiten", slug: "akiten", raceNameJa: "天皇賞（秋）", fromYear: 1990, course: "東京", surface: "turf", distanceM: 2000 },
  { id: "jra:eliza", slug: "eliza", raceNameJa: "エリザベス女王杯", fromYear: 1990, course: "京都", surface: "turf", distanceM: 2200 },
  { id: "jra:mile", slug: "mile", raceNameJa: "マイルチャンピオンシップ", fromYear: 1990, course: "京都", surface: "turf", distanceM: 1600 },
  { id: "jra:jc", slug: "jc", raceNameJa: "ジャパンカップ", fromYear: 1990, course: "東京", surface: "turf", distanceM: 2400 },
  { id: "jra:jcd", slug: "jcd", raceNameJa: "チャンピオンズカップ", fromYear: 2000, course: "中京", surface: "dirt", distanceM: 1800 },
  { id: "jra:hjf", slug: "hjf", raceNameJa: "阪神ジュベナイルフィリーズ", fromYear: 1990, course: "阪神", surface: "turf", distanceM: 1600 },
  { id: "jra:afs", slug: "afs", raceNameJa: "朝日杯フューチュリティステークス", fromYear: 1990, course: "阪神", surface: "turf", distanceM: 1600 },
  { id: "jra:arima", slug: "arima", raceNameJa: "有馬記念", fromYear: 1990, course: "中山", surface: "turf", distanceM: 2500 },
  { id: "jra:hopeful", slug: "hopeful", raceNameJa: "ホープフルステークス", fromYear: 2017, course: "中山", surface: "turf", distanceM: 2000 }
];

const LOCAL_RACES = [
  { id: "nar:teiosho", title: "帝王賞", raceNameJa: "帝王賞", periods: [[1997, 2026]], course: "大井", distanceM: 2000 },
  { id: "nar:mcs-nambu", title: "マイルチャンピオンシップ南部杯", raceNameJa: "マイルチャンピオンシップ南部杯", periods: [[1997, 2026]], course: "盛岡", distanceM: 1600 },
  { id: "nar:tokyo-daishoten", title: "東京大賞典", raceNameJa: "東京大賞典", periods: [[1997, 2026]], course: "大井", distanceM: 2000 },
  { id: "nar:derby-grand-prix", title: "ダービーグランプリ", raceNameJa: "ダービーグランプリ", periods: [[1997, 2006]], course: "盛岡", distanceM: 2000 },
  { id: "nar:kawasaki-kinen", title: "川崎記念", raceNameJa: "川崎記念", periods: [[1998, 2026]], course: "川崎", distanceM: 2100 },
  { id: "nar:jdd", title: "ジャパンダートクラシック", raceNameJa: "ジャパンダートダービー/ジャパンダートクラシック", periods: [[1999, 2026]], course: "大井", distanceM: 2000 },
  { id: "nar:jbc-classic", title: "JBCクラシック", raceNameJa: "JBCクラシック", periods: [[2001, 2026]], course: "持ち回り", distanceM: 2000 },
  { id: "nar:jbc-sprint", title: "JBCスプリント", raceNameJa: "JBCスプリント", periods: [[2001, 2026]], course: "持ち回り", distanceM: 1200 },
  { id: "nar:zennihon-2sai", title: "全日本2歳優駿", raceNameJa: "全日本2歳優駿", periods: [[2002, 2026]], course: "川崎", distanceM: 1600 },
  { id: "nar:kashiwa", title: "かしわ記念", raceNameJa: "かしわ記念", periods: [[2005, 2026]], course: "船橋", distanceM: 1600 },
  { id: "nar:jbc-ladies", title: "JBCレディスクラシック", raceNameJa: "JBCレディスクラシック", periods: [[2013, 2026]], course: "持ち回り", distanceM: 1800 },
  { id: "nar:haneda", title: "羽田盃", raceNameJa: "羽田盃", periods: [[2024, 2026]], course: "大井", distanceM: 1800 },
  { id: "nar:tokyo-derby", title: "東京ダービー (競馬)", raceNameJa: "東京ダービー", periods: [[2024, 2026]], course: "大井", distanceM: 2000 },
  { id: "nar:sakitama", title: "さきたま杯", raceNameJa: "さきたま杯", periods: [[2024, 2026]], course: "浦和", distanceM: 1400 }
];

async function main() {
  await fs.mkdir(CACHE_DIR, { recursive: true });
  const audit = {
    meta: {
      schemaVersion: 1,
      definition: "domestic-flat-top-level-at-run-date",
      fromYear: FROM_YEAR,
      cutoff: "2026-06-04",
      generatedAt: new Date().toISOString(),
      expectedWinRecordRoughCount: 1020
    },
    wins: [],
    excluded: [],
    warnings: []
  };

  const wins = [];
  console.log("Collecting JRA GI wins...");
  for (const race of JRA_RACES) {
    const raceWins = await collectJraRace(race, audit);
    wins.push(...raceWins);
    console.log(`  ${race.raceNameJa}: ${raceWins.length}`);
  }

  console.log("Collecting local GI/JpnI wins from Wikipedia...");
  for (const race of LOCAL_RACES) {
    const raceWins = await collectLocalRace(race, audit);
    wins.push(...raceWins);
    console.log(`  ${race.raceNameJa}: ${raceWins.length}`);
  }

  const questions = buildQuestions(wins, audit);
  validateGeneratedQuestions(questions, audit);

  const output = {
    meta: {
      schemaVersion: 1,
      definition: "domestic-flat-top-level-at-run-date",
      fromYear: FROM_YEAR,
      generatedAt: new Date().toISOString().slice(0, 10),
      cutoff: "2026-06-04",
      sources: [
        "JRA official past GI results",
        "Japanese Wikipedia race tables",
        "Japanese Wikipedia racehorse infoboxes",
        "NAR dirt grade race schedule for scope checks"
      ],
      warning: "Review race-wins.audit.json before publishing; JBIS cross-check is recommended."
    },
    horses: questions
  };

  await fs.writeFile(OUT_QUESTIONS, `${JSON.stringify(output, null, 2)}\n`);
  await fs.writeFile(OUT_EMBEDDED, `window.RHW_QUESTIONS = ${JSON.stringify(output, null, 2)};\n`);
  await fs.writeFile(OUT_AUDIT, `${JSON.stringify(audit, null, 2)}\n`);
  console.log(`Generated ${questions.length} questions from ${wins.length} included wins.`);
  console.log(`Excluded ${audit.excluded.length}; warnings ${audit.warnings.length}.`);
}

async function collectJraRace(race, audit) {
  const indexUrl = `https://www.jra.go.jp/datafile/seiseki/g1/${race.slug}/index.html`;
  const html = await fetchText(indexUrl, `jra-${race.slug}-index.html`, "shift_jis");
  const rows = parseJraIndexRows(html, race, indexUrl);
  const wins = [];

  for (const row of rows) {
    if (row.year < race.fromYear) continue;
    const resultUrl = new URL(row.resultHref, indexUrl).toString();
    try {
      const resultHtml = await fetchText(resultUrl, `jra-${race.slug}-${row.year}.html`, "shift_jis");
      const detail = parseJraResult(resultHtml, row, race, resultUrl);
      if (detail.date && new Date(`${detail.date}T23:59:59+09:00`) > CUTOFF) {
        audit.excluded.push({ ...detail, excludedReason: "after cutoff" });
        continue;
      }
      if (detail.isForeignTrained) {
        audit.excluded.push({ ...detail, excludedReason: "foreign-trained winner" });
        continue;
      }
      if (!detail.sire?.nameJa || !detail.dam?.nameJa) {
        audit.warnings.push({ kind: "missing-pedigree", source: "JRA", race: race.raceNameJa, year: row.year, horse: row.horseName, url: resultUrl });
        continue;
      }
      wins.push(detail);
      audit.wins.push({ source: "JRA", raceId: race.id, year: detail.year, horse: detail.nameJa, url: resultUrl });
    } catch (error) {
      audit.warnings.push({ kind: "jra-result-fetch-failed", race: race.raceNameJa, year: row.year, url: resultUrl, message: error.message });
    }
  }

  return wins;
}

function parseJraIndexRows(html, race, indexUrl) {
  const table = html.match(/<table[^>]+id="g1_list"[\s\S]*?<\/table>/)?.[0] || "";
  const rows = [];
  for (const rowMatch of table.matchAll(/<tr>([\s\S]*?)<\/tr>/g)) {
    const row = rowMatch[1];
    const year = Number(row.match(/<td class="year">(\d{4})年<\/td>/)?.[1]);
    const horseName = stripHtml(row.match(/<td class="horse">([\s\S]*?)<\/td>/)?.[1] || "");
    const resultHref = row.match(/<td class="result">[\s\S]*?href="([^"]+)"/)?.[1];
    if (year && horseName && resultHref) {
      rows.push({ year, horseName, resultHref, sourceUrl: indexUrl, race });
    }
  }
  return rows;
}

function parseJraResult(html, row, race, resultUrl) {
  const dateMatch = html.match(/<div class="cell date">(\d{4})年(\d{1,2})月(\d{1,2})日/);
  const date = dateMatch ? toIsoDate(dateMatch[1], dateMatch[2], dateMatch[3]) : null;
  const winCell = html.match(/<th scope="row">勝馬<\/th>\s*<td>([\s\S]*?)<\/td>/)?.[1] || "";
  const lines = htmlToLines(winCell);
  const first = lines[0] || row.horseName;
  const isForeignTrained = /\[外\]/.test(first);
  const cleanName = cleanHorseName(first) || row.horseName;
  const english = extractParentheticalAscii(first);
  const ageSex = lines.join("\n").match(/\[([牡牝せんセ騸]+)(\d+)・/) || [];
  const sire = lines.join("\n").match(/父：(.+)/)?.[1] || "";
  const dam = lines.join("\n").match(/母：(.+)/)?.[1] || "";
  const birthYear = ageSex[2] && date ? Number(date.slice(0, 4)) - Number(ageSex[2]) : null;

  return {
    id: slugId(cleanName),
    nameJa: cleanName,
    nameKana: cleanName,
    nameEn: english,
    country: "JPN",
    birthYear,
    sex: normalizeSex(ageSex[1]),
    sire: { nameJa: cleanNameValue(sire), nameEn: asciiName(sire), country: "", aliases: aliasList(sire) },
    dam: { nameJa: cleanNameValue(dam), nameEn: asciiName(dam), country: "", aliases: aliasList(dam) },
    date: date || `${row.year}-01-01`,
    year: row.year,
    raceId: race.id,
    raceNameJa: race.raceNameJa,
    jurisdiction: "JRA",
    gradeAtRun: "GI",
    course: race.course,
    surface: race.surface,
    distanceM: race.distanceM,
    sourceUrls: [resultUrl],
    isForeignTrained
  };
}

async function collectLocalRace(race, audit) {
  let page;
  try {
    page = await fetchWikiPage(race.title);
  } catch (error) {
    audit.warnings.push({ kind: "wiki-race-fetch-failed", race: race.raceNameJa, title: race.title, message: error.message });
    return [];
  }
  const rows = parseWikiRaceRows(page.content, race);
  const wins = [];
  for (const row of rows) {
    if (!isWithinPeriods(row.year, race.periods)) continue;
    if (row.date && new Date(`${row.date}T23:59:59+09:00`) > CUTOFF) {
      audit.excluded.push({ source: "Wikipedia", raceId: race.id, year: row.year, horse: row.horseName, excludedReason: "after cutoff" });
      continue;
    }
    if (!isDomesticAffiliation(row.affiliation)) {
      audit.excluded.push({ source: "Wikipedia", raceId: race.id, year: row.year, horse: row.horseName, affiliation: row.affiliation, excludedReason: "foreign-trained winner" });
      continue;
    }
    const pedigree = await fetchHorsePedigree(row.pageTitle || row.horseName, row.horseName, audit);
    if (!pedigree.sire?.nameJa || !pedigree.dam?.nameJa) {
      audit.warnings.push({ kind: "missing-local-pedigree", race: race.raceNameJa, year: row.year, horse: row.horseName, pageTitle: row.pageTitle });
      continue;
    }
    const detail = {
      id: slugId(row.horseName),
      nameJa: row.horseName,
      nameKana: row.horseName,
      nameEn: pedigree.nameEn || "",
      country: "JPN",
      birthYear: pedigree.birthYear || null,
      sex: normalizeSex(row.sex || pedigree.sex || ""),
      sire: pedigree.sire,
      dam: pedigree.dam,
      date: row.date || `${row.year}-01-01`,
      year: row.year,
      raceId: race.id,
      raceNameJa: row.raceNameJa || race.raceNameJa,
      jurisdiction: "NAR",
      gradeAtRun: gradeAtRun(row.year, race.id),
      course: row.course || race.course,
      surface: "dirt",
      distanceM: row.distanceM || race.distanceM,
      sourceUrls: [`https://ja.wikipedia.org/wiki/${encodeURIComponent(race.title)}`, pedigree.sourceUrl].filter(Boolean)
    };
    wins.push(detail);
    audit.wins.push({ source: "Wikipedia", raceId: race.id, year: detail.year, horse: detail.nameJa });
  }
  return wins;
}

function parseWikiRaceRows(content, race) {
  const section = content.split(/==+\s*歴代優勝馬\s*==+/)[1] || content;
  const table = section.match(/\{\|[\s\S]*?\|\}/)?.[0] || "";
  const headerText = table.match(/!\s*回数[\s\S]*?\n\|-/)?.[0] || table.match(/![\s\S]*?\n\|-/)?.[0] || "";
  const headers = headerText
    .replace(/^\s*!/gm, "")
    .split(/!!|\n!/)
    .map(stripWiki)
    .map((header) => header.replace(/\s+/g, ""));
  const dateIndex = findHeaderIndex(headers, ["施行日", "年月日", "日付"]);
  const winnerIndex = findHeaderIndex(headers, ["優勝馬", "勝ち馬"]);
  const sexIndex = findHeaderIndex(headers, ["性齢"]);
  const affiliationIndex = findHeaderIndex(headers, ["所属"]);
  const courseIndex = findHeaderIndex(headers, ["競馬場"]);
  const distanceIndex = findHeaderIndex(headers, ["距離"]);
  const rows = [];
  const carry = {};

  for (const rawRow of table.split(/\n\|-/).slice(1)) {
    if (/^\s*!/.test(rawRow) || /colspan/.test(rawRow) && !/\d{4}年/.test(rawRow)) continue;
    const cells = splitWikiCells(rawRow);
    if (!cells.length) continue;
    const expanded = cells.map((cell, index) => {
      if (/rowspan\s*=/.test(cell)) carry[index] = cell;
      return cell || carry[index] || "";
    });
    const dateCell = expanded[dateIndex] || carry[dateIndex] || expanded.find((cell) => /\d{4}年/.test(cell)) || "";
    const year = Number(dateCell.match(/(\d{4})年/)?.[1]);
    if (!year) continue;
    const winnerCell = expanded[winnerIndex] || "";
    const parsedWinner = parseWikiLinkCell(winnerCell);
    const date = parseJapaneseDate(dateCell);
    rows.push({
      year,
      date,
      horseName: parsedWinner.text,
      pageTitle: parsedWinner.title,
      sex: stripWiki(expanded[sexIndex] || ""),
      affiliation: stripWiki(expanded[affiliationIndex] || ""),
      course: stripWiki(expanded[courseIndex] || ""),
      distanceM: Number(stripWiki(expanded[distanceIndex] || "").match(/(\d{3,4})/)?.[1]) || null,
      raceNameJa: race.raceNameJa
    });
  }
  return rows.filter((row) => row.horseName);
}

function splitWikiCells(rawRow) {
  return rawRow
    .split("\n")
    .filter((line) => line.startsWith("|") && !line.startsWith("|-") && !line.startsWith("|}"))
    .flatMap((line) => line.replace(/^\|+/, "").split("||"))
    .map((cell) => cell.trim());
}

async function fetchHorsePedigree(title, displayName, audit) {
  try {
    const page = await fetchWikiPage(title);
    const content = page.content;
    const horseTemplate = content.match(/\{\{競走馬[\s\S]*?\n\}\}/)?.[0] || content.slice(0, 4000);
    const sire = extractTemplateParam(horseTemplate, "父");
    const dam = extractTemplateParam(horseTemplate, "母");
    const english = extractTemplateParam(horseTemplate, "英");
    const birth = extractTemplateParam(horseTemplate, "生");
    const sex = extractTemplateParam(horseTemplate, "性");
    return {
      nameEn: cleanNameValue(english),
      birthYear: Number(birth.match(/(\d{4})/)?.[1]) || null,
      sex: normalizeSex(stripWiki(sex)),
      sire: { nameJa: cleanNameValue(sire), nameEn: asciiName(sire), country: "", aliases: aliasList(sire) },
      dam: { nameJa: cleanNameValue(dam), nameEn: asciiName(dam), country: "", aliases: aliasList(dam) },
      sourceUrl: `https://ja.wikipedia.org/wiki/${encodeURIComponent(page.title)}`
    };
  } catch (error) {
    audit.warnings.push({ kind: "wiki-horse-fetch-failed", title, displayName, message: error.message });
    return { sire: { nameJa: "" }, dam: { nameJa: "" } };
  }
}

function buildQuestions(wins, audit) {
  const byName = new Map();
  for (const win of wins) {
    const key = normalizeKey(win.nameJa);
    if (!byName.has(key)) {
      byName.set(key, {
        id: win.id || slugId(win.nameJa),
        nameJa: win.nameJa,
        nameKana: win.nameKana || win.nameJa,
        nameEn: win.nameEn || "",
        country: "JPN",
        birthYear: win.birthYear || null,
        sex: win.sex || "",
        sire: normalizeParent(win.sire),
        dam: normalizeParent(win.dam),
        wins: [],
        sourceUrls: {
          pedigree: "",
          raceResults: []
        }
      });
    }
    const horse = byName.get(key);
    if (!horse.birthYear && win.birthYear) horse.birthYear = win.birthYear;
    if (!horse.nameEn && win.nameEn) horse.nameEn = win.nameEn;
    horse.wins.push({
      date: win.date,
      year: win.year,
      raceId: win.raceId,
      raceNameJa: win.raceNameJa,
      jurisdiction: win.jurisdiction,
      gradeAtRun: win.gradeAtRun,
      course: win.course,
      surface: win.surface,
      distanceM: win.distanceM,
      sourceUrls: win.sourceUrls
    });
    horse.sourceUrls.raceResults.push(...(win.sourceUrls || []));
    const wikiUrl = win.sourceUrls?.find((url) => url.includes("wikipedia.org/wiki/") && !url.includes(encodeURIComponent(win.raceNameJa)));
    if (wikiUrl) horse.sourceUrls.pedigree = wikiUrl;
  }
  const questions = Array.from(byName.values())
    .map((horse) => ({
      ...horse,
      wins: horse.wins.sort((a, b) => a.date.localeCompare(b.date)),
      sourceUrls: {
        pedigree: horse.sourceUrls.pedigree,
        raceResults: Array.from(new Set(horse.sourceUrls.raceResults))
      }
    }))
    .sort((a, b) => a.nameJa.localeCompare(b.nameJa, "ja"));
  audit.meta.includedWinRecords = wins.length;
  audit.meta.questionCount = questions.length;
  return questions;
}

function validateGeneratedQuestions(questions, audit) {
  const seen = new Set();
  for (const horse of questions) {
    const key = normalizeKey(horse.nameJa);
    if (seen.has(key)) audit.warnings.push({ kind: "duplicate-question-key", horse: horse.nameJa });
    seen.add(key);
    if (!horse.sire?.nameJa || !horse.dam?.nameJa) {
      audit.warnings.push({ kind: "question-missing-pedigree", horse: horse.nameJa });
    }
    if (!horse.wins.length) {
      audit.warnings.push({ kind: "question-missing-wins", horse: horse.nameJa });
    }
  }
  if (audit.meta.includedWinRecords < 900) {
    audit.warnings.push({
      kind: "low-win-record-count",
      count: audit.meta.includedWinRecords,
      expectedRoughCount: audit.meta.expectedWinRecordRoughCount
    });
  }
}

async function fetchText(url, cacheName, encoding = "utf-8") {
  const cachePath = path.join(CACHE_DIR, cacheName);
  try {
    return await fs.readFile(cachePath, "utf8");
  } catch {
    // Cache miss.
  }
  const response = await fetch(url, {
    headers: { "User-Agent": "RacehorseWordleDataBot/0.1 (+local development)" }
  });
  if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
  const buffer = Buffer.from(await response.arrayBuffer());
  const text = new TextDecoder(encoding).decode(buffer);
  await fs.writeFile(cachePath, text);
  return text;
}

async function fetchWikiPage(title) {
  const cacheName = `wiki-${encodeURIComponent(title)}.json`;
  const cachePath = path.join(CACHE_DIR, cacheName);
  try {
    return JSON.parse(await fs.readFile(cachePath, "utf8"));
  } catch {
    // Cache miss.
  }
  const url = `https://ja.wikipedia.org/w/api.php?action=query&format=json&prop=revisions&rvprop=content&rvslots=main&titles=${encodeURIComponent(title)}&redirects=1&formatversion=2`;
  const response = await fetch(url, {
    headers: { "User-Agent": "RacehorseWordleDataBot/0.1 (+local development)" }
  });
  if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
  const json = await response.json();
  const page = json.query.pages[0];
  if (page.missing) throw new Error(`missing page: ${title}`);
  const result = {
    title: page.title,
    content: page.revisions?.[0]?.slots?.main?.content || ""
  };
  await fs.writeFile(cachePath, JSON.stringify(result));
  return result;
}

function stripHtml(value) {
  return String(value || "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&#8544;/g, "I")
    .trim();
}

function htmlToLines(value) {
  return stripHtml(value)
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean);
}

function cleanHorseName(value) {
  return cleanNameValue(value)
    .replace(/^\[[^\]]+\]/, "")
    .replace(/（[^）]*[A-Za-z][^）]*）/g, "")
    .replace(/\([^)]*[A-Za-z][^)]*\)/g, "")
    .trim();
}

function cleanNameValue(value) {
  return stripWiki(String(value || ""))
    .replace(/<ref[\s\S]*?<\/ref>/g, "")
    .replace(/<ref[^>]*\/>/g, "")
    .replace(/\{\{lang\|[a-z]+\|([^}]+)\}\}/gi, "$1")
    .replace(/\{\{仮リンク\|([^|}]+)[^}]*\}\}/g, "$1")
    .replace(/\[[^\]]+\]/g, "")
    .replace(/^\[[^\]]+\]/, "")
    .replace(/\s+/g, " ")
    .trim();
}

function stripWiki(value) {
  return String(value || "")
    .replace(/<ref[\s\S]*?<\/ref>/g, "")
    .replace(/<ref[^>]*\/>/g, "")
    .replace(/\{\{lang\|[a-z]+\|([^}]+)\}\}/gi, "$1")
    .replace(/\{\{生年月日と馬齢\|[^|}]*\|(\d{4})\|(\d{1,2})\|(\d{1,2})[^}]*\}\}/g, "$1年$2月$3日")
    .replace(/\{\{Flagicon\|[^}]+\}\}/g, "")
    .replace(/\{\{Nowrap\|([^}]+)\}\}/g, "$1")
    .replace(/\{\{[^}]+\}\}/g, "")
    .replace(/\[\[([^|\]]+)\|([^\]]+)\]\]/g, "$2")
    .replace(/\[\[([^\]]+)\]\]/g, "$1")
    .replace(/''+/g, "")
    .replace(/style="[^"]*"\|/g, "")
    .replace(/rowspan="?\d+"?\|/g, "")
    .replace(/colspan="?\d+"?\|/g, "")
    .replace(/class="[^"]*"\|/g, "")
    .replace(/scope="[^"]*"\|/g, "")
    .replace(/white-space:nowrap"\|/g, "")
    .trim();
}

function parseWikiLinkCell(value) {
  const link = String(value || "").match(/\[\[([^|\]]+)(?:\|([^\]]+))?\]\]/);
  if (link) {
    return {
      title: link[1].trim(),
      text: cleanHorseName(link[2] || link[1])
    };
  }
  return { title: "", text: cleanHorseName(value) };
}

function findHeaderIndex(headers, candidates) {
  const index = headers.findIndex((header) => candidates.some((candidate) => header.includes(candidate)));
  return index >= 0 ? index : 0;
}

function parseJapaneseDate(value) {
  const match = stripWiki(value).match(/(\d{4})年(\d{1,2})月(\d{1,2})日/);
  return match ? toIsoDate(match[1], match[2], match[3]) : null;
}

function toIsoDate(year, month, day) {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function isWithinPeriods(year, periods) {
  return periods.some(([from, to]) => year >= from && year <= to);
}

function isDomesticAffiliation(value) {
  const text = stripWiki(value);
  if (!text) return true;
  return !/(海外|外国|米国|英国|仏国|豪州|香港|愛国|UAE|USA|GB|FR|AUS|HK|IRE)/i.test(text);
}

function gradeAtRun(year, raceId) {
  if (raceId === "nar:tokyo-daishoten" && year >= 2011) return "GI";
  if (year <= 2006) return "GI";
  return "JpnI";
}

function normalizeParent(parent) {
  return {
    nameJa: cleanNameValue(parent?.nameJa || ""),
    nameEn: parent?.nameEn || asciiName(parent?.nameJa || ""),
    country: parent?.country || "",
    aliases: Array.from(new Set([...(parent?.aliases || []), parent?.nameEn].filter(Boolean)))
  };
}

function extractTemplateParam(template, name) {
  const re = new RegExp(`\\|\\s*${name}\\s*=\\s*([^\\n]+)`);
  return template.match(re)?.[1]?.trim() || "";
}

function extractParentheticalAscii(value) {
  return String(value || "").match(/[（(]([A-Za-z][A-Za-z0-9 .'\-]+)[）)]/)?.[1]?.trim() || "";
}

function asciiName(value) {
  const direct = extractParentheticalAscii(value);
  if (direct) return direct;
  const cleaned = stripWiki(value);
  return /^[A-Za-z0-9 .'\-]+$/.test(cleaned) ? cleaned : "";
}

function aliasList(value) {
  return Array.from(new Set([asciiName(value)].filter(Boolean)));
}

function normalizeSex(value) {
  const text = String(value || "");
  if (/牝|F/i.test(text)) return "F";
  if (/せん|セ|騸|G/i.test(text)) return "G";
  if (/牡|M/i.test(text)) return "M";
  return "";
}

function normalizeKey(value) {
  return String(value || "")
    .normalize("NFKC")
    .replace(/[\s\u3000・･'’`´\-‐‑‒–—―ーｰ.．,，/／\\()（）［］\[\]{}「」『』"“”]/g, "")
    .toUpperCase();
}

function slugId(value) {
  return `horse:${normalizeKey(value).toLowerCase()}`;
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
