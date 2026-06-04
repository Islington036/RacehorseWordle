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
    const restoredQuestion = restored?.schemaVersion === 2
      ? DATA.horses.find((question) => question.id === restored.questionId)
      : null;
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

    document.querySelector("#next-question").addEventListener("click", nextQuestion);
    document.querySelector("#stats-button").addEventListener("click", () => RHW.ui.openResultModal(state, "stats"));
    document.querySelector("#reset-button").addEventListener("click", () => nextQuestion("別の問題を出題しました。"));
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
    const chars = RHW.splitAnswer(state.round.currentInput + value);
    state.round.currentInput = chars.slice(0, RHW.MAX_INPUT_LENGTH).join("");
    renderAndSave();
  }

  function backspace() {
    state.round.currentInput = RHW.splitAnswer(state.round.currentInput).slice(0, -1).join("");
    renderAndSave();
  }

  function submit() {
    const guess = state.round.currentInput;
    const result = RHW.submitGuess(state.round, state.question, guess);
    state.round = result.round;

    if (!result.accepted) {
      RHW.ui.setToast(result.message, "warn");
      document.querySelector(".input-strip").classList.remove("shake");
      void document.querySelector(".input-strip").offsetWidth;
      document.querySelector(".input-strip").classList.add("shake");
      return renderAndSave();
    }

    if (state.round.status === "lost") {
      RHW.ui.setToast("15回を使い切りました。", "warn");
    } else {
      RHW.ui.setToast(result.message, result.correct ? "good" : "neutral");
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

  function nextQuestion(message) {
    const modal = document.querySelector("#result-modal");
    if (modal.open) modal.close();
    const next = RHW.pickQuestion(DATA.horses, state.stats, state.question.id);
    state.question = next;
    state.round = RHW.makeRound(next);
    renderAndSave();
    if (message) RHW.ui.setToast(message, "neutral");
  }

  function renderAndSave() {
    RHW.ui.render(state);
    RHW.storage.writeJson(RHW.CONFIG.storageKeys.stats, state.stats);
    RHW.storage.writeJson(RHW.CONFIG.storageKeys.current, state.round);
  }

  root.addEventListener("DOMContentLoaded", init);
})(typeof globalThis !== "undefined" ? globalThis : window);
