// Bismillah letters path — case 15 in docs/validator-tests.md.
// The served content (GET /api/letters/:step) must contain only Arabic words found exactly in
// data/noor_albayan.json or data/quran_fatiha.json. Run: npm test

const noor = require("../lib/noor");

let failed = 0;
const check = (name, ok, detail) => {
  if (!ok) failed++;
  console.log(`${ok ? "ok  " : "FAIL"} ${name}${detail ? ` -> ${detail}` : ""}`);
};

for (const n of [1, 2]) {
  const c = noor.lettersStep(n);
  const unknown = noor.unknownArabicWords(c);
  check(`15.${n} step ${n} content uses only source words`, unknown.length === 0, unknown.length ? unknown.join(" ") : `${c.letters.length} letters, ${c.read_words.length} words`);
  check(`15.${n}b step ${n} has 3 reading words with two of its letters`, c.read_words.length === 3);
}

const tampered = noor.lettersStep(1);
tampered.read_words.push({ word: "كِتابٌ" });
const caught = noor.unknownArabicWords(tampered);
check("15.3 a word that is not in the sources is caught", caught.includes("كِتابٌ"), caught.join(" "));

const marks = noor.lettersStep(2);
marks.text_ar = marks.text_ar.replace("ٱلرَّحْمَـٰنِ", "الرحمن"); // same word without the Mushaf marks
check("15.4 Quran words must match with their marks", noor.unknownArabicWords(marks).includes("الرحمن"));

console.log(failed ? `\n${failed} letters case(s) failed` : "\nall letters cases behaved as expected");
process.exit(failed ? 1 : 0);
