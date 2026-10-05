// Noor Al-Bayan data (data/noor_albayan.json) and the fixed rules that pick words from it.
// No model is involved: every Arabic word served from here is taken from this file or from
// data/quran_fatiha.json exactly as written.
const fs = require("fs");
const path = require("path");

const NOOR_PATH = path.join(__dirname, "..", "data", "noor_albayan.json");
const QURAN_PATH = path.join(__dirname, "..", "data", "quran_fatiha.json");
const readJson = (p) => JSON.parse(fs.readFileSync(p, "utf8"));

// Removes vowel marks and tatweel only (keeps hamza forms, so أ is not counted as ا).
function stripMarks(s) {
  return String(s).replace(/[ؐ-ًؚ-ٰٟۖ-ۭـ]/g, "").replace(/ٱ/g, "ا");
}

function basmalaWords() {
  return readJson(QURAN_PATH).ayahs.find((a) => a.ayah === 1).text_ar.split(/\s+/);
}

function lettersOf(text) {
  return new Set([...stripMarks(text)].filter((c) => /[ء-ي]/.test(c)));
}

// Fatha words whose letters all come from the given set, in the file's order.
function fathaWordsUsing(letterSet, count) {
  return readJson(NOOR_PATH)
    .fatha_words.filter((w) => [...lettersOf(w.word)].every((c) => letterSet.has(c)))
    .slice(0, count);
}

function letterInfo(letters) {
  const all = readJson(NOOR_PATH).letters;
  return letters.map((l) => {
    const info = all.find((x) => x.letter === l);
    return info ? { letter: l, name_latin: info.name_latin, name_ar: info.name_ar, forms: info.forms } : { letter: l };
  });
}

// Letter games: stage 1 letters (and reserves), and the stage 3 fatha words.
const SOUND_LETTERS = ["ب", "س", "م", "ل", "ر", "ح"];
const SOUND_RESERVE = ["ن", "ي"];

function diagnosisContent() {
  const basmalaLetters = lettersOf(basmalaWords().join(" "));
  return {
    source: { title: readJson(NOOR_PATH).source.title },
    sound_letters: letterInfo([...SOUND_LETTERS, ...SOUND_RESERVE]),
    fatha_words: fathaWordsUsing(basmalaLetters, 3),
  };
}

module.exports = { stripMarks, lettersOf, fathaWordsUsing, letterInfo, basmalaWords, diagnosisContent, readNoor: () => readJson(NOOR_PATH) };
