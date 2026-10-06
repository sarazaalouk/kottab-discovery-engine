// "Before you move on": scores the teacher's questions. No points or badges are shown, only passed or not.
// Works in the browser (global scoreChecks) and in Node (for tests/checks-tests.js).
(function (root) {
  // answers[i] is the index of the option the child picked for question i (in the file's order).
  function scoreChecks(questions, answers, passMark) {
    const right = questions.filter((q, i) => answers[i] === q.correct).length;
    return { right, passed: right >= passMark };
  }

  // Closing screen, shown only after "Before you move on" was passed. Fixed text (no model), no badges.
  // The episode title is the one the page already shows (checked by the validator).
  function closingScreen(titleEn, passed) {
    if (!passed) return null;
    return {
      heading: "What you discovered today",
      title: titleEn,
      next: "Your next discovery is coming after teacher review.",
      again: "Play the discovery question again",
    };
  }

  if (typeof module !== "undefined" && module.exports) module.exports = { scoreChecks, closingScreen };
  else Object.assign(root, { scoreChecks, closingScreen });
})(typeof window !== "undefined" ? window : globalThis);
