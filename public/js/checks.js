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

  // Keeps only the questions about what this episode actually showed:
  // (a) a card question whose card_id is among the shown meanings (words[].meanings and the answer meaning), or
  // (b) a Quran question whose ayah_refs are all among the ayahs the episode showed.
  // pass_mark becomes min(pass_mark, questions left). No questions left: the review is skipped.
  function checksForShown(checks, episode) {
    const shownCards = new Set([
      ...(episode.words || []).flatMap((w) => (w.meanings || []).map((m) => m.card_id)),
      ...(episode.discovery_question && episode.discovery_question.answer_meaning ? [episode.discovery_question.answer_meaning.card_id] : []),
    ]);
    const shownAyahs = new Set([
      ...((episode.discovery_moment && episode.discovery_moment.ayah_refs) || []),
      ...(episode.words || []).map((w) => w.ayah_ref),
      ...((episode.mushaf_search_task && episode.mushaf_search_task.ayah_refs) || []),
      ...((episode.salah_connection && episode.salah_connection.ayah_refs) || []),
    ]);
    const questions = checks.questions.filter((q) =>
      q.card_id
        ? shownCards.has(q.card_id)
        : q.source === "quran_fatiha.json" && Array.isArray(q.ayah_refs) && q.ayah_refs.length > 0 && q.ayah_refs.every((r) => shownAyahs.has(r))
    );
    return { ...checks, questions, pass_mark: Math.min(checks.pass_mark, questions.length) };
  }

  const api = { scoreChecks, reviewResult, closingScreen, checksForShown, NEXT_LINE, RETRY_LINE };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else Object.assign(root, { scoreChecks, reviewResult, closingScreen, checksForShown });
})(typeof window !== "undefined" ? window : globalThis);
