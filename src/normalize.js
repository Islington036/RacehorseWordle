(function attachNormalize(root) {
  const PUNCTUATION = /[\s\u3000・･'’`´\-‐‑‒–—―ーｰ.．,，/／\\()（）［］\[\]{}「」『』"“”]/g;

  function normalizeName(value) {
    return String(value || "")
      .normalize("NFKC")
      .replace(PUNCTUATION, "")
      .toUpperCase();
  }

  function splitAnswer(value) {
    return Array.from(normalizeName(value));
  }

  function displayLength(value) {
    return splitAnswer(value).length;
  }

  const api = { normalizeName, splitAnswer, displayLength };
  root.RHW = Object.assign(root.RHW || {}, api);
  if (typeof module !== "undefined") {
    module.exports = api;
  }
})(typeof globalThis !== "undefined" ? globalThis : window);
