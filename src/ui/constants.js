(function attachUiConstants(root) {
  const RHW = root.RHW || {};
  const text = RHW.TEXT || (typeof require !== "undefined" ? require("../text.js").TEXT : {});
  const rules = RHW.CONFIG.rules;
  const keyboard = text.keyboard || {};
  const UI_CONSTANTS = {
    horseBoardCols: rules.boardColumns.horse,
    pedigreeBoardCols: rules.boardColumns.pedigree,
    placeholderInput: text.input?.placeholder || "",
    kanaRows: keyboard.rows || [],
    specialKeys: {
      small: keyboard.small,
      dakuten: keyboard.dakuten,
      handakuten: keyboard.handakuten,
      backspace: keyboard.backspace,
      submit: keyboard.submit
    },
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

  root.RHW = Object.assign(RHW, { UI_CONSTANTS });
  if (typeof module !== "undefined") {
    module.exports = UI_CONSTANTS;
  }
})(typeof globalThis !== "undefined" ? globalThis : window);
