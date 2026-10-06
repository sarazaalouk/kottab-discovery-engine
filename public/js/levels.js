// Reading level from the letter games (fixed rules, no model). Each stage opens only if the one before was passed.
// Works in the browser (global levelFrom) and in Node (for tests/levels-tests.js).
(function (root) {
  // stages: { sound, shape, fatha, fatiha, ayah }, each { passed } or missing when it was not played.
  // Stage 4 (Al-Fatiha words) does not change the level; it opens stage 5 and sets reads_fatiha_words.
  // Stage 5: the child reads ayah 1:1 in full to the grown-up.
  function levelFrom(stages) {
    const passed = (k) => Boolean(stages[k] && stages[k].passed);
    if (!passed("sound")) return "Does not know the letters yet";
    if (!passed("shape")) return "Knows some letters";
    if (!passed("fatha")) return "Knows most letters";
    if (passed("fatiha") && passed("ayah")) return "Reads Arabic well";
    return "Reads short words";
  }

  // Parents of children who already read can skip the games: the level is the parent's own choice
  // (diagnosis_source "parent"). Only for the two reading levels, and never in a trial session,
  // where the level must come from the games. Returns null when skipping is not offered.
  const SKIP_LEVELS = ["Reads short words", "Reads Arabic well"];
  function parentDiagnosis(profile, at = new Date().toISOString()) {
    if (!profile || profile.trial || !SKIP_LEVELS.includes(profile.parent_reading_level)) return null;
    return {
      reading_level: profile.parent_reading_level,
      level_label: profile.parent_reading_level,
      diagnosis_source: "parent",
      // Reading a whole ayah includes reading its words.
      reads_fatiha_words: profile.parent_reading_level === "Reads Arabic well",
      done_at: at,
    };
  }

  if (typeof module !== "undefined" && module.exports) module.exports = { levelFrom, parentDiagnosis };
  else Object.assign(root, { levelFrom, parentDiagnosis });
})(typeof window !== "undefined" ? window : globalThis);
