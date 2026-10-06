// "While you wait" activity on the episode page: counts a letter in a verified ayah, so the right answer
// is never a number typed by hand. Works in the browser (global countLetter) and in Node (tests/pages-tests.js).
(function (root) {
  // Removes the marks (harakat, shadda, sukun, small alif, Quranic marks) before counting.
  function countLetter(ayahText, letter) {
    const plain = String(ayahText).replace(/[ً-ٰٟۖ-ۭ]/g, "");
    return [...plain].filter((c) => c === letter).length;
  }

  if (typeof module !== "undefined" && module.exports) module.exports = { countLetter };
  else root.countLetter = countLetter;
})(typeof window !== "undefined" ? window : globalThis);
