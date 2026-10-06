// Kottab Discovery Engine — automatic validator
// Runs on every raw model output before anything is saved for review.
// Any failure => the episode is rejected, with the reasons listed.
// Rules: see CLAUDE.md ("الفاحص الآلي").

const MEMORY_LABEL = "memory picture, not a tafsir";
// Phrases that state what a word means. They are not allowed in the model's free text (case 19).
const DEFINITION_PATTERNS = [
  /\bmeans\b/i,
  /\bmeaning\b/i,
  /\btranslates?\b/i,
  /\btranslation\b/i,
  /\brefers? to\b/i,
  /\bis called\b/i,
  /\btafsir says\b/i,
  /\bthe word\b[^.!?]*?\bis\b/i,
];
// Reading level (letter games) → discovery mode. "Does not know the letters yet" has no episode:
// those children follow the Bismillah letters path, which uses no model.
const MODE_FOR_LEVEL = {
  "Knows some letters": "letter",
  "Knows most letters": "root",
  "Reads short words": "reading",
};
const ARABIC_RE = /[؀-ۿݐ-ݿࢠ-ࣿﭐ-﷿ﹰ-﻿]/;

// Strip diacritics/tatweel and unify letter forms so Arabic can be compared loosely.
function normalizeArabic(s) {
  return s
    .replace(/[ؐ-ًؚ-ٰٟۖ-ۭـ]/g, "")
    .replace(/[ٱآأإ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/\s+/g, " ")
    .trim();
}

// ---------- JSON schema check (subset used by schemas/episode.schema.json) ----------
function checkSchema(value, schema, root, path, errors) {
  if (schema.$ref) {
    const name = schema.$ref.replace("#/$defs/", "");
    return checkSchema(value, root.$defs[name], root, path, errors);
  }
  const t = schema.type;
  const actual = Array.isArray(value) ? "array" : value === null ? "null" : typeof value;
  if (t === "integer") {
    if (!Number.isInteger(value)) return errors.push(`${path}: expected integer`);
  } else if (t && t !== actual) {
    return errors.push(`${path}: expected ${t}, got ${actual}`);
  }
  if ("const" in schema && value !== schema.const) errors.push(`${path}: must be "${schema.const}"`);
  if (schema.enum && !schema.enum.includes(value)) errors.push(`${path}: must be one of ${schema.enum.join(", ")}`);
  if (t === "object") {
    for (const key of schema.required || []) {
      if (!(key in value)) errors.push(`${path}.${key}: missing`);
    }
    for (const key of Object.keys(value)) {
      if (!schema.properties || !(key in schema.properties)) {
        if (schema.additionalProperties === false) errors.push(`${path}.${key}: not allowed`);
      } else {
        checkSchema(value[key], schema.properties[key], root, `${path}.${key}`, errors);
      }
    }
  }
  if (t === "array" && schema.items) {
    value.forEach((item, i) => checkSchema(item, schema.items, root, `${path}[${i}]`, errors));
  }
}

// ---------- helpers ----------
function collectMeanings(out) {
  const list = [];
  const add = (m, where) => m && list.push({ m, where });
  (out.words || []).forEach((w, i) => (w.meanings || []).forEach((m, j) => add(m, `words[${i}].meanings[${j}]`)));
  add(out.discovery_question && out.discovery_question.answer_meaning, "discovery_question.answer_meaning");
  const pr = out.parent_report || {};
  ((pr.discovered && pr.discovered.meanings) || []).forEach((m, j) => add(m, `parent_report.discovered.meanings[${j}]`));
  ((pr.teach_your_parents && pr.teach_your_parents.meanings) || []).forEach((m, j) =>
    add(m, `parent_report.teach_your_parents.meanings[${j}]`));
  return list;
}

function collectAyahRefs(out) {
  const refs = [];
  const add = (r, where) => refs.push({ r, where });
  ((out.discovery_moment && out.discovery_moment.ayah_refs) || []).forEach((r, i) => add(r, `discovery_moment.ayah_refs[${i}]`));
  (out.words || []).forEach((w, i) => add(w.ayah_ref, `words[${i}].ayah_ref`));
  ((out.mushaf_search_task && out.mushaf_search_task.ayah_refs) || []).forEach((r, i) => add(r, `mushaf_search_task.ayah_refs[${i}]`));
  ((out.salah_connection && out.salah_connection.ayah_refs) || []).forEach((r, i) => add(r, `salah_connection.ayah_refs[${i}]`));
  return refs;
}

// Walk every string in the output with its path.
function walkStrings(value, path, fn) {
  if (typeof value === "string") return fn(value, path);
  if (Array.isArray(value)) return value.forEach((v, i) => walkStrings(v, `${path}[${i}]`, fn));
  if (value && typeof value === "object") Object.entries(value).forEach(([k, v]) => walkStrings(v, `${path}.${k}`, fn));
}

// Word comparison for meaning cards: marks removed, ة as ه, and the article ال removed
// (also after a joined ل/ب/و, e.g. لِلَّهِ). A card about several words matches any of them.
function bareWord(w) {
  let s = normalizeArabic(w).replace(/ة/g, "ه").replace(/[^ء-ي]/g, "");
  s = s.replace(/^[وب]?ال/, "").replace(/^لل/, "ل");
  return s;
}
function cardMatchesWord(cardWord, ayahWord) {
  const target = bareWord(ayahWord);
  // The Uthmani script writes some long a's as a small alif (ٱلْعَـٰلَمِينَ, مَـٰلِكِ), so alif is ignored too.
  const variants = (t) => [t, t.replace(/^[لبو]/, "")].flatMap((v) => [v, v.replace(/ا/g, "")]);
  return String(cardWord)
    .split(/[\s/]+/)
    .filter(Boolean)
    .some((t) => variants(bareWord(t)).some((v) => v && variants(target).includes(v)));
}

function hasRootLetters(word, rootLetters) {
  let i = 0;
  for (const ch of normalizeArabic(word)) if (ch === rootLetters[i]) i++;
  return i === rootLetters.length;
}

/**
 * @param {string} rawText  the model's raw text output
 * @param {object} ctx      { schema, kb, quran, episodeNumber, rootLetters, providedCardIds, readingLevel }
 * @returns {{ passed: boolean, errors: string[], warnings: string[], output: object|null }}
 */
function validateEpisode(rawText, ctx) {
  const errors = [];
  const warnings = [];
  const fail = (rule, msg) => errors.push(`[${rule}] ${msg}`);

  // (و) valid JSON + schema
  let out;
  try {
    out = JSON.parse(rawText);
  } catch (e) {
    fail("schema", `output is not valid JSON: ${e.message}`);
    return { passed: false, errors, warnings, output: null };
  }
  const schemaErrors = [];
  checkSchema(out, ctx.schema, ctx.schema, "$", schemaErrors);
  schemaErrors.forEach((e) => fail("schema", e));
  if (schemaErrors.length) return { passed: false, errors, warnings, output: out };

  if (out.episode_number !== ctx.episodeNumber) fail("schema", `episode_number is ${out.episode_number}, expected ${ctx.episodeNumber}`);
  if (out.words.length < 4 || out.words.length > 6) fail("schema", `words: ${out.words.length} words, expected 4 to 6`);
  out.words.forEach((w, i) => { if (!w.meanings.length) fail("schema", `words[${i}]: no meaning given`); });
  const opts = out.discovery_question.options;
  if (opts.length !== 3) fail("schema", `discovery_question.options: ${opts.length} options, expected 3`);
  if (opts.filter((o) => o.is_correct).length !== 1) fail("schema", "discovery_question.options: exactly one option must be correct");
  if (out.parent_report.teach_your_parents.duration_minutes !== 3) fail("schema", "teach_your_parents.duration_minutes must be 3");

  // (17) the three options must be different texts (ignoring case, spaces, punctuation and Arabic marks)
  const optionKey = (t) => normalizeArabic(String(t)).toLowerCase().replace(/[^\p{L}\p{N}]+/gu, "");
  const keys = opts.map((o) => optionKey(o.text_en));
  if (new Set(keys).size !== keys.length) fail("options", "discovery_question.options: two options are the same text");

  // (أ) (ب) (ج) meanings
  const cardsById = new Map(ctx.kb.entries.map((c) => [c.id, c]));
  const exactArabicMeanings = new Set(); // meaning texts allowed to contain Arabic (exact meaning_ar copies)
  for (const { m, where } of collectMeanings(out)) {
    if (!m.card_id || !m.card_id.trim()) { fail("a", `${where}: meaning has no card_id`); continue; }
    const card = cardsById.get(m.card_id);
    if (!card) { fail("b", `${where}: card_id ${m.card_id} does not exist`); continue; }
    if (card.status !== "approved") { fail("b", `${where}: card ${m.card_id} is not approved (status: ${card.status})`); continue; }
    if (!ctx.providedCardIds.includes(m.card_id)) warnings.push(`${where}: card ${m.card_id} was not among the cards given for this episode`);

    const matches = [card.meaning_en_child, card.meaning_en, card.meaning_ar].filter(Boolean);
    if (!matches.includes(m.text)) {
      fail("c", `${where}: text does not exactly match card ${m.card_id}`);
      continue;
    }
    if (m.text === card.meaning_ar) exactArabicMeanings.add(`${where}.text`);
    // Meanings in the child's screens (word meanings, the revealed answer card) must come from cards
    // whose audience includes the child. Teacher/parent-only cards (content level ج) never reach the child.
    const childFacing = where.startsWith("words[") || where.startsWith("discovery_question");
    if (childFacing && !(Array.isArray(card.audience) && card.audience.includes("child"))) {
      fail("b", `${where}: card ${m.card_id} is not for children (audience: ${(card.audience || []).join(", ")})`);
    }
    // A meaning for the child (marked child, or on a child screen) must be the card's child sentence exactly.
    const forChild = m.audience === "child" || where.startsWith("words[") || where.startsWith("discovery_question");
    if (forChild && m.text !== card.meaning_en_child) fail("c", `${where}: a meaning for the child must be card ${m.card_id}'s meaning_en_child, word for word`);
    if (m.audience === "parent" && m.text !== card.meaning_en) warnings.push(`${where}: parent meaning is not the card's meaning_en`);
  }

  // (د) ayah references
  const ayahByNum = new Map(ctx.quran.ayahs.map((a) => [a.ayah, a]));
  for (const { r, where } of collectAyahRefs(out)) {
    const m = /^1:(\d+)$/.exec(r);
    const ayah = m && ayahByNum.get(Number(m[1]));
    if (!ayah || !ayah.text_ar) fail("d", `${where}: "${r}" is not an ayah in quran_fatiha.json`);
  }
  out.words.forEach((w, i) => {
    const m = /^1:(\d+)$/.exec(w.ayah_ref);
    const ayah = m && ayahByNum.get(Number(m[1]));
    if (!ayah) return;
    const count = ayah.text_ar.split(/\s+/).length;
    if (w.word_index < 1 || w.word_index > count) {
      fail("d", `words[${i}]: word_index ${w.word_index} is outside ${w.ayah_ref} (${count} words)`);
    } else {
      const word = ayah.text_ar.split(/\s+/)[w.word_index - 1];
      if (ctx.rootLetters && !hasRootLetters(word, ctx.rootLetters)) {
        warnings.push(`words[${i}]: ${w.ayah_ref} word ${w.word_index} does not contain the episode root letters`);
      }
      // (18) a meaning card (type "meaning") must be about this word; context cards are exempt.
      for (const m of w.meanings) {
        const card = cardsById.get(m.card_id);
        if (!card || card.type !== "meaning") continue;
        if (!cardMatchesWord(card.word_ar, word)) {
          fail("word", `words[${i}]: meaning card ${m.card_id} (${card.word_ar}) is not about ${w.ayah_ref} word ${w.word_index}`);
        }
      }
    }
  });

  // (د) Arabic text written by the model: any Arabic outside exact meaning_ar copies is rejected,
  // and text that resembles the Quran is called out explicitly.
  // Exception: single, separate root letters (e.g. "ر ح م (r, h, m)") are allowed.
  const fatihaWords = new Set(ctx.quran.ayahs.flatMap((a) => normalizeArabic(a.text_ar).split(" ")));
  walkStrings(out, "$", (s, path) => {
    if (!ARABIC_RE.test(s)) return;
    if (exactArabicMeanings.has(path.replace(/^\$\./, ""))) return;
    const arabicRuns = normalizeArabic(s).match(/[ء-ي]+/g) || [];
    if (arabicRuns.length && arabicRuns.every((run) => run.length === 1)) return;
    const words = normalizeArabic(s).split(" ").filter(Boolean);
    const quranic = words.filter((w) => fatihaWords.has(w)).length;
    if (quranic >= 1) fail("d", `${path}: Arabic text that resembles ayah text (${quranic} Al-Fatiha word(s)) written by the model`);
    else fail("d", `${path}: Arabic text written by the model (only exact meaning_ar copies are allowed)`);
  });

  // (adapt) the discovery mode must match the child's reading level; in "letter" mode every
  // discovery-question option may name at most one Arabic letter.
  if (ctx.readingLevel) {
    const expected = MODE_FOR_LEVEL[ctx.readingLevel];
    if (!expected) fail("adapt", `reading level "${ctx.readingLevel}" has no discovery mode (no episode for this level)`);
    if (out.adaptation.reading_level !== ctx.readingLevel) {
      fail("adapt", `adaptation.reading_level is "${out.adaptation.reading_level}", expected "${ctx.readingLevel}"`);
    }
    if (expected && out.adaptation.discovery_mode !== expected) {
      fail("adapt", `discovery_mode is "${out.adaptation.discovery_mode}", expected "${expected}" for "${ctx.readingLevel}"`);
    }
    if (out.adaptation.discovery_mode === "letter") {
      out.discovery_question.options.forEach((o, i) => {
        const n = (normalizeArabic(o.text_en).match(/[ء-ي]/g) || []).length;
        if (n > 1) fail("adapt", `discovery_question.options[${i}]: ${n} Arabic letters in letter mode (at most 1)`);
      });
    }
  }

  // (19) free text written by the model must not define meanings. Meanings only come from cards.
  const freeText = {
    title_en: out.title_en,
    "discovery_moment.text_en": out.discovery_moment.text_en,
    "discovery_question.question_en": out.discovery_question.question_en,
    "mushaf_search_task.instruction_en": out.mushaf_search_task.instruction_en,
    "salah_connection.text_en": out.salah_connection.text_en,
    "memory_picture.description_en": out.memory_picture.description_en,
  };
  for (const [where, text] of Object.entries(freeText)) {
    for (const re of DEFINITION_PATTERNS) {
      const hit = String(text).match(re);
      if (hit) fail("define", `${where}: free text uses a definition phrase ("${hit[0]}")`);
    }
  }

  // (هـ) memory picture label
  if (out.memory_picture.label !== MEMORY_LABEL) fail("e", `memory_picture.label must be "${MEMORY_LABEL}"`);
  if (!out.memory_picture.description_en.trim()) fail("e", "memory_picture.description_en is empty");

  if (out.referrals.length) warnings.push(`${out.referrals.length} referral(s) to the teacher`);

  return { passed: errors.length === 0, errors, warnings, output: out };
}

module.exports = { validateEpisode, normalizeArabic, MEMORY_LABEL, MODE_FOR_LEVEL };
