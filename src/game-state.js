(function attachGameState(root) {
  const RHW = root.RHW || {};
  const normalize = RHW.normalizeName || require("./normalize.js").normalizeName;
  const splitAnswer = RHW.splitAnswer || require("./normalize.js").splitAnswer;
  const scoreGuess = RHW.scoreGuess || require("./evaluator.js").scoreGuess;
  const isCorrectGuess = RHW.isCorrectGuess || require("./evaluator.js").isCorrectGuess;

  const HORSE_LIMIT = 5;
  const PEDIGREE_LIMIT = 15;

  function makeAnswer(display, aliases) {
    const allAliases = [display].concat(aliases || []);
    return {
      display,
      answerKey: normalize(display),
      aliases: allAliases.map(normalize).filter(Boolean)
    };
  }

  function makeRound(question, restored) {
    const base = {
      questionId: question.id,
      activeTarget: "sire",
      currentInput: "",
      pedigreeAttemptsUsed: 0,
      horseAttemptsUsed: 0,
      pedigreeRevealed: false,
      status: "playing",
      resultRecorded: false,
      startedAt: new Date().toISOString(),
      targets: {
        sire: { solved: false, guesses: [] },
        dam: { solved: false, guesses: [] },
        horse: { solved: false, guesses: [] }
      }
    };
    return Object.assign(base, restored || {});
  }

  function getAnswers(question) {
    return {
      horse: makeAnswer(question.nameJa, [question.nameKana, question.nameEn].filter(Boolean)),
      sire: makeAnswer(question.sire.nameJa, question.sire.aliases),
      dam: makeAnswer(question.dam.nameJa, question.dam.aliases)
    };
  }

  function getTargetLimit(target) {
    return target === "horse" ? HORSE_LIMIT : PEDIGREE_LIMIT;
  }

  function getAttemptsUsed(round, target) {
    return target === "horse" ? round.horseAttemptsUsed : round.pedigreeAttemptsUsed;
  }

  function canSubmit(round, target) {
    if (round.status !== "playing") return false;
    if ((target === "sire" || target === "dam") && round.pedigreeRevealed) return false;
    if (round.targets[target].solved) return false;
    return getAttemptsUsed(round, target) < getTargetLimit(target);
  }

  function validateGuess(round, question, target, guess) {
    const answers = getAnswers(question);
    const guessLength = splitAnswer(guess).length;
    const answerLength = splitAnswer(answers[target].display).length;
    if (!canSubmit(round, target)) {
      return { ok: false, reason: "この欄はこれ以上入力できません。" };
    }
    if (guessLength !== answerLength) {
      return { ok: false, reason: `${answerLength}文字で入力してください。` };
    }
    return { ok: true };
  }

  function submitGuess(round, question, target, guess) {
    const validation = validateGuess(round, question, target, guess);
    if (!validation.ok) {
      return { round, accepted: false, message: validation.reason };
    }

    const next = structuredClone(round);
    const answers = getAnswers(question);
    const answer = answers[target];
    const guessKey = normalize(guess);
    const matchedAlias = answer.aliases.includes(guessKey);
    const evaluation = scoreGuess(guess, answer.display);
    const correct = matchedAlias || isCorrectGuess(guess, answer.display);

    next.targets[target].guesses.push({
      value: guess,
      normalized: guessKey,
      evaluation,
      correct
    });
    next.currentInput = "";

    if (target === "horse") {
      next.horseAttemptsUsed += 1;
    } else {
      next.pedigreeAttemptsUsed += 1;
    }

    if (correct) {
      next.targets[target].solved = true;
      if (target === "horse") {
        next.status = "won";
      }
    }

    if (target === "horse" && !correct && next.horseAttemptsUsed >= HORSE_LIMIT) {
      next.status = "lost";
    }

    if (target !== "horse" && next.pedigreeAttemptsUsed >= PEDIGREE_LIMIT) {
      next.pedigreeRevealed = true;
    }

    return {
      round: next,
      accepted: true,
      correct,
      message: correct ? "正解です。" : "判定しました。"
    };
  }

  function makeStats(existing) {
    return Object.assign({
      schemaVersion: 1,
      rounds: []
    }, existing || {});
  }

  function recordResult(stats, round, question) {
    const nextStats = makeStats(stats);
    if (round.resultRecorded || round.status === "playing") {
      return { stats: nextStats, round };
    }
    const nextRound = structuredClone(round);
    nextRound.resultRecorded = true;
    nextStats.rounds.push({
      questionId: question.id,
      horseName: question.nameJa,
      status: round.status,
      pedigreeAttemptsUsed: round.pedigreeAttemptsUsed,
      horseAttemptsUsed: round.horseAttemptsUsed,
      sireSolved: round.targets.sire.solved,
      damSolved: round.targets.dam.solved,
      finishedAt: new Date().toISOString()
    });
    return { stats: nextStats, round: nextRound };
  }

  function summarizeStats(stats) {
    const rounds = stats?.rounds || [];
    const wins = rounds.filter((round) => round.status === "won").length;
    const losses = rounds.filter((round) => round.status === "lost").length;
    const total = rounds.length;
    return {
      total,
      wins,
      losses,
      successRate: total ? Math.round((wins / total) * 100) : 0,
      failureRate: total ? Math.round((losses / total) * 100) : 0,
      recent: rounds.slice(-8).reverse()
    };
  }

  const api = {
    HORSE_LIMIT,
    PEDIGREE_LIMIT,
    makeRound,
    getAnswers,
    getAttemptsUsed,
    canSubmit,
    validateGuess,
    submitGuess,
    makeStats,
    recordResult,
    summarizeStats
  };
  root.RHW = Object.assign(root.RHW || {}, api);
  if (typeof module !== "undefined") {
    module.exports = api;
  }
})(typeof globalThis !== "undefined" ? globalThis : window);
