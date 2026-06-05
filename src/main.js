(function attachMain(root) {
  const RHW = root.RHW;
  const DATA = root.RHW_QUESTIONS;
  let state;
  let composing = false;
  let submitAfterComposition = false;

  function init() {
    if (!DATA || !Array.isArray(DATA.horses) || DATA.horses.length === 0) {
      document.body.innerHTML = "<main class=\"fatal\">問題データを読み込めませんでした。</main>";
      return;
    }

    RHW.ui.initElements();
    RHW.ui.renderKeyboard();

    state = RHW.createInitialState(DATA.horses, {
      stats: RHW.storage.readJson(RHW.CONFIG.storageKeys.stats, null),
      options: RHW.storage.readJson(RHW.CONFIG.storageKeys.options, null),
      round: RHW.storage.readJson(RHW.CONFIG.storageKeys.current, null)
    });
    bindEvents();
    renderAndSave();
    focusNativeInput();
  }

  function bindEvents() {
    bindInputEvents();
    bindKeyboardEvents();
    bindHistoryEvents();
    bindDialogEvents();
    bindOptionsEvents();
    document.querySelector("#sire-hint-button").addEventListener("click", () => useSireHint());
    document.addEventListener("click", () => focusNativeInput());
  }

  function bindInputEvents() {
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("compositionstart", () => {
      composing = true;
    });
    document.addEventListener("compositionupdate", () => {
      syncNativeInput();
    });
    document.addEventListener("compositionend", (event) => {
      composing = false;
      syncNativeInput(event.data);
      if (submitAfterComposition) {
        submitAfterComposition = false;
        submit();
      }
    });
    document.querySelector("#native-input").addEventListener("input", (event) => {
      const value = event.target.value || "";
      if (/[\r\n]/.test(value)) {
        setInputValue(value.replace(/[\r\n]/g, ""));
        submit();
        return;
      }
      syncNativeInput();
    });
  }

  function bindKeyboardEvents() {
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
  }

  function bindHistoryEvents() {
    document.querySelector("#history-tabs").addEventListener("click", (event) => {
      const button = event.target.closest("[data-history-target]");
      if (!button) return;
      setHistoryTarget(button.dataset.historyTarget);
    });
  }

  function bindDialogEvents() {
    document.querySelector("#next-question").addEventListener("click", () => nextQuestion());
    document.querySelector("#reset-button").addEventListener("click", () => RHW.ui.openResetConfirm());
    document.querySelector("#confirm-reset-question").addEventListener("click", () => {
      RHW.ui.closeResetConfirm();
      forfeitQuestion();
    });
    document.querySelector("#cancel-reset-question").addEventListener("click", () => {
      RHW.ui.closeResetConfirm();
      focusNativeInput();
    });
    document.querySelector("#close-modal").addEventListener("click", () => document.querySelector("#result-modal").close());
  }

  function bindOptionsEvents() {
    document.querySelector("#options-button").addEventListener("click", () => RHW.ui.openOptionsModal(state));
    document.querySelector("#close-options").addEventListener("click", () => {
      RHW.ui.closeOptionsModal();
      focusNativeInput();
    });
    document.querySelector("#hide-hints").addEventListener("change", (event) => {
      updateOptions({ hideHints: event.target.checked });
    });
    document.querySelector("#decade-filter").addEventListener("change", (event) => {
      updateOptions({ decadeFilter: event.target.value });
    });
    document.querySelector("#clear-history").addEventListener("click", () => clearHistory());
  }

  function updateOptions(partialOptions) {
    const nextOptions = RHW.makeOptions(Object.assign({}, state.options, partialOptions));
    state.options = nextOptions;
    const questionPool = RHW.getQuestionPool(DATA.horses, state.options);
    const currentAllowed = questionPool.some((question) => question.id === state.question.id);
    if (!currentAllowed) {
      clearInputFeedback();
      switchToQuestion(RHW.pickNextQuestion(state, DATA.horses));
      RHW.ui.setToast("条件に合う問題へ切り替えました。", "neutral");
    } else {
      RHW.ui.setToast("オプションを保存しました。", "neutral");
    }
    renderAndSave();
  }

  function onKeyDown(event) {
    if (event.metaKey || event.ctrlKey || event.altKey) return;
    if (event.key === "Enter") {
      if (composing || event.isComposing) {
        submitAfterComposition = true;
        return;
      }
      event.preventDefault();
      submit();
      return;
    }
    if (event.target === document.querySelector("#native-input")) return;
    if (composing) return;
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
    if (value === "゛" || value === "ﾞ" || value === "゜" || value === "ﾟ" || value === "小") {
      transformInput(value);
      return;
    }
    setInputValue(state.round.currentInput + value);
  }

  function syncNativeInput(fallbackValue) {
    const nativeInput = document.querySelector("#native-input");
    setInputValue(nativeInput?.value || fallbackValue || "");
  }

  function setInputValue(value) {
    if (state.round.status !== "playing") return;
    const normalizedValue = RHW.normalizeTypedKana(value).replace(/[\r\n]/g, "");
    const chars = RHW.splitAnswer(normalizedValue);
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
    if (guess && !RHW.isUsableKanaInput(guess)) {
      showInputError("使用できない文字が含まれています");
      return renderAndSave();
    }
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
      RHW.ui.openResultModal(state);
      return;
    }

    renderAndSave();
  }

  function forfeitQuestion() {
    const modal = document.querySelector("#result-modal");
    if (modal.open) modal.close();
    RHW.ui.closeResetConfirm();
    clearInputFeedback();
    if (state.round.status === "playing") {
      state.round = RHW.forfeitRound(state.round);
      const recorded = RHW.recordResult(state.stats, state.round, state.question);
      state.stats = recorded.stats;
      state.round = recorded.round;
      renderAndSave();
    }
    RHW.ui.openResultModal(state);
  }

  function useSireHint() {
    if (state.options?.hideHints) return;
    if (!RHW.canUseSireHint(state.round)) return;
    state.round.sireHintUsed = true;
    state.round.currentInput = state.question.sire.nameJa;
    syncNativeInputValue();
    submit();
  }

  function clearHistory() {
    state.stats = RHW.makeStats();
    renderAndSave();
    RHW.ui.setToast("出題履歴をリセットしました。", "neutral");
    focusNativeInput();
  }

  function nextQuestion(message) {
    const modal = document.querySelector("#result-modal");
    if (modal.open) modal.close();
    RHW.ui.closeResetConfirm();
    clearInputFeedback();
    submitAfterComposition = false;
    switchToQuestion(RHW.pickNextQuestion(state, DATA.horses));
    renderAndSave();
    if (typeof message === "string" && message) RHW.ui.setToast(message, "neutral");
    focusNativeInput();
  }

  function switchToQuestion(next) {
    state.question = next.question;
    state.round = next.round;
    state.recentQuestionIds = next.recentQuestionIds;
  }

  function setHistoryTarget(target) {
    if (!["horse", "sire", "dam"].includes(target) || state.round.historyTarget === target) return;
    state.round.historyTarget = target;
    renderAndSave();
    focusNativeInput();
  }

  function renderAndSave() {
    RHW.ui.render(state);
    syncNativeInputValue();
    const persistedRound = structuredClone(state.round);
    delete persistedRound.justSubmittedAttempt;
    persistedRound.recentQuestionIds = state.recentQuestionIds;
    RHW.storage.writeJson(RHW.CONFIG.storageKeys.stats, state.stats);
    RHW.storage.writeJson(RHW.CONFIG.storageKeys.current, persistedRound);
    RHW.storage.writeJson(RHW.CONFIG.storageKeys.options, state.options);
    delete state.round.justSubmittedAttempt;
  }

  function showInputError(message) {
    RHW.ui.setToast(message, "warn");
    document.querySelector(".input-strip").classList.remove("shake");
    void document.querySelector(".input-strip").offsetWidth;
    document.querySelector(".input-strip").classList.add("shake");
    focusNativeInput();
  }

  function clearInputFeedback() {
    RHW.ui.setToast("");
    document.querySelector(".input-strip")?.classList.remove("shake");
  }

  function focusNativeInput() {
    const nativeInput = document.querySelector("#native-input");
    const openDialog = document.querySelector("dialog[open]");
    if (!nativeInput || openDialog) return;
    syncNativeInputValue();
    nativeInput.focus({ preventScroll: true });
  }

  function syncNativeInputValue() {
    const nativeInput = document.querySelector("#native-input");
    if (!nativeInput || composing || nativeInput.value === state.round.currentInput) return;
    nativeInput.value = state.round.currentInput;
  }

  root.addEventListener("DOMContentLoaded", init);
})(typeof globalThis !== "undefined" ? globalThis : window);
