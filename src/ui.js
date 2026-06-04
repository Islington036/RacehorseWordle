(function attachUi(root) {
  const RHW = root.RHW;

  const els = {};
  const KANA_ROWS = [
    ["ワ", "ラ", "ヤ", "マ", "ハ", "ナ", "タ", "サ", "カ", "ア"],
    ["ヲ", "リ", "ユ", "ミ", "ヒ", "ニ", "チ", "シ", "キ", "イ"],
    ["ン", "ル", "ヨ", "ム", "フ", "ヌ", "ツ", "ス", "ク", "ウ"],
    ["ー", "レ", "メ", "ヘ", "ネ", "テ", "セ", "ケ", "エ"],
    ["消", "ロ", "モ", "ホ", "ノ", "ト", "ソ", "コ", "オ", "決定"]
  ];

  function initElements() {
    Object.assign(els, {
      app: document.querySelector("#app"),
      horseBoard: document.querySelector("#horse-board"),
      pedigreeBoard: document.querySelector("#pedigree-board"),
      targetButtons: Array.from(document.querySelectorAll("[data-target]")),
      currentTarget: document.querySelector("#current-target"),
      currentInput: document.querySelector("#current-input"),
      inputHint: document.querySelector("#input-hint"),
      keyboard: document.querySelector("#keyboard"),
      toast: document.querySelector("#toast"),
      statsPanel: document.querySelector("#stats-panel"),
      modal: document.querySelector("#result-modal"),
      modalTitle: document.querySelector("#modal-title"),
      modalBody: document.querySelector("#modal-body"),
      nextButton: document.querySelector("#next-question"),
      statsButton: document.querySelector("#stats-button"),
      resetButton: document.querySelector("#reset-button"),
      closeModal: document.querySelector("#close-modal")
    });
  }

  function createTile(char, state, delay) {
    const tile = document.createElement("span");
    tile.className = `tile ${state || "empty"}`;
    tile.textContent = char || "";
    tile.style.setProperty("--flip-delay", `${delay || 0}ms`);
    return tile;
  }

  function renderBoard(container, answer, guesses, limit, currentInput, isActive) {
    container.innerHTML = "";
    const cols = Math.max(1, RHW.splitAnswer(answer.display).length);
    container.style.setProperty("--cols", cols);
    const rows = [];

    guesses.forEach((guess) => {
      rows.push({
        chars: RHW.splitAnswer(guess.value),
        states: guess.evaluation.map((item) => item.state),
        evaluated: true
      });
    });

    if (isActive && guesses.length < limit) {
      rows.push({
        chars: RHW.splitAnswer(currentInput),
        states: [],
        active: true
      });
    }

    while (rows.length < Math.min(limit, 6)) {
      rows.push({ chars: [], states: [] });
    }

    rows.slice(-Math.max(6, Math.min(limit, rows.length))).forEach((row) => {
      const rowEl = document.createElement("div");
      rowEl.className = `tile-row${row.evaluated ? " evaluated" : ""}${row.active ? " active" : ""}`;
      rowEl.style.setProperty("--cols", cols);
      for (let index = 0; index < cols; index += 1) {
        rowEl.append(createTile(row.chars[index], row.states[index], index * 80));
      }
      container.append(rowEl);
    });
  }

  function renderKeyboard() {
    els.keyboard.innerHTML = "";
    KANA_ROWS.forEach((row) => {
      const rowEl = document.createElement("div");
      rowEl.className = "keyboard-row";
      row.forEach((key) => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = key.length > 1 ? "key wide" : "key";
        button.textContent = key;
        button.dataset.key = key;
        rowEl.append(button);
      });
      els.keyboard.append(rowEl);
    });
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
      ? summary.recent.map((item) => `<li><span>${escapeHtml(item.horseName)}</span><b>${item.status === "won" ? "成功" : "失敗"}</b></li>`).join("")
      : "<li><span>まだ出題履歴がありません</span><b>-</b></li>";
    const currentLabel = round.status === "playing" ? "挑戦中" : currentQuestion.nameJa;

    els.statsPanel.innerHTML = `
      <div class="stat-grid">
        <div><span>正答率</span><strong>${summary.successRate}%</strong></div>
        <div><span>失敗率</span><strong>${summary.failureRate}%</strong></div>
        <div><span>総問題</span><strong>${summary.total}</strong></div>
        <div><span>血統</span><strong>${round.pedigreeAttemptsUsed}/15</strong></div>
      </div>
      <div class="current-round">
        <h2>現在の出題</h2>
        <p>${escapeHtml(currentLabel)}</p>
        <dl>
          <div><dt>馬名</dt><dd>${round.horseAttemptsUsed}/5</dd></div>
          <div><dt>父</dt><dd>${round.targets.sire.solved ? "正解" : round.pedigreeRevealed ? "開示" : "未正解"}</dd></div>
          <div><dt>母</dt><dd>${round.targets.dam.solved ? "正解" : round.pedigreeRevealed ? "開示" : "未正解"}</dd></div>
        </dl>
      </div>
      <div class="history-list">
        <h2>出題履歴</h2>
        <ul>${recent}</ul>
      </div>
    `;
  }

  function render(state) {
    const { question, round, stats } = state;
    const answers = RHW.getAnswers(question);
    const active = round.activeTarget;
    const activeAnswer = answers[active];
    const targetLabel = RHW.CONFIG.targets[active].label;

    els.targetButtons.forEach((button) => {
      const selected = button.dataset.target === active;
      button.setAttribute("aria-pressed", String(selected));
      button.classList.toggle("selected", selected);
    });

    els.currentTarget.textContent = targetLabel;
    els.currentInput.textContent = round.currentInput || "入力待ち";
    els.currentInput.classList.toggle("placeholder", !round.currentInput);

    const activeLength = RHW.displayLength(activeAnswer.display);
    const attempts = RHW.getAttemptsUsed(round, active);
    const limit = active === "horse" ? 5 : 15;
    els.inputHint.textContent = `${activeLength}文字 / ${attempts}/${limit}`;

    renderBoard(
      els.horseBoard,
      answers.horse,
      round.targets.horse.guesses,
      5,
      active === "horse" ? round.currentInput : "",
      active === "horse" && round.status === "playing"
    );

    const pedigreeAnswer = answers[active === "dam" ? "dam" : "sire"];
    const pedigreeTarget = active === "dam" ? "dam" : "sire";
    renderBoard(
      els.pedigreeBoard,
      pedigreeAnswer,
      round.targets[pedigreeTarget].guesses,
      15,
      active === pedigreeTarget ? round.currentInput : "",
      active === pedigreeTarget && round.status === "playing" && !round.pedigreeRevealed
    );

    document.querySelector("#pedigree-title").textContent = `${RHW.CONFIG.targets[pedigreeTarget].label} Wordle`;
    document.querySelector("#pedigree-count").textContent = `血統 ${round.pedigreeAttemptsUsed}/15`;
    document.querySelector("#reveal-line").textContent = round.pedigreeRevealed
      ? `父: ${answers.sire.display} / 母: ${answers.dam.display}`
      : "父母は15回まで合算で挑戦できます";

    renderStats(stats, question, round);
  }

  function openResultModal(state, mode) {
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
        <div><span>馬名</span><strong>${round.horseAttemptsUsed}/5</strong></div>
        <div><span>血統</span><strong>${round.pedigreeAttemptsUsed}/15</strong></div>
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

  function escapeHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;");
  }

  const api = {
    initElements,
    render,
    renderKeyboard,
    setToast,
    openResultModal
  };
  root.RHW = Object.assign(RHW, { ui: api });
})(typeof globalThis !== "undefined" ? globalThis : window);
