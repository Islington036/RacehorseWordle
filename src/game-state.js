(function attachGameState(root) {
  const RHW = root.RHW || {};
  const normalize = RHW.normalizeName || require("./normalize.js").normalizeName;
  const splitAnswer = RHW.splitAnswer || require("./normalize.js").splitAnswer;
  const scoreGuess = RHW.scoreGuess || require("./evaluator.js").scoreGuess;
  const isCorrectGuess = RHW.isCorrectGuess || require("./evaluator.js").isCorrectGuess;

  const ATTEMPT_LIMIT = RHW.CONFIG?.attemptLimit || 15;
  const MAX_INPUT_LENGTH = RHW.CONFIG?.maxInputLength || 18;
  const TARGETS = ["horse", "sire", "dam"];

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
      schemaVersion: 2,
      currentInput: "",
      attemptsUsed: 0,
      status: "playing",
      resultRecorded: false,
      startedAt: new Date().toISOString(),
      targets: {
        sire: { solved: false, guesses: [] },
        dam: { solved: false, guesses: [] },
        horse: { solved: false, guesses: [] }
      }
    };
    const restoredTargets = restored?.targets || {};
    const round = Object.assign(base, restored || {});
    round.targets = {
      sire: Object.assign(base.targets.sire, restoredTargets.sire || {}),
      dam: Object.assign(base.targets.dam, restoredTargets.dam || {}),
      horse: Object.assign(base.targets.horse, restoredTargets.horse || {})
    };
    round.attemptsUsed = typeof round.attemptsUsed === "number"
      ? round.attemptsUsed
      : Math.max(
        round.targets.horse?.guesses?.length || 0,
        round.targets.sire?.guesses?.length || 0,
        round.targets.dam?.guesses?.length || 0,
        round.horseAttemptsUsed || 0,
        round.pedigreeAttemptsUsed || 0
      );
    return round;
  }

  function getAnswers(question) {
    return {
      horse: makeAnswer(question.nameJa, [question.nameKana, question.nameEn].filter(Boolean)),
      sire: makeAnswer(question.sire.nameJa, question.sire.aliases),
      dam: makeAnswer(question.dam.nameJa, question.dam.aliases)
    };
  }

  function getTargetLimit() {
    return ATTEMPT_LIMIT;
  }

  function getAttemptsUsed(round) {
    return round.attemptsUsed || 0;
  }

  function canSubmit(round) {
    if (round.status !== "playing") return false;
    return getAttemptsUsed(round) < ATTEMPT_LIMIT;
  }

  function getGuessArg(targetOrGuess, maybeGuess) {
    return maybeGuess === undefined ? targetOrGuess : maybeGuess;
  }

  function validateGuess(round, question, targetOrGuess, maybeGuess) {
    const guess = getGuessArg(targetOrGuess, maybeGuess);
    const guessLength = splitAnswer(guess).length;
    if (!canSubmit(round)) {
      return { ok: false, reason: "これ以上入力できません。" };
    }
    if (guessLength < 1) {
      return { ok: false, reason: "1文字以上入力してください。" };
    }
    if (guessLength > MAX_INPUT_LENGTH) {
      return { ok: false, reason: `${MAX_INPUT_LENGTH}文字以内で入力してください。` };
    }
    return { ok: true };
  }

  function submitGuess(round, question, targetOrGuess, maybeGuess) {
    const guess = getGuessArg(targetOrGuess, maybeGuess);
    const validation = validateGuess(round, question, guess);
    if (!validation.ok) {
      return { round, accepted: false, message: validation.reason };
    }

    const next = structuredClone(round);
    const answers = getAnswers(question);
    const guessKey = normalize(guess);
    const targetResults = {};
    const nextAttempt = getAttemptsUsed(round) + 1;

    TARGETS.forEach((target) => {
      const wasSolved = Boolean(round.targets[target].solved);
      if (target !== "horse" && wasSolved) {
        targetResults[target] = { correct: true, newlySolved: false, skipped: true };
        return;
      }

      const answer = answers[target];
      const matchedAlias = answer.aliases.includes(guessKey);
      const correct = matchedAlias || isCorrectGuess(guess, answer.display);
      const evaluation = scoreGuess(guess, answer.display);
      const newlySolved = !wasSolved && correct;

      next.targets[target].guesses.push({
        attempt: nextAttempt,
        value: guess,
        normalized: guessKey,
        evaluation,
        correct
      });

      next.targets[target].solved = next.targets[target].solved || correct;

      targetResults[target] = { correct, newlySolved, evaluation };
    });

    next.currentInput = "";
    next.attemptsUsed = nextAttempt;

    if (targetResults.horse.correct) {
      next.status = "won";
    } else if (next.attemptsUsed >= ATTEMPT_LIMIT) {
      next.status = "lost";
    }

    return {
      round: next,
      accepted: true,
      correct: targetResults.horse.correct,
      targetResults,
      message: makeResultMessage(targetResults)
    };
  }

  function makeResultMessage(targetResults) {
    if (targetResults.horse.correct) return "馬名が正解です。";
    const pedigree = [];
    if (targetResults.sire.newlySolved) pedigree.push("父");
    if (targetResults.dam.newlySolved) pedigree.push("母");
    if (pedigree.length) return `${pedigree.join("と")}が正解です。`;
    return "";
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
      attemptsUsed: round.attemptsUsed || 0,
      sireSolved: round.targets.sire.solved,
      damSolved: round.targets.dam.solved,
      horseSolved: round.targets.horse.solved,
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
    ATTEMPT_LIMIT,
    MAX_INPUT_LENGTH,
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
