(function attachUiConstants(root) {
  const UI_CONSTANTS = {
    horseBoardCols: 9,
    pedigreeBoardCols: 18,
    placeholderInput: "キーボードで直接入力できます",
    kanaRows: [
      ["ワ", "ラ", "ヤ", "マ", "ハ", "ナ", "タ", "サ", "カ", "ア"],
      ["ヲ", "リ", "", "ミ", "ヒ", "ニ", "チ", "シ", "キ", "イ"],
      ["ン", "ル", "ユ", "ム", "フ", "ヌ", "ツ", "ス", "ク", "ウ"],
      ["", "レ", "", "メ", "ヘ", "ネ", "テ", "セ", "ケ", "エ"],
      ["", "ロ", "ヨ", "モ", "ホ", "ノ", "ト", "ソ", "コ", "オ"],
      ["", "", "", "", "小", "゛", "゜", "ー", "消", "決定"]
    ],
    keyEquivalents: new Map(Object.entries({
      ァ: "ア", ィ: "イ", ゥ: "ウ", ェ: "エ", ォ: "オ",
      ャ: "ヤ", ュ: "ユ", ョ: "ヨ", ッ: "ツ", ヮ: "ワ",
      ヵ: "カ", ヶ: "ケ",
      ガ: "カ", ギ: "キ", グ: "ク", ゲ: "ケ", ゴ: "コ",
      ザ: "サ", ジ: "シ", ズ: "ス", ゼ: "セ", ゾ: "ソ",
      ダ: "タ", ヂ: "チ", ヅ: "ツ", デ: "テ", ド: "ト",
      バ: "ハ", ビ: "ヒ", ブ: "フ", ベ: "ヘ", ボ: "ホ",
      パ: "ハ", ピ: "ヒ", プ: "フ", ペ: "ヘ", ポ: "ホ",
      ヴ: "ウ"
    }))
  };

  root.RHW = Object.assign(root.RHW || {}, { UI_CONSTANTS });
  if (typeof module !== "undefined") {
    module.exports = UI_CONSTANTS;
  }
})(typeof globalThis !== "undefined" ? globalThis : window);
