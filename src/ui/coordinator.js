(function attachUi(root) {
  const RHW = root.RHW;
  const UI = RHW.UI_CONSTANTS;
  const renderers = RHW.uiRenderers;
  const text = RHW.text;

  const els = {};

  function initElements() {
    Object.assign(els, {
      horseBoard: document.querySelector("#horse-board"),
      sireBoard: document.querySelector("#sire-board"),
      damBoard: document.querySelector("#dam-board"),
      historyTabs: document.querySelector("#history-tabs"),
      currentTarget: document.querySelector("#current-target"),
      currentInput: document.querySelector("#current-input"),
      inputHint: document.querySelector("#input-hint"),
      sireHintRow: document.querySelector(".hint-row"),
      sireHintButton: document.querySelector("#sire-hint-button"),
      keyboard: document.querySelector("#keyboard"),
      toast: document.querySelector("#toast"),
      statsPanel: document.querySelector("#stats-panel"),
      modal: document.querySelector("#result-modal"),
      modalTitle: document.querySelector("#modal-title"),
      modalBody: document.querySelector("#modal-body"),
      optionsModal: document.querySelector("#options-modal"),
      easyModeInput: document.querySelector("#easy-mode"),
      hideHintsInput: document.querySelector("#hide-hints"),
      decadeFilter: document.querySelector("#decade-filter"),
      winCountFilter: document.querySelector("#win-count-filter"),
      clearHistoryButton: document.querySelector("#clear-history"),
      resetConfirmModal: document.querySelector("#confirm-reset-modal"),
      easyModePromptModal: document.querySelector("#easy-mode-prompt-modal"),
      nextButton: document.querySelector("#next-question")
    });
    text.applyDocumentText(document);
    populateSelect(els.decadeFilter, RHW.OPTION_DECADE_FILTERS);
    populateSelect(els.winCountFilter, RHW.OPTION_WIN_COUNT_FILTERS);
  }

  function renderKeyboard() {
    renderers.renderKeyboard(els.keyboard);
  }

  function setToast(message, tone) {
    if (!message) {
      els.toast.hidden = true;
      return;
    }
    els.toast.textContent = message;
    els.toast.dataset.tone = tone || "neutral";
    els.toast.hidden = false;
    clearTimeout(setToast.timer);
    setToast.timer = setTimeout(() => {
      els.toast.hidden = true;
    }, RHW.CONFIG.rules.toastDurationMs);
  }

  function renderStats(stats, currentQuestion, round, options) {
    const summary = RHW.summarizeStats(stats);
    const rules = RHW.getGameRules(options);
    const recent = summary.recent.length
      ? summary.recent.map((item) => {
        const attempts = item.attemptsUsed ?? item.horseAttemptsUsed ?? item.pedigreeAttemptsUsed ?? "-";
        const status = item.status === "won" ? t("status.won") : t("status.failed");
        return `<li><span>${escapeHtml(item.horseName)}</span><b>${escapeHtml(status)} ${escapeHtml(attempts)}</b></li>`;
      }).join("")
      : `<li><span>${escapeHtml(t("history.empty"))}</span><b>${escapeHtml(t("status.empty"))}</b></li>`;
    const currentLabel = round.status === "playing" ? t("status.playing") : currentQuestion.nameJa;
    const attemptsUsed = RHW.getAttemptsUsed(round);
    const horseStatus = round.targets.horse.solved
      ? t("status.correct")
      : round.status === "lost" ? t("status.failed") : t("status.unsolved");
    const sireStatus = round.targets.sire.solved ? t("status.correct") : t("status.unsolved");
    const damStatus = round.targets.dam.solved ? t("status.correct") : t("status.unsolved");

    els.statsPanel.innerHTML = `
      <div class="stat-grid">
        <div><span>${escapeHtml(t("labels.successRate"))}</span><strong>${summary.successRate}%</strong></div>
        <div><span>${escapeHtml(t("labels.failureRate"))}</span><strong>${summary.failureRate}%</strong></div>
        <div><span>${escapeHtml(t("labels.totalQuestions"))}</span><strong>${summary.total}</strong></div>
        <div><span>${escapeHtml(t("labels.attempt"))}</span><strong>${attemptsUsed}/${rules.attemptLimit}</strong></div>
      </div>
      <div class="current-round">
        <h2>${escapeHtml(t("labels.currentQuestion"))}</h2>
        <p>${escapeHtml(currentLabel)}</p>
        <dl>
          <div><dt>${escapeHtml(t("labels.horseShort"))}</dt><dd>${escapeHtml(horseStatus)}</dd></div>
          <div><dt>${escapeHtml(t("labels.sireShort"))}</dt><dd>${escapeHtml(sireStatus)}</dd></div>
          <div><dt>${escapeHtml(t("labels.damShort"))}</dt><dd>${escapeHtml(damStatus)}</dd></div>
        </dl>
      </div>
      <div class="history-list">
        <div class="history-header"><h2>${escapeHtml(t("labels.questionHistory"))}</h2></div>
        <ul>${recent}</ul>
      </div>
      <div class="legend-panel">
        <h2>${escapeHtml(t("labels.legend"))}</h2>
        <div><span class="legend-swatch correct"></span><p>${escapeHtml(t("legend.correct"))}</p></div>
        <div><span class="legend-swatch present"></span><p>${escapeHtml(t("legend.present"))}</p></div>
        <div><span class="legend-swatch absent"></span><p>${escapeHtml(t("legend.absent"))}</p></div>
      </div>
    `;
  }

  function render(state) {
    const { question, round, stats } = state;
    const answers = RHW.getAnswers(question);
    const rules = RHW.getGameRules(state.options);
    const inputLength = RHW.displayLength(round.currentInput);
    const historyTarget = getHistoryTarget(round);
    const historyAnswer = answers[historyTarget];
    const historyGuesses = round.targets[historyTarget].guesses;
    const historyCols = getBoardCols(historyTarget, historyAnswer, rules);
    const sireGuesses = getPedigreeDisplayGuesses(round.targets.sire.guesses, round.targets.sire.solved);
    const damGuesses = getPedigreeDisplayGuesses(round.targets.dam.guesses, round.targets.dam.solved);
    const showEasyHorseLength = rules.easyMode && historyTarget === "horse";
    const easyHorseRows = showEasyHorseLength
      ? Math.min(rules.attemptLimit, historyGuesses.length + 1)
      : 0;

    renderHistoryTabs(historyTarget);
    els.sireBoard.setAttribute("aria-label", t("aria.board", { label: t("labels.sireShort") }));
    els.damBoard.setAttribute("aria-label", t("aria.board", { label: t("labels.damShort") }));
    els.currentTarget.textContent = t("labels.input");
    els.currentInput.textContent = round.currentInput || UI.placeholderInput;
    els.currentInput.classList.toggle("placeholder", !round.currentInput);
    els.inputHint.textContent = t("input.hint", {
      inputLength,
      maxLength: RHW.MAX_INPUT_LENGTH,
      attemptsUsed: RHW.getAttemptsUsed(round),
      attemptLimit: rules.attemptLimit
    });
    renderSireHint(round, state.options);

    renderers.renderBoard(els.horseBoard, {
      answer: historyAnswer,
      guesses: historyGuesses,
      limit: rules.attemptLimit,
      currentInput: "",
      showInput: false,
      minRows: easyHorseRows,
      cols: historyCols,
      animateAttempt: round.justSubmittedAttempt,
      padRows: showEasyHorseLength
    });

    renderers.renderBoard(els.sireBoard, {
      answer: answers.sire,
      guesses: sireGuesses,
      limit: rules.attemptLimit,
      currentInput: "",
      showInput: false,
      minRows: 1,
      cols: UI.pedigreeBoardCols,
      animateAttempt: round.justSubmittedAttempt
    });

    renderers.renderBoard(els.damBoard, {
      answer: answers.dam,
      guesses: damGuesses,
      limit: rules.attemptLimit,
      currentInput: "",
      showInput: false,
      minRows: 1,
      cols: UI.pedigreeBoardCols,
      animateAttempt: round.justSubmittedAttempt
    });

    renderStats(stats, question, round, state.options);
    renderOptions(state.options, stats);
    renderers.updateKeyboardState(els.keyboard, round, answers, historyTarget);
  }

  function openResultModal(state) {
    const { question, round, stats } = state;
    const answers = RHW.getAnswers(question);
    const summary = RHW.summarizeStats(stats);
    const rules = RHW.getGameRules(state.options);
    const isResult = round.status !== "playing";
    els.modalTitle.textContent = isResult
      ? round.status === "won" ? t("modal.wonTitle") : t("modal.lostTitle")
      : t("modal.statsTitle");
    els.modalBody.innerHTML = `
      <div class="answer-card">
        <span>${escapeHtml(t("labels.horseShort"))}</span><strong>${escapeHtml(answers.horse.display)}</strong>
        <span>${escapeHtml(t("labels.sireShort"))}</span><strong>${escapeHtml(answers.sire.display)}</strong>
        <span>${escapeHtml(t("labels.damShort"))}</span><strong>${escapeHtml(answers.dam.display)}</strong>
      </div>
      <div class="stat-grid modal-grid">
        <div><span>${escapeHtml(t("labels.attempt"))}</span><strong>${RHW.getAttemptsUsed(round)}/${rules.attemptLimit}</strong></div>
        <div><span>${escapeHtml(t("labels.pedigree"))}</span><strong>${round.targets.sire.solved ? escapeHtml(t("labels.sireShort")) : escapeHtml(t("status.empty"))} / ${round.targets.dam.solved ? escapeHtml(t("labels.damShort")) : escapeHtml(t("status.empty"))}</strong></div>
        <div><span>${escapeHtml(t("labels.successRate"))}</span><strong>${summary.successRate}%</strong></div>
        <div><span>${escapeHtml(t("labels.failureRate"))}</span><strong>${summary.failureRate}%</strong></div>
      </div>
      <div class="wins">
        <h3>${escapeHtml(t("labels.mainWins"))}</h3>
        <ul>${question.wins.map((win) => `<li>${escapeHtml(win.year)} ${escapeHtml(win.raceNameJa)}</li>`).join("")}</ul>
      </div>
    `;
    els.nextButton.hidden = !isResult;
    els.modal.showModal();
  }

  function openOptionsModal(state) {
    renderOptions(state.options, state.stats);
    if (!els.optionsModal.open) els.optionsModal.showModal();
  }

  function closeOptionsModal() {
    if (els.optionsModal.open) els.optionsModal.close();
  }

  function renderOptions(options, stats) {
    if (!els.easyModeInput || !els.hideHintsInput || !els.decadeFilter || !els.winCountFilter || !els.clearHistoryButton) return;
    const nextOptions = RHW.makeOptions(options);
    els.easyModeInput.checked = nextOptions.easyMode;
    els.hideHintsInput.checked = nextOptions.hideHints;
    els.decadeFilter.value = nextOptions.decadeFilter;
    els.winCountFilter.value = nextOptions.winCountFilter;
    els.clearHistoryButton.disabled = !RHW.summarizeStats(stats).total;
  }

  function openResetConfirm() {
    if (!els.resetConfirmModal.open) els.resetConfirmModal.showModal();
  }

  function closeResetConfirm() {
    if (els.resetConfirmModal.open) els.resetConfirmModal.close();
  }

  function openEasyModePrompt() {
    if (!els.easyModePromptModal.open) els.easyModePromptModal.showModal();
  }

  function closeEasyModePrompt() {
    if (els.easyModePromptModal.open) els.easyModePromptModal.close();
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;");
  }

  function renderHistoryTabs(activeTarget) {
    if (!els.historyTabs) return;
    els.historyTabs.querySelectorAll("[data-history-target]").forEach((button) => {
      const selected = button.dataset.historyTarget === activeTarget;
      button.setAttribute("aria-selected", String(selected));
      button.tabIndex = selected ? 0 : -1;
    });
    const label = activeTarget === "sire"
      ? t("labels.sireName")
      : activeTarget === "dam" ? t("labels.damName") : t("labels.horseName");
    els.horseBoard.setAttribute("aria-label", t("aria.board", { label }));
  }

  function getHistoryTarget(round) {
    return ["horse", "sire", "dam"].includes(round.historyTarget) ? round.historyTarget : "horse";
  }

  function getBoardCols(target, answer, rules) {
    if (target === "horse" && rules.easyMode) {
      return RHW.splitAnswer(answer.display).length;
    }
    return target === "horse" ? UI.horseBoardCols : UI.pedigreeBoardCols;
  }

  function getPedigreeDisplayGuesses(guesses, solved) {
    if (!guesses.length) return [];
    if (solved) {
      const correct = guesses.find((guess) => guess.correct);
      return correct ? [correct] : [guesses[guesses.length - 1]];
    }
    return [guesses[guesses.length - 1]];
  }

  function renderSireHint(round, options) {
    if (!els.sireHintButton) return;
    const sireSolved = Boolean(round.targets?.sire?.solved)
      || Boolean(round.targets?.sire?.guesses?.some((guess) => guess.correct));
    const canUse = !options?.hideHints && !sireSolved && RHW.canUseSireHint(round, options);
    if (els.sireHintRow) els.sireHintRow.hidden = !canUse;
    els.sireHintButton.hidden = !canUse;
    els.sireHintButton.disabled = !canUse;
  }

  function populateSelect(select, filters) {
    if (!select || !Array.isArray(filters) || select.options.length) return;
    filters.forEach((filter) => {
      const option = document.createElement("option");
      option.value = filter.value;
      option.textContent = filter.label;
      select.append(option);
    });
  }

  function t(path, params) {
    return text?.format(path, params) || "";
  }

  const api = {
    initElements,
    render,
    renderKeyboard,
    setToast,
    openResultModal,
    openOptionsModal,
    closeOptionsModal,
    openResetConfirm,
    closeResetConfirm,
    openEasyModePrompt,
    closeEasyModePrompt
  };
  root.RHW = Object.assign(RHW, { ui: api });
})(typeof globalThis !== "undefined" ? globalThis : window);
