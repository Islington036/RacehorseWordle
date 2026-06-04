(function attachMain(root) {
  const RHW = root.RHW;
  const DATA = root.RHW_QUESTIONS;
  let state;
  let composing = false;

  function init() {
    if (!DATA || !Array.isArray(DATA.horses) || DATA.horses.length === 0) {
      document.body.innerHTML = "<main class=\"fatal\">問題データを読み込めませんでした。</main>";
      return;
    }

    RHW.ui.initElements();
    RHW.ui.renderKeyboard();

    const stats = RHW.makeStats(RHW.storage.readJson(RHW.CONFIG.storageKeys.stats, null));
    const restored = RHW.storage.readJson(RHW.CONFIG.storageKeys.current, null);
    const restoredQuestion = restored && DATA.horses.find((question) => question.id === restored.questionId);
    const question = restoredQuestion || RHW.pickQuestion(DATA.horses, stats, null);
    const round = restoredQuestion ? RHW.makeRound(question, restored) : RHW.makeRound(question);

    state = { question, round, stats };
    bindEvents();
    renderAndSave();
  }

  function bindEvents() {
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("compositionstart", () => { composing = true; });
    document.addEventListener("compositionend", (event) => {
      composing = false;
      appendText(event.data);
    });

    document.querySelector("#keyboard").addEventListener("click", (event) => {
      const button = event.target.closest("[data-key]");
      if (!button) return;
      const key = button.dataset.key;
      if (key === "消") backspace();
      else if (key === "決定") submit();
      else appendText(key);
    });

    document.querySelectorAll("[data-target]").forEach((button) => {
      button.addEventListener("click", () => {
        state.round.activeTarget = button.dataset.target;
        state.round.currentInput = "";
        renderAndSave();
      });
    });

    document.querySelector("#next-question").addEventListener("click", nextQuestion);
    document.querySelector("#stats-button").addEventListener("click", () => RHW.ui.openResultModal(state, "stats"));
    document.querySelector("#reset-button").addEventListener("click", resetRound);
    document.querySelector("#close-modal").addEventListener("click", () => document.querySelector("#result-modal").close());
  }

  function onKeyDown(event) {
    if (composing || event.metaKey || event.ctrlKey || event.altKey) return;
    if (event.key === "Enter") {
      event.preventDefault();
      submit();
      return;
    }
    if (event.key === "Backspace") {
      event.preventDefault();
      backspace();
      return;
    }
    if (event.key.length === 1) {
      appendText(event.key);
    }
  }

  function appendText(value) {
    if (!value || state.round.status !== "playing") return;
    const answers = RHW.getAnswers(state.question);
    const activeAnswer = answers[state.round.activeTarget];
    const limit = RHW.displayLength(activeAnswer.display);
    const chars = RHW.splitAnswer(state.round.currentInput + value);
    state.round.currentInput = chars.slice(0, limit).join("");
    renderAndSave();
  }

  function backspace() {
    state.round.currentInput = RHW.splitAnswer(state.round.currentInput).slice(0, -1).join("");
    renderAndSave();
  }

  function submit() {
    const target = state.round.activeTarget;
    const guess = state.round.currentInput;
    const result = RHW.submitGuess(state.round, state.question, target, guess);
    state.round = result.round;

    if (!result.accepted) {
      RHW.ui.setToast(result.message, "warn");
      document.querySelector(".input-strip").classList.remove("shake");
      void document.querySelector(".input-strip").offsetWidth;
      document.querySelector(".input-strip").classList.add("shake");
      return renderAndSave();
    }

    if (state.round.pedigreeRevealed && target !== "horse" && !result.correct) {
      RHW.ui.setToast("血統15回を使い切りました。父母を開示します。", "warn");
    } else {
      RHW.ui.setToast(result.correct ? "正解です。" : "判定しました。", result.correct ? "good" : "neutral");
    }

    if (state.round.status !== "playing") {
      const recorded = RHW.recordResult(state.stats, state.round, state.question);
      state.stats = recorded.stats;
      state.round = recorded.round;
      renderAndSave();
      RHW.ui.openResultModal(state, "result");
      return;
    }

    renderAndSave();
  }

  function nextQuestion() {
    document.querySelector("#result-modal").close();
    const next = RHW.pickQuestion(DATA.horses, state.stats, state.question.id);
    state.question = next;
    state.round = RHW.makeRound(next);
    renderAndSave();
  }

  function resetRound() {
    state.round = RHW.makeRound(state.question);
    renderAndSave();
    RHW.ui.setToast("この問題をリセットしました。", "neutral");
  }

  function renderAndSave() {
    RHW.ui.render(state);
    RHW.storage.writeJson(RHW.CONFIG.storageKeys.stats, state.stats);
    RHW.storage.writeJson(RHW.CONFIG.storageKeys.current, state.round);
  }

  root.addEventListener("DOMContentLoaded", init);
})(typeof globalThis !== "undefined" ? globalThis : window);
