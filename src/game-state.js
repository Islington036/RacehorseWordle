(function attachGameState(root) {
  const RHW = root.RHW || {};
  const normalize = RHW.normalizeName || require("./normalize.js").normalizeName;
  const splitAnswer = RHW.splitAnswer || require("./normalize.js").splitAnswer;
  const scoreGuess = RHW.scoreGuess || require("./evaluator.js").scoreGuess;
  const isCorrectGuess = RHW.isCorrectGuess || require("./evaluator.js").isCorrectGuess;
  const textApi = RHW.text || (typeof require !== "undefined" ? require("./text.js").text : null);
  const rulesConfig = RHW.CONFIG.rules;
  const normalRules = rulesConfig.normal;
  const easyRules = rulesConfig.easy;

  const ATTEMPT_LIMIT = normalRules.attemptLimit;
  const EASY_ATTEMPT_LIMIT = easyRules.attemptLimit;
  const MAX_INPUT_LENGTH = rulesConfig.maxInputLength;
  const SIRE_HINT_UNLOCK_ATTEMPTS = normalRules.sireHintUnlockAttempts;
  const EASY_SIRE_HINT_UNLOCK_ATTEMPTS = easyRules.sireHintUnlockAttempts;
  const STATS_HISTORY_LIMIT = rulesConfig.statsHistoryLimit;
  const TARGETS = ["horse", "sire", "dam"];
  const GAME_RULES = {
    normal: {
      easyMode: false,
      attemptLimit: ATTEMPT_LIMIT,
      sireHintUnlockAttempts: SIRE_HINT_UNLOCK_ATTEMPTS
    },
    easy: {
      easyMode: true,
      attemptLimit: EASY_ATTEMPT_LIMIT,
      sireHintUnlockAttempts: EASY_SIRE_HINT_UNLOCK_ATTEMPTS
    }
  };

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
      historyTarget: "horse",
      sireHintUsed: false,
      resultRecorded: false,
      startedAt: new Date().toISOString(),
      targets: {
        sire: { solved: false, guesses: [] },
        dam: { solved: false, guesses: [] },
        horse: { solved: false, guesses: [] }
      }
    };
    const safeRestored = isPlainObject(restored) ? restored : {};
    const restoredTargets = isPlainObject(safeRestored.targets) ? safeRestored.targets : {};
    const round = Object.assign({}, base, safeRestored);
    round.questionId = typeof round.questionId === "string" ? round.questionId : question.id;
    round.currentInput = typeof round.currentInput === "string" ? round.currentInput : "";
    round.status = ["playing", "won", "lost"].includes(round.status) ? round.status : "playing";
    round.sireHintUsed = Boolean(round.sireHintUsed);
    round.resultRecorded = Boolean(round.resultRecorded);
    round.startedAt = typeof round.startedAt === "string" ? round.startedAt : base.startedAt;
    round.targets = {
      sire: makeRestoredTarget(question, "sire", restoredTargets.sire),
      dam: makeRestoredTarget(question, "dam", restoredTargets.dam),
      horse: makeRestoredTarget(question, "horse", restoredTargets.horse)
    };
    if (!TARGETS.includes(round.historyTarget)) {
      round.historyTarget = "horse";
    }
    round.attemptsUsed = typeof round.attemptsUsed === "number"
      ? clampAttempt(round.attemptsUsed)
      : Math.max(
        round.targets.horse?.guesses?.length || 0,
        round.targets.sire?.guesses?.length || 0,
        round.targets.dam?.guesses?.length || 0,
        clampAttempt(round.horseAttemptsUsed || 0),
        clampAttempt(round.pedigreeAttemptsUsed || 0)
      );
    return round;
  }

  function makeRestoredTarget(question, target, restoredTarget) {
    const answers = getAnswers(question);
    const source = isPlainObject(restoredTarget) ? restoredTarget : {};
    const guesses = Array.isArray(source.guesses)
      ? source.guesses.map((guess, index) => makeRestoredGuess(guess, answers[target], index)).filter(Boolean)
      : [];
    return {
      solved: guesses.some((guess) => guess.correct),
      guesses
    };
  }

  function makeRestoredGuess(guess, answer, index) {
    if (!isPlainObject(guess) || typeof guess.value !== "string") return null;
    const value = guess.value;
    const normalized = typeof guess.normalized === "string" ? guess.normalized : normalize(value);
    const correct = answer.aliases.includes(normalized) || isCorrectGuess(value, answer.display);
    return {
      attempt: clampAttempt(guess.attempt || index + 1),
      value,
      normalized,
      evaluation: sanitizeEvaluation(guess.evaluation, value, answer.display),
      correct
    };
  }

  function sanitizeEvaluation(evaluation, value, answer) {
    if (!Array.isArray(evaluation) || evaluation.length === 0) {
      return scoreGuess(value, answer);
    }
    return evaluation.map((item) => ({
      char: typeof item?.char === "string" ? item.char : "",
      state: ["correct", "present", "absent"].includes(item?.state) ? item.state : "absent"
    }));
  }

  function getAnswers(question) {
    return {
      horse: makeAnswer(question.nameJa, [question.nameKana, question.nameEn].filter(Boolean)),
      sire: makeAnswer(question.sire.nameJa, question.sire.aliases),
      dam: makeAnswer(question.dam.nameJa, question.dam.aliases)
    };
  }

  function getAttemptsUsed(round) {
    return round.attemptsUsed || 0;
  }

  function getGameRules(options) {
    return Boolean(options?.easyMode) ? GAME_RULES.easy : GAME_RULES.normal;
  }

  function getAttemptLimit(options) {
    return getGameRules(options).attemptLimit;
  }

  function canSubmit(round, options) {
    if (round.status !== "playing") return false;
    return getAttemptsUsed(round) < getAttemptLimit(options);
  }

  function canRestoreRound(round, options) {
    return round?.schemaVersion === 2
      && round.status === "playing"
      && getAttemptsUsed(round) < getAttemptLimit(options);
  }

  function canUseSireHint(round, options) {
    const sireSolved = Boolean(round.targets?.sire?.solved)
      || Boolean(round.targets?.sire?.guesses?.some((guess) => guess.correct));
    const rules = getGameRules(options);
    return round.status === "playing"
      && getAttemptsUsed(round) >= rules.sireHintUnlockAttempts
      && getAttemptsUsed(round) < rules.attemptLimit
      && !round.sireHintUsed
      && !sireSolved;
  }

  function forfeitRound(round) {
    if (round.status !== "playing") return round;
    const next = structuredClone(round);
    next.currentInput = "";
    next.status = "lost";
    next.forfeited = true;
    return next;
  }

  function getGuessAndOptions(targetOrGuess, maybeGuess, maybeOptions) {
    if (typeof maybeGuess === "string") {
      return { guess: maybeGuess, options: maybeOptions };
    }
    return { guess: targetOrGuess, options: maybeGuess };
  }

  function validateGuess(round, question, targetOrGuess, maybeGuess, maybeOptions) {
    const { guess, options } = getGuessAndOptions(targetOrGuess, maybeGuess, maybeOptions);
    const guessLength = splitAnswer(guess).length;
    if (!canSubmit(round, options)) {
      return { ok: false, reason: text("messages.cannotSubmitMore") };
    }
    if (guessLength < 1) {
      return { ok: false, reason: text("messages.minOneChar") };
    }
    if (guessLength > MAX_INPUT_LENGTH) {
      return { ok: false, reason: text("messages.maxChars", { maxLength: MAX_INPUT_LENGTH }) };
    }
    return { ok: true };
  }

  function submitGuess(round, question, targetOrGuess, maybeGuess, maybeOptions) {
    const { guess, options } = getGuessAndOptions(targetOrGuess, maybeGuess, maybeOptions);
    const validation = validateGuess(round, question, guess, options);
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
    } else if (next.attemptsUsed >= getAttemptLimit(options)) {
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
    if (targetResults.horse.correct) return text("messages.horseCorrect");
    const pedigree = [];
    if (targetResults.sire.newlySolved) pedigree.push(text("labels.sireShort"));
    if (targetResults.dam.newlySolved) pedigree.push(text("labels.damShort"));
    if (pedigree.length) {
      return text("messages.pedigreeCorrect", {
        targets: pedigree.join(text("particles.and"))
      });
    }
    return "";
  }

  function text(path, params) {
    return textApi?.format(path, params) || "";
  }

  function makeStats(existing) {
    const base = {
      schemaVersion: 1,
      rounds: []
    };
    if (!isPlainObject(existing)) return base;
    return {
      schemaVersion: 1,
      rounds: Array.isArray(existing.rounds)
        ? existing.rounds.map(makeStatsRound).filter(Boolean)
        : []
    };
  }

  function makeStatsRound(round) {
    if (!isPlainObject(round)) return null;
    const status = ["won", "lost"].includes(round.status) ? round.status : "lost";
    return {
      questionId: typeof round.questionId === "string" ? round.questionId : "",
      horseName: typeof round.horseName === "string" ? round.horseName : "",
      status,
      attemptsUsed: clampAttempt(round.attemptsUsed ?? round.horseAttemptsUsed ?? round.pedigreeAttemptsUsed ?? 0),
      sireSolved: Boolean(round.sireSolved),
      damSolved: Boolean(round.damSolved),
      horseSolved: Boolean(round.horseSolved),
      forfeited: Boolean(round.forfeited),
      sireHintUsed: Boolean(round.sireHintUsed),
      finishedAt: typeof round.finishedAt === "string" ? round.finishedAt : ""
    };
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
      forfeited: Boolean(round.forfeited),
      sireHintUsed: Boolean(round.sireHintUsed),
      finishedAt: new Date().toISOString()
    });
    return { stats: nextStats, round: nextRound };
  }

  function summarizeStats(stats) {
    const rounds = Array.isArray(stats?.rounds) ? stats.rounds : [];
    const wins = rounds.filter((round) => round.status === "won").length;
    const losses = rounds.filter((round) => round.status === "lost").length;
    const total = rounds.length;
    return {
      total,
      wins,
      losses,
      successRate: total ? Math.round((wins / total) * 100) : 0,
      failureRate: total ? Math.round((losses / total) * 100) : 0,
      recent: rounds.slice(-STATS_HISTORY_LIMIT).reverse()
    };
  }

  function clampAttempt(value) {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) return 0;
    return Math.max(0, Math.min(ATTEMPT_LIMIT, Math.trunc(numeric)));
  }

  function isPlainObject(value) {
    return Boolean(value) && typeof value === "object" && !Array.isArray(value);
  }

  const api = {
    ATTEMPT_LIMIT,
    EASY_ATTEMPT_LIMIT,
    MAX_INPUT_LENGTH,
    STATS_HISTORY_LIMIT,
    getGameRules,
    getAttemptLimit,
    makeRound,
    getAnswers,
    getAttemptsUsed,
    canSubmit,
    canRestoreRound,
    canUseSireHint,
    forfeitRound,
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
