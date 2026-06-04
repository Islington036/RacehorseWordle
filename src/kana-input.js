(function attachKanaInput(root) {
  const DAKUTEN = new Map(Object.entries({
    カ: "ガ", キ: "ギ", ク: "グ", ケ: "ゲ", コ: "ゴ",
    サ: "ザ", シ: "ジ", ス: "ズ", セ: "ゼ", ソ: "ゾ",
    タ: "ダ", チ: "ヂ", ツ: "ヅ", テ: "デ", ト: "ド",
    ハ: "バ", ヒ: "ビ", フ: "ブ", ヘ: "ベ", ホ: "ボ",
    ウ: "ヴ",
    パ: "バ", ピ: "ビ", プ: "ブ", ペ: "ベ", ポ: "ボ"
  }));
  const HANDAKUTEN = new Map(Object.entries({
    ハ: "パ", ヒ: "ピ", フ: "プ", ヘ: "ペ", ホ: "ポ",
    バ: "パ", ビ: "ピ", ブ: "プ", ベ: "ペ", ボ: "ポ"
  }));
  const SMALL = new Map(Object.entries({
    ア: "ァ", イ: "ィ", ウ: "ゥ", エ: "ェ", オ: "ォ",
    ヤ: "ャ", ユ: "ュ", ヨ: "ョ", ツ: "ッ",
    ワ: "ヮ", カ: "ヵ", ケ: "ヶ"
  }));
  const USABLE_KANA = /^[ァ-ヶー]+$/u;

  function transformLastKana(value, mark) {
    const chars = Array.from(value || "");
    if (!chars.length) return value || "";
    const last = chars[chars.length - 1];
    const next = getTransform(mark).get(last);
    if (!next) return value || "";
    chars[chars.length - 1] = next;
    return chars.join("");
  }

  function normalizeTypedKana(value) {
    return String(value || "").normalize("NFKC");
  }

  function isUsableKanaInput(value) {
    const normalized = normalizeTypedKana(value);
    return normalized.length > 0 && USABLE_KANA.test(normalized);
  }

  function getTransform(mark) {
    if (mark === "゛" || mark === "ﾞ") return DAKUTEN;
    if (mark === "゜" || mark === "ﾟ") return HANDAKUTEN;
    if (mark === "小") return SMALL;
    return new Map();
  }

  const api = { transformLastKana, normalizeTypedKana, isUsableKanaInput };
  root.RHW = Object.assign(root.RHW || {}, api);
  if (typeof module !== "undefined") {
    module.exports = api;
  }
})(typeof globalThis !== "undefined" ? globalThis : window);
