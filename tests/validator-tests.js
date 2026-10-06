// Validator reliability tests — see docs/validator-tests.md.
// Each case takes the sample episode, breaks one rule on purpose, and expects the validator's verdict.
// Run: npm test

const fs = require("fs");
const path = require("path");
const { validateEpisode } = require("../validator");

const ROOT = path.join(__dirname, "..");
const readJson = (p) => JSON.parse(fs.readFileSync(path.join(ROOT, p), "utf8"));
const sample = readJson("data/episodes/sample-episode-01.json");

const ctx = {
  schema: readJson("schemas/episode.schema.json"),
  kb: readJson("data/kb_tafsir.json"),
  quran: readJson("data/quran_fatiha.json"),
  episodeNumber: 1,
  rootLetters: ["ر", "ح", "م"],
  providedCardIds: sample.cards_provided,
  readingLevel: "Knows most letters",
};

// [name, expected rule tag or null for pass, mutate(output) -> output | raw string]
const cases = [
  ["0. sample episode unchanged", null, (o) => o],
  ["1. (a) meaning without card_id", "[a]", (o) => { o.words[0].meanings[0].card_id = ""; return o; }],
  ["2. (b) card does not exist (kb-999)", "[b]", (o) => { o.words[0].meanings[0].card_id = "kb-999"; return o; }],
  ["3. (b) card not approved (kb-050, draft)", "[b]", (o) => { o.words[0].meanings[0].card_id = "kb-050"; return o; }],
  ["4. (c) meaning text paraphrased", "[c]", (o) => { o.words[2].meanings[0].text = "Ar-Rahman means mercy for everyone."; return o; }],
  ["5. (d) ayah reference not in file (1:9)", "[d]", (o) => { o.salah_connection.ayah_refs.push("1:9"); return o; }],
  ["6. (d) model wrote ayah text", "[d]", (o) => { o.discovery_moment.text_en += " الرحمن الرحيم"; return o; }],
  ["7. (e) memory picture label changed", "[schema]", (o) => { o.memory_picture.label = "memory picture"; return o; }],
  ["8. (f) extra field not in schema", "[schema]", (o) => { o.extra = "x"; return o; }],
  ["9. (f) output is not JSON", "[schema]", () => "{not json"],
  ["10. (d) single root letters allowed", null, (o) => { o.discovery_question.question_en += " ر ح م (r, h, m)"; return o; }],
  ["11. (d) root letters joined into a word", "[d]", (o) => { o.discovery_question.question_en += " رحم"; return o; }],
  ["14. (adapt) discovery mode does not match the reading level", "[adapt]", (o) => { o.adaptation.discovery_mode = "letter"; return o; }],
  ["14b. (adapt) letter mode with a three-letter option", "[adapt]", (o) => {
    ctx.readingLevel = "Knows some letters"; // restored below
    o.adaptation = { reading_level: "Knows some letters", discovery_mode: "letter" };
    o.discovery_question.options[0].text_en = "They share ر ح م (r, h, m)";
    return o;
  }],
  ["16. (c) child meaning uses the parent text of the card", "[c]", (o) => {
    const m = o.words[0].meanings[0];
    m.text = ctx.kb.entries.find((c) => c.id === m.card_id).meaning_en; // exists in the card, but is not the child sentence
    return o;
  }],
  ["17. (options) two options are the same text", "[options]", (o) => {
    o.discovery_question.options[1].text_en = o.discovery_question.options[0].text_en.toUpperCase() + " ";
    return o;
  }],
  ["18. (word) a meaning card attached to the wrong word", "[word]", (o) => {
    o.words[0].word_index = 1; // بِسْمِ — kb-030 is about Ar-Rahman / Ar-Raheem
    return o;
  }],
  ["19. (define) free text defines a word", "[define]", (o) => {
    o.discovery_moment.text_en += " The word Ar-Rahman is about mercy for everyone.";
    return o;
  }],
  ["19b. (define) memory picture says what a word means", "[define]", (o) => {
    o.memory_picture.description_en = "A tree, because Ar-Rahman means mercy.";
    return o;
  }],
  ["19c. (define) an option defines a word", "[define]", (o) => {
    o.discovery_question.options[0].text_en = "Ar-Rahman means the Most Merciful";
    return o;
  }],
  // A teacher/parent-only card shown to the child. The card is approved here (in this test only) so the
  // audience rule is the one that rejects it.
  ["12. (b) teacher/parent-only card on a child screen", "[b]", (o) => {
    const card = ctx.kb.entries.find((c) => c.id === "kb-020");
    card.status = "approved";
    o.words[0].meanings[0] = { card_id: "kb-020", audience: "child", text: card.meaning_en };
    return o;
  }],
];

let failed = 0;
for (const [name, expected, mutate] of cases) {
  const result = mutate(JSON.parse(JSON.stringify(sample.episode)));
  const raw = typeof result === "string" ? result : JSON.stringify(result);
  const v = validateEpisode(raw, ctx);
  ctx.readingLevel = "Knows most letters";
  const ok = expected === null ? v.passed : !v.passed && v.errors.some((e) => e.startsWith(expected));
  if (!ok) failed++;
  console.log(`${ok ? "ok  " : "FAIL"} ${name} -> ${v.passed ? "passed" : v.errors[0]}`);
}

console.log(failed ? `\n${failed} case(s) failed` : `\nall ${cases.length} cases behaved as expected`);
process.exit(failed ? 1 : 0);
