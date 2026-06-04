(function attachUi(root) {
  const RHW = root.RHW;
  const UI = RHW.UI_CONSTANTS;
  const renderers = RHW.uiRenderers;

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
      hideHintsInput: document.querySelector("#hide-hints"),
      decadeFilter: document.querySelector("#decade-filter"),
      clearHistoryButton: document.querySelector("#clear-history"),
      resetConfirmModal: document.querySelector("#confirm-reset-modal"),
      nextButton: document.querySelector("#next-question")
    });
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
    }, 2600);
  }

  function renderStats(stats, currentQuestion, round) {
    const summary = RHW.summarizeStats(stats);
    const recent = summary.recent.length
      ? summary.recent.map((item) => {
        const attempts = item.attemptsUsed ?? item.horseAttemptsUsed ?? item.pedigreeAttemptsUsed ?? "-";
        return `<li><span>${escapeHtml(item.horseName)}</span><b>${item.status === "won" ? "成功" : "失敗"} ${attempts}</b></li>`;
      }).join("")
      : "<li><span>まだ出題履歴がありません</span><b>-</b></li>";
    const currentLabel = round.status === "playing" ? "挑戦中" : currentQuestion.nameJa;
    const attemptsUsed = RHW.getAttemptsUsed(round);

    els.statsPanel.innerHTML = `
      <div class="stat-grid">
        <div><span>正答率</span><strong>${summary.successRate}%</strong></div>
        <div><span>失敗率</span><strong>${summary.failureRate}%</strong></div>
        <div><span>総問題</span><strong>${summary.total}</strong></div>
        <div><span>挑戦</span><strong>${attemptsUsed}/${RHW.ATTEMPT_LIMIT}</strong></div>
      </div>
      <div class="current-round">
        <h2>現在の出題</h2>
        <p>${escapeHtml(currentLabel)}</p>
        <dl>
          <div><dt>馬名</dt><dd>${round.targets.horse.solved ? "正解" : round.status === "lost" ? "失敗" : "未正解"}</dd></div>
          <div><dt>父</dt><dd>${round.targets.sire.solved ? "正解" : "未正解"}</dd></div>
          <div><dt>母</dt><dd>${round.targets.dam.solved ? "正解" : "未正解"}</dd></div>
        </dl>
      </div>
      <div class="history-list">
        <div class="history-header"><h2>出題履歴</h2></div>
        <ul>${recent}</ul>
      </div>
      <div class="legend-panel">
        <h2>凡例</h2>
        <div><span class="legend-swatch correct"></span><p>位置も文字も正解</p></div>
        <div><span class="legend-swatch present"></span><p>位置違いで含まれる</p></div>
        <div><span class="legend-swatch absent"></span><p>その対象名には含まれない</p></div>
      </div>
    `;
  }

  function render(state) {
    const { question, round, stats } = state;
    const answers = RHW.getAnswers(question);
    const inputLength = RHW.displayLength(round.currentInput);
    const historyTarget = getHistoryTarget(round);
    const historyAnswer = answers[historyTarget];
    const historyGuesses = round.targets[historyTarget].guesses;
    const historyCols = getBoardCols(historyTarget);
    const sireGuesses = getPedigreeDisplayGuesses(round.targets.sire.guesses, round.targets.sire.solved);
    const damGuesses = getPedigreeDisplayGuesses(round.targets.dam.guesses, round.targets.dam.solved);

    renderHistoryTabs(historyTarget);
    els.currentTarget.textContent = "入力";
    els.currentInput.textContent = round.currentInput || UI.placeholderInput;
    els.currentInput.classList.toggle("placeholder", !round.currentInput);
    els.inputHint.textContent = `${inputLength}/${RHW.MAX_INPUT_LENGTH}文字 / ${RHW.getAttemptsUsed(round)}/${RHW.ATTEMPT_LIMIT}`;
    renderSireHint(round, state.options);

    renderers.renderBoard(els.horseBoard, {
      answer: historyAnswer,
      guesses: historyGuesses,
      limit: RHW.ATTEMPT_LIMIT,
      currentInput: "",
      showInput: false,
      minRows: 0,
      cols: historyCols,
      animateAttempt: round.justSubmittedAttempt,
      padRows: false
    });

    renderers.renderBoard(els.sireBoard, {
      answer: answers.sire,
      guesses: sireGuesses,
      limit: RHW.ATTEMPT_LIMIT,
      currentInput: "",
      showInput: false,
      minRows: 1,
      cols: UI.pedigreeBoardCols,
      animateAttempt: round.justSubmittedAttempt
    });

    renderers.renderBoard(els.damBoard, {
      answer: answers.dam,
      guesses: damGuesses,
      limit: RHW.ATTEMPT_LIMIT,
      currentInput: "",
      showInput: false,
      minRows: 1,
      cols: UI.pedigreeBoardCols,
      animateAttempt: round.justSubmittedAttempt
    });

    renderStats(stats, question, round);
    renderOptions(state.options, stats);
    renderers.updateKeyboardState(els.keyboard, round, answers);
  }

  function openResultModal(state) {
    const { question, round, stats } = state;
    const answers = RHW.getAnswers(question);
    const summary = RHW.summarizeStats(stats);
    const isResult = round.status !== "playing";
    els.modalTitle.textContent = isResult
      ? round.status === "won" ? "正解" : "失敗"
      : "統計";
    els.modalBody.innerHTML = `
      <div class="answer-card">
        <span>馬名</span><strong>${escapeHtml(answers.horse.display)}</strong>
        <span>父</span><strong>${escapeHtml(answers.sire.display)}</strong>
        <span>母</span><strong>${escapeHtml(answers.dam.display)}</strong>
      </div>
      <div class="stat-grid modal-grid">
        <div><span>挑戦</span><strong>${RHW.getAttemptsUsed(round)}/${RHW.ATTEMPT_LIMIT}</strong></div>
        <div><span>父母</span><strong>${round.targets.sire.solved ? "父" : "-"} / ${round.targets.dam.solved ? "母" : "-"}</strong></div>
        <div><span>正答率</span><strong>${summary.successRate}%</strong></div>
        <div><span>失敗率</span><strong>${summary.failureRate}%</strong></div>
      </div>
      <div class="wins">
        <h3>主な勝利</h3>
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
    if (!els.hideHintsInput || !els.decadeFilter || !els.clearHistoryButton) return;
    const nextOptions = RHW.makeOptions(options);
    els.hideHintsInput.checked = nextOptions.hideHints;
    els.decadeFilter.value = nextOptions.decadeFilter;
    els.clearHistoryButton.disabled = !RHW.summarizeStats(stats).total;
  }

  function openResetConfirm() {
    if (!els.resetConfirmModal.open) els.resetConfirmModal.showModal();
  }

  function closeResetConfirm() {
    if (els.resetConfirmModal.open) els.resetConfirmModal.close();
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
    const label = activeTarget === "sire" ? "父名" : activeTarget === "dam" ? "母名" : "馬名";
    els.horseBoard.setAttribute("aria-label", `${label}ボード`);
  }

  function getHistoryTarget(round) {
    return ["horse", "sire", "dam"].includes(round.historyTarget) ? round.historyTarget : "horse";
  }

  function getBoardCols(target) {
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
    const canUse = !options?.hideHints && RHW.canUseSireHint(round);
    if (els.sireHintRow) els.sireHintRow.hidden = !canUse;
    els.sireHintButton.hidden = !canUse;
    els.sireHintButton.disabled = !canUse;
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
    closeResetConfirm
  };
  root.RHW = Object.assign(RHW, { ui: api });
})(typeof globalThis !== "undefined" ? globalThis : window);
