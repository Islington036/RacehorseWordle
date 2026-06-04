(function attachEvaluator(root) {
  const RHW = root.RHW || {};
  const splitAnswer = RHW.splitAnswer || require("./normalize.js").splitAnswer;

  function scoreGuess(guessValue, answerValue) {
    const guess = splitAnswer(guessValue);
    const answer = splitAnswer(answerValue);
    const result = new Array(guess.length).fill("absent");
    const remaining = new Map();

    for (let index = 0; index < answer.length; index += 1) {
      if (guess[index] === answer[index]) {
        result[index] = "correct";
      } else {
        remaining.set(answer[index], (remaining.get(answer[index]) || 0) + 1);
      }
    }

    for (let index = 0; index < guess.length; index += 1) {
      if (result[index] === "correct") continue;
      const count = remaining.get(guess[index]) || 0;
      if (count > 0) {
        result[index] = "present";
        remaining.set(guess[index], count - 1);
      }
    }

    return result.map((state, index) => ({
      char: guess[index],
      state
    }));
  }

  function isCorrectGuess(guessValue, answerValue) {
    const guess = splitAnswer(guessValue).join("");
    const answer = splitAnswer(answerValue).join("");
    return guess.length > 0 && guess === answer;
  }

  const api = { scoreGuess, isCorrectGuess };
  root.RHW = Object.assign(root.RHW || {}, api);
  if (typeof module !== "undefined") {
    module.exports = api;
  }
})(typeof globalThis !== "undefined" ? globalThis : window);
