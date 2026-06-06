(function attachUiRenderers(root) {
  const RHW = root.RHW;
  const UI = RHW.UI_CONSTANTS;
  const flipDelayMs = RHW.CONFIG.rules.tileFlipDelayMs;

  function createTile(char, state, delay) {
    const tile = document.createElement("span");
    tile.className = `tile ${state || "empty"}`;
    tile.textContent = char || "";
    tile.style.setProperty("--flip-delay", `${delay || 0}ms`);
    return tile;
  }

  function renderBoard(container, options) {
    const { answer, guesses, limit, currentInput, showInput, minRows, cols, animateAttempt, padRows = true } = options;
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
      const rowCols = padRows ? Math.max(row.cols || colCount, colCount) : Math.max(row.cols || colCount, 1);
      rowEl.style.setProperty("--cols", rowCols);
      for (let index = 0; index < rowCols; index += 1) {
        rowEl.append(createTile(row.chars[index], row.states[index], index * flipDelayMs));
      }
      container.append(rowEl);
    });

    container.scrollTop = container.scrollHeight;
  }

  function renderKeyboard(container) {
    container.innerHTML = "";
    UI.kanaRows.forEach((row) => {
      const rowEl = document.createElement("div");
      rowEl.className = row.includes(UI.specialKeys.submit) ? "keyboard-row utility-row" : "keyboard-row kana-row";
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
        button.className = `key${key.length > 1 ? " wide" : ""}${key === UI.specialKeys.submit ? " submit" : ""}`;
        button.textContent = key;
        button.dataset.key = key;
        rowEl.append(button);
      });
      container.append(rowEl);
    });
  }

  function updateKeyboardState(container, round, answers, activeTarget) {
    if (!container) return;
    const target = ["horse", "sire", "dam"].includes(activeTarget) ? activeTarget : "horse";
    const absentKeys = getTargetAbsentKeys(round, answers[target], target);
    container.querySelectorAll("[data-key]").forEach((button) => {
      button.classList.toggle("absent-known", absentKeys.has(button.dataset.key));
    });
  }

  function getTargetAbsentKeys(round, answer, target) {
    const statesByKey = new Map();
    const answerKeys = new Set(
      RHW.splitAnswer(answer.display).map(toKeyboardKey).filter(Boolean)
    );

    (round.targets[target]?.guesses || []).forEach((guess) => {
      guess.evaluation.forEach((item) => {
        const key = toKeyboardKey(item.char);
        if (!key) return;
        const entry = statesByKey.get(key) || { absent: false, included: false };
        if (item.state === "correct" || item.state === "present") entry.included = true;
        if (item.state === "absent") entry.absent = true;
        statesByKey.set(key, entry);
      });
    });

    return new Set(Array.from(statesByKey.entries())
      .filter(([key, entry]) => entry.absent && !entry.included && !answerKeys.has(key))
      .map(([key]) => key));
  }

  function toKeyboardKey(char) {
    if (!char) return "";
    const normalized = String(char).normalize("NFKC");
    if (Object.values(UI.specialKeys).includes(normalized)) return "";
    return UI.keyEquivalents.get(normalized) || normalized;
  }

  const api = {
    renderBoard,
    renderKeyboard,
    updateKeyboardState
  };

  root.RHW = Object.assign(RHW, { uiRenderers: api });
  if (typeof module !== "undefined") {
    module.exports = api;
  }
})(typeof globalThis !== "undefined" ? globalThis : window);
