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
    focusNativeInput();
  }

  function bindEvents() {
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("compositionstart", () => {
      composing = true;
    });
    document.addEventListener("compositionend", (event) => {
      composing = false;
      const nativeInput = document.querySelector("#native-input");
      const value = nativeInput?.value || event.data || "";
      if (nativeInput) nativeInput.value = "";
      appendText(value);
    });
    document.querySelector("#native-input").addEventListener("input", (event) => {
      if (composing) return;
      const value = event.target.value;
      event.target.value = "";
      appendText(value);
    });

    document.querySelector("#keyboard").addEventListener("click", (event) => {
      const button = event.target.closest("[data-key]");
      if (!button) return;
      const key = button.dataset.key;
      if (key === "消") backspace();
      else if (key === "決定") submit();
      else if (key === "゛" || key === "゜" || key === "小") transformInput(key);
      else appendText(key);
      focusNativeInput();
    });

    document.querySelector("#next-question").addEventListener("click", nextQuestion);
    document.querySelector("#stats-button").addEventListener("click", () => RHW.ui.openResultModal(state, "stats"));
    document.querySelector("#reset-button").addEventListener("click", () => nextQuestion("別の問題を出題しました。"));
    document.querySelector("#close-modal").addEventListener("click", () => document.querySelector("#result-modal").close());
    document.addEventListener("click", () => focusNativeInput());
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
    if (event.target === document.querySelector("#native-input")) return;
    if (event.key.length === 1) {
      appendText(event.key);
    }
  }

  function appendText(value) {
    if (!value || state.round.status !== "playing") return;
    if (value === "゛" || value === "ﾞ" || value === "゜" || value === "ﾟ" || value === "小") {
      transformInput(value);
      return;
    }
    const normalizedValue = RHW.normalizeTypedKana(value);
    if (!RHW.isUsableKanaInput(normalizedValue)) {
      showInputError("使用できない文字が含まれています");
      return;
    }
    const chars = RHW.splitAnswer(state.round.currentInput + normalizedValue);
    state.round.currentInput = chars.slice(0, RHW.MAX_INPUT_LENGTH).join("");
    renderAndSave();
  }

  function transformInput(mark) {
    if (state.round.status !== "playing") return;
    const transformed = RHW.transformLastKana(state.round.currentInput, mark);
    if (transformed === state.round.currentInput) return;
    state.round.currentInput = transformed;
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
    if (result.accepted) {
      state.round.justSubmittedAttempt = state.round.attemptsUsed;
    }

    if (!result.accepted) {
      showInputError(result.message);
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
    focusNativeInput();
  }

  function renderAndSave() {
    RHW.ui.render(state);
    const persistedRound = structuredClone(state.round);
    delete persistedRound.justSubmittedAttempt;
    RHW.storage.writeJson(RHW.CONFIG.storageKeys.stats, state.stats);
    RHW.storage.writeJson(RHW.CONFIG.storageKeys.current, persistedRound);
    delete state.round.justSubmittedAttempt;
  }

  function showInputError(message) {
    RHW.ui.setToast(message, "warn");
    document.querySelector(".input-strip").classList.remove("shake");
    void document.querySelector(".input-strip").offsetWidth;
    document.querySelector(".input-strip").classList.add("shake");
    focusNativeInput();
  }

  function focusNativeInput() {
    const nativeInput = document.querySelector("#native-input");
    const modal = document.querySelector("#result-modal");
    if (!nativeInput || modal?.open) return;
    nativeInput.focus({ preventScroll: true });
  }

  root.addEventListener("DOMContentLoaded", init);
})(typeof globalThis !== "undefined" ? globalThis : window);
