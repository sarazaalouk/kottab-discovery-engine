// "Review with a grown-up": the teacher's three questions at the end of the episode. Nothing is locked:
// the result is kept only as information (episode_1_review: "passed" or "retry"). No points or badges.
// Works in the browser (globals) and in Node (for tests/checks-tests.js).
(function (root) {
  const NEXT_LINE = "Your next discovery is coming after teacher review.";
  const RETRY_LINE = "Read the episode once more with a grown-up";

  // answers[i] is the index of the option the child picked for question i (in the file's order).
  function scoreChecks(questions, answers, passMark) {
    const right = questions.filter((q, i) => answers[i] === q.correct).length;
    return { right, passed: right >= passMark };
  }

  // What is saved and shown after the three answers. The same next-discovery line either way.
  function reviewResult(questions, answers, passMark) {
    const { passed } = scoreChecks(questions, answers, passMark);
    return passed ? { review: "passed", lines: [NEXT_LINE] } : { review: "retry", lines: [NEXT_LINE, RETRY_LINE] };
  }

  // Closing screen, shown once the review is done, whatever its result. Fixed text (no model), no badges.
  // The episode title is the one the page already shows (checked by the validator).
  function closingScreen(titleEn, review) {
    if (review !== "passed" && review !== "retry") return null;
    return {
      heading: "What you discovered today",
      title: titleEn,
      next: NEXT_LINE,
      again: "Play the discovery question again",
    };
  }

  const api = { scoreChecks, reviewResult, closingScreen, NEXT_LINE, RETRY_LINE };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else Object.assign(root, { scoreChecks, reviewResult, closingScreen });
})(typeof window !== "undefined" ? window : globalThis);
