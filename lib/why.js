// "Why this journey": fixed cards about Al-Fatiha shown to parents (no model).
// Order: kb-002 (the greatest Surah), kb-003 (repeated in every rak'ah), kb-001 (the Salah divided in two halves).
// Only approved cards are returned; their texts are copied from data/kb_tafsir.json as they are.
const WHY_IDS = ["kb-002", "kb-003", "kb-001"];

// sourceLine(card) gives the source as parents read it (server.js: sourceForParents).
function whyCards(kb, sourceLine) {
  const byId = new Map(kb.entries.map((c) => [c.id, c]));
  return WHY_IDS.map((id) => byId.get(id))
    .filter((c) => c && c.status === "approved")
    .map((c) => ({
      card_id: c.id,
      meaning_en: c.meaning_en,
      // The card's own short sentence, for the short box on the report.
      meaning_short: c.meaning_en_child,
      source: sourceLine(c),
    }));
}

module.exports = { whyCards, WHY_IDS };
