(function attachUi(root) {
  const RHW = root.RHW;

  const els = {};
  const KANA_ROWS = [
    ["ア", "カ", "サ", "タ", "ナ", "ハ", "マ", "ヤ", "ラ", "ワ"],
    ["イ", "キ", "シ", "チ", "ニ", "ヒ", "ミ", "", "リ", "ヲ"],
    ["ウ", "ク", "ス", "ツ", "ヌ", "フ", "ム", "ユ", "ル", "ン"],
    ["エ", "ケ", "セ", "テ", "ネ", "ヘ", "メ", "", "レ", "ー"],
    ["オ", "コ", "ソ", "ト", "ノ", "ホ", "モ", "ヨ", "ロ", ""],
    ["小", "゛", "゜", "消", "決定"]
  ];

  function initElements() {
    Object.assign(els, {
      app: document.querySelector("#app"),
      horseBoard: document.querySelector("#horse-board"),
      sireBoard: document.querySelector("#sire-board"),
      damBoard: document.querySelector("#dam-board"),
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

  function renderBoard(container, options) {
    const { answer, guesses, limit, currentInput, showInput, minRows, cols, animateAttempt } = options;
    container.innerHTML = "";
    const colCount = Math.max(cols || RHW.splitAnswer(answer.display).length || 1, 1);
    container.style.setProperty("--cols", colCount);
    const rows = [];

    guesses.forEach((guess, index) => {
      const chars = RHW.splitAnswer(guess.value);
      rows.push({
        chars,
        states: guess.evaluation.map((item) => item.state),
        cols: Math.max(chars.length, 1),
        attempt: guess.attempt || index + 1,
        evaluated: true
      });
    });

    if (showInput && currentInput && guesses.length < limit) {
      const chars = RHW.splitAnswer(currentInput);
      rows.push({
        chars,
        states: [],
        cols: Math.max(chars.length, 1),
        active: true
      });
    }

    while (rows.length < (minRows || 0)) {
      rows.push({ chars: [], states: [] });
    }

    rows.forEach((row) => {
      const rowEl = document.createElement("div");
      const shouldAnimate = row.evaluated && row.attempt === animateAttempt;
      rowEl.className = `tile-row${row.evaluated ? " evaluated" : ""}${shouldAnimate ? " animate" : " settled"}${row.active ? " active" : ""}`;
      const rowCols = row.cols || colCount;
      rowEl.style.setProperty("--cols", rowCols);
      for (let index = 0; index < rowCols; index += 1) {
        rowEl.append(createTile(row.chars[index], row.states[index], index * 80));
      }
      container.append(rowEl);
    });

    container.scrollTop = container.scrollHeight;
  }

  function renderKeyboard() {
    els.keyboard.innerHTML = "";
    KANA_ROWS.forEach((row) => {
      const rowEl = document.createElement("div");
      rowEl.className = row.length === 2 ? "keyboard-row utility-row" : "keyboard-row kana-row";
      row.forEach((key) => {
        if (!key) {
          const spacer = document.createElement("span");
          spacer.className = "key-spacer";
          spacer.setAttribute("aria-hidden", "true");
          rowEl.append(spacer);
          return;
        }
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
        <h2>出題履歴</h2>
        <ul>${recent}</ul>
      </div>
      <div class="legend-panel">
        <h2>凡例</h2>
        <div><span class="legend-swatch correct"></span><p>位置も文字も正解</p></div>
        <div><span class="legend-swatch present"></span><p>位置違いで含まれる</p></div>
        <div><span class="legend-swatch absent"></span><p>その対象名には含まれない</p></div>
        <p class="legend-note">父と母は正解後、その判定行で固定されます。</p>
      </div>
    `;
  }

  function render(state) {
    const { question, round, stats } = state;
    const answers = RHW.getAnswers(question);
    const inputLength = RHW.displayLength(round.currentInput);
    const sireGuesses = getPedigreeDisplayGuesses(round.targets.sire.guesses, round.targets.sire.solved);
    const damGuesses = getPedigreeDisplayGuesses(round.targets.dam.guesses, round.targets.dam.solved);

    els.currentTarget.textContent = "入力";
    els.currentInput.textContent = round.currentInput || "入力待ち";
    els.currentInput.classList.toggle("placeholder", !round.currentInput);
    els.inputHint.textContent = `${inputLength}/${RHW.MAX_INPUT_LENGTH}文字 / ${RHW.getAttemptsUsed(round)}/${RHW.ATTEMPT_LIMIT}`;
    document.querySelector("#sire-status").textContent = round.targets.sire.solved ? "固定" : "Wordle";
    document.querySelector("#dam-status").textContent = round.targets.dam.solved ? "固定" : "Wordle";

    renderBoard(els.horseBoard, {
      answer: answers.horse,
      guesses: round.targets.horse.guesses,
      limit: RHW.ATTEMPT_LIMIT,
      currentInput: round.currentInput,
      showInput: round.status === "playing",
      minRows: 0,
      cols: null,
      animateAttempt: round.justSubmittedAttempt
    });

    renderBoard(els.sireBoard, {
      answer: answers.sire,
      guesses: sireGuesses,
      limit: RHW.ATTEMPT_LIMIT,
      currentInput: "",
      showInput: false,
      minRows: 0,
      cols: null,
      animateAttempt: round.justSubmittedAttempt
    });

    renderBoard(els.damBoard, {
      answer: answers.dam,
      guesses: damGuesses,
      limit: RHW.ATTEMPT_LIMIT,
      currentInput: "",
      showInput: false,
      minRows: 0,
      cols: null,
      animateAttempt: round.justSubmittedAttempt
    });

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

  function escapeHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;");
  }

  function getPedigreeDisplayGuesses(guesses, solved) {
    if (!guesses.length) return [];
    if (solved) {
      const correct = guesses.find((guess) => guess.correct);
      return correct ? [correct] : [guesses[guesses.length - 1]];
    }
    return [guesses[guesses.length - 1]];
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
