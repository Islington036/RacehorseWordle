(function attachText(root) {
  const TEXT = {
    app: {
      title: "Racehorse Wordle",
      fatalDataMessage: "問題データを読み込めませんでした。"
    },
    aria: {
      optionsButton: "オプションを表示",
      resetButton: "別の問題を出題",
      game: "ゲーム",
      historyTabs: "判定履歴",
      nativeInput: "カタカナ入力",
      keyboard: "かなキーボード",
      statsPanel: "スコアと履歴",
      close: "閉じる",
      board: "{label}ボード"
    },
    title: {
      optionsButton: "オプション",
      resetButton: "別の問題"
    },
    labels: {
      horseName: "馬名",
      sireName: "父名",
      damName: "母名",
      horseShort: "馬名",
      sireShort: "父",
      damShort: "母",
      pedigree: "父母",
      input: "入力",
      attempt: "挑戦",
      successRate: "正答率",
      failureRate: "失敗率",
      totalQuestions: "総問題",
      currentQuestion: "現在の出題",
      questionHistory: "出題履歴",
      legend: "凡例",
      mainWins: "主な勝利"
    },
    status: {
      playing: "挑戦中",
      correct: "正解",
      failed: "失敗",
      unsolved: "未正解",
      won: "成功",
      empty: "-"
    },
    input: {
      placeholder: "キーボードで直接入力できます",
      hint: "{inputLength}/{maxLength}文字 / {attemptsUsed}/{attemptLimit}"
    },
    actions: {
      sireHint: "1回消費してヒントを表示",
      nextQuestion: "次の問題へ",
      clearHistory: "履歴リセット",
      normalMode: "通常モード",
      easyMode: "簡単モード",
      cancel: "キャンセル",
      reset: "リセットする"
    },
    options: {
      title: "オプション",
      easyMode: "簡単モード",
      hideHints: "ヒントを表示しない",
      decadeFilter: "次の問題から出題する年代を制限",
      winCountFilter: "G1勝利数",
      decadeFilters: {
        all: "制限なし",
        "1990": "1990年代以降",
        "2000": "2000年代以降",
        "2010": "2010年代以降",
        "2020": "2020年代以降"
      },
      winCountFilters: {
        all: "制限無し",
        "2": "2勝以上",
        "3": "3勝以上",
        "4": "4勝以上",
        "5plus": "5勝以上"
      }
    },
    modal: {
      statsTitle: "統計",
      wonTitle: "正解",
      lostTitle: "失敗"
    },
    easyModePrompt: {
      title: "簡単モードで始めますか？",
      body: "馬名の文字数が見えるようになり、挑戦回数は{easyAttemptLimit}回になります。父名ヒントは{easyHintTiming}使えます。"
    },
    resetConfirm: {
      title: "本当にリセットしますか？",
      body: "現在の問題を失敗扱いにして、答えを表示します。"
    },
    legend: {
      correct: "位置も文字も正解",
      present: "位置違いで含まれる",
      absent: "その対象名には含まれない"
    },
    history: {
      empty: "まだ出題履歴がありません"
    },
    messages: {
      cannotSubmitMore: "これ以上入力できません。",
      minOneChar: "1文字以上入力してください。",
      maxChars: "{maxLength}文字以内で入力してください。",
      horseCorrect: "馬名が正解です。",
      pedigreeCorrect: "{targets}が正解です。",
      invalidInput: "使用できない文字が含まれています",
      attemptsUsedUp: "{attemptLimit}回を使い切りました。",
      easyModeSaved: "簡単モード設定を保存しました。",
      optionsSaved: "オプションを保存しました。次の問題から反映されます。",
      easyModeStarted: "簡単モードで始めます。",
      normalModeStarted: "通常モードで始めます。",
      historyCleared: "出題履歴をリセットしました。"
    },
    keyboard: {
      small: "小",
      dakuten: "゛",
      handakuten: "゜",
      backspace: "消",
      submit: "決定",
      rows: [
        ["ワ", "ラ", "ヤ", "マ", "ハ", "ナ", "タ", "サ", "カ", "ア"],
        ["ヲ", "リ", "", "ミ", "ヒ", "ニ", "チ", "シ", "キ", "イ"],
        ["ン", "ル", "ユ", "ム", "フ", "ヌ", "ツ", "ス", "ク", "ウ"],
        ["", "レ", "", "メ", "ヘ", "ネ", "テ", "セ", "ケ", "エ"],
        ["", "ロ", "ヨ", "モ", "ホ", "ノ", "ト", "ソ", "コ", "オ"],
        ["", "", "", "", "小", "゛", "゜", "ー", "消", "決定"]
      ]
    },
    particles: {
      and: "と"
    }
  };

  function get(path, fallback) {
    const parts = String(path || "").split(".");
    let value = TEXT;
    for (const part of parts) {
      value = value?.[part];
    }
    return value ?? fallback ?? "";
  }

  function formatValue(value, params) {
    return String(value ?? "").replace(/\{([a-zA-Z0-9_]+)\}/g, (_, key) =>
      Object.prototype.hasOwnProperty.call(params || {}, key) ? params[key] : ""
    );
  }

  function format(path, params, fallback) {
    return formatValue(get(path, fallback), Object.assign(defaultParams(), params || {}));
  }

  function defaultParams() {
    const config = root.RHW.CONFIG;
    const rules = config.rules;
    const easy = rules.easy;
    const easyAttemptLimit = easy.attemptLimit;
    const easyHintUnlockAttempts = easy.sireHintUnlockAttempts;
    return {
      maxLength: rules.maxInputLength,
      normalAttemptLimit: rules.normal.attemptLimit,
      easyAttemptLimit,
      easyHintTiming: easyHintUnlockAttempts === 0
        ? "最初から"
        : `${easyHintUnlockAttempts + 1}回目から`
    };
  }

  function applyDocumentText(doc) {
    if (!doc) return;
    doc.title = get("app.title");
    doc.querySelectorAll("[data-text]").forEach((element) => {
      element.textContent = format(element.dataset.text);
    });
    doc.querySelectorAll("[data-label]").forEach((element) => {
      element.setAttribute("aria-label", format(element.dataset.label));
    });
    doc.querySelectorAll("[data-title]").forEach((element) => {
      element.setAttribute("title", format(element.dataset.title));
    });
  }

  const api = { get, format, formatValue, applyDocumentText };
  root.RHW = Object.assign(root.RHW || {}, { TEXT, text: api });
  if (typeof module !== "undefined") {
    module.exports = { TEXT, text: api };
  }
})(typeof globalThis !== "undefined" ? globalThis : window);
