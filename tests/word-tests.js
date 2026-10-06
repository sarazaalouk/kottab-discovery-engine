// Meaning card ↔ ayah word (validator case 18): the word must be one of the card's words, in an ayah of the card.
// Run: npm test
const fs = require("fs");
const path = require("path");
const { cardAllowsWord } = require("../validator");

const quran = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "data", "quran_fatiha.json"), "utf8"));
const word = (ayah, i) => quran.ayahs.find((a) => a.ayah === ayah).text_ar.split(/\s+/)[i - 1];
const kb030 = { word_ar: "الرحمن الرحيم", ayah: [1, 3] };

const cases = [
  ["M1. kb-030 on Ar-Rahman in 1:1", cardAllowsWord(kb030, 1, word(1, 3)), true],
  ["M2. kb-030 on Ar-Raheem in 1:1", cardAllowsWord(kb030, 1, word(1, 4)), true],
  ["M3. kb-030 on Ar-Rahman in 1:3", cardAllowsWord(kb030, 3, word(3, 1)), true],
  ["M4. kb-030 on Ar-Raheem in 1:3", cardAllowsWord(kb030, 3, word(3, 2)), true],
  ["M5. kb-030 on Bismillah (1:1 word 1): not its word", cardAllowsWord(kb030, 1, word(1, 1)), false],
  ["M6. the right word but an ayah the card does not cover", cardAllowsWord(kb030, 2, word(1, 3)), false],
  ["M7. a range ayah (\"2-7\") covers ayah 4", cardAllowsWord({ word_ar: "مالك", ayah: "2-7" }, 4, word(4, 1)), true],
  ["M8. the Uthmani small alif (ٱلْعَـٰلَمِينَ) matches العالمين", cardAllowsWord({ word_ar: "العالمين", ayah: 2 }, 2, word(2, 4)), true],
];

let failed = 0;
for (const [name, got, expected] of cases) {
  const ok = got === expected;
  if (!ok) failed++;
  console.log(`${ok ? "ok  " : "FAIL"} ${name} -> ${got}`);
}
console.log(failed ? `\n${failed} word case(s) failed` : "\nall word cases behaved as expected");
process.exit(failed ? 1 : 0);
