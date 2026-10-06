// "Why this journey" (parent page and report): approved cards only, in a fixed order, texts as in the file. Run: npm test
const fs = require("fs");
const path = require("path");
const { whyCards } = require("../lib/why");

const kb = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "data", "kb_tafsir.json"), "utf8"));
const src = (c) => `src:${c.id}`;

let failed = 0;
const check = (name, ok, detail = "") => {
  if (!ok) failed++;
  console.log(`${ok ? "ok  " : "FAIL"} ${name}${detail ? ` -> ${detail}` : ""}`);
};

const cards = whyCards(kb, src);
check("V1. kb-002, then kb-003, then kb-001", cards.map((c) => c.card_id).join(",") === "kb-002,kb-003,kb-001", cards.map((c) => c.card_id).join(","));
check("V2. each text and source is the card's own", cards.every((c) => {
  const card = kb.entries.find((e) => e.id === c.card_id);
  return c.meaning_en === card.meaning_en && c.meaning_short === card.meaning_en_child && c.source === `src:${card.id}`;
}));

const copy = JSON.parse(JSON.stringify(kb));
copy.entries.find((c) => c.id === "kb-003").status = "draft";
check("V3. a card that is not approved is left out", whyCards(copy, src).map((c) => c.card_id).join(",") === "kb-002,kb-001");

console.log(failed ? `\n${failed} why case(s) failed` : "\nall why cases behaved as expected");
process.exit(failed ? 1 : 0);
