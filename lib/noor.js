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

// ---------- Bismillah letters path (children who do not know the letters yet) ----------

// The book teaches alif with the picture word for أ, so ا uses that entry.
const PICTURE_ALIAS = { "ا": "أ" };

// Fatha words with at least two different letters from this step, in the file's order.
function fathaWordsWithTwoOf(letterSet, count) {
  return readJson(NOOR_PATH)
    .fatha_words.filter((w) => [...lettersOf(w.word)].filter((c) => letterSet.has(c)).length >= 2)
    .slice(0, count);
}

function lettersStep(stepNumber) {
  const n = readJson(NOOR_PATH);
  const step = n.basmala_path.steps.find((s) => s.step === stepNumber);
  if (!step) return null;
  const quranWords = readJson(QURAN_PATH).ayahs.find((a) => `1:${a.ayah}` === step.ayah_ref).text_ar.split(/\s+/);
  const letters = letterInfo(step.letters).map((l) => {
    const pic = n.picture_words.find((p) => p.letter === (PICTURE_ALIAS[l.letter] || l.letter));
    return { ...l, picture_word: pic ? { word: pic.word, letter: pic.letter, lesson: pic.lesson, page: pic.page } : null };
  });
  return {
    step: step.step,
    label_en: step.label_en,
    ayah_ref: step.ayah_ref,
    text_ar: step.word_indexes.map((i) => quranWords[i - 1]).join(" "),
    letters,
    read_words: fathaWordsWithTwoOf(new Set(step.letters), 3),
    source: { title: n.source.title, quran: readJson(QURAN_PATH).source },
  };
}

// Mechanical check: every Arabic word in a response must appear exactly (with its marks)
// in noor_albayan.json or in quran_fatiha.json. Returns the words that do not.
function allowedArabicWords() {
  const allowed = new Set();
  const add = (s) => String(s).split(/\s+/).forEach((t) => t && allowed.add(t));
  const walk = (v) => {
    if (typeof v === "string") add(v);
    else if (Array.isArray(v)) v.forEach(walk);
    else if (v && typeof v === "object") Object.values(v).forEach(walk);
  };
  walk(readJson(NOOR_PATH));
  readJson(QURAN_PATH).ayahs.forEach((a) => add(a.text_ar));
  return allowed;
}

function unknownArabicWords(obj, allowed = allowedArabicWords()) {
  const bad = [];
  const walk = (v) => {
    if (typeof v === "string") {
      for (const t of v.split(/\s+/)) if (/[؀-ۿ]/.test(t) && !allowed.has(t)) bad.push(t);
    } else if (Array.isArray(v)) v.forEach(walk);
    else if (v && typeof v === "object") Object.values(v).forEach(walk);
  };
  walk(obj);
  return bad;
}

module.exports = {
  stripMarks, lettersOf, fathaWordsUsing, letterInfo, basmalaWords, diagnosisContent,
  lettersStep, unknownArabicWords, readNoor: () => readJson(NOOR_PATH),
};
