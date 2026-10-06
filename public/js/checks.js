// "Before you move on": scores the teacher's questions. No points or badges are shown, only passed or not.
// Works in the browser (global scoreChecks) and in Node (for tests/checks-tests.js).
(function (root) {
  // answers[i] is the index of the option the child picked for question i (in the file's order).
  function scoreChecks(questions, answers, passMark) {
    const right = questions.filter((q, i) => answers[i] === q.correct).length;
    return { right, passed: right >= passMark };
  }

  if (typeof module !== "undefined" && module.exports) module.exports = { scoreChecks };
  else root.scoreChecks = scoreChecks;
})(typeof window !== "undefined" ? window : globalThis);
