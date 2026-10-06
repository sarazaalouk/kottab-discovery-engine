// "Ask a question" on the child's episode page.
// Only cards the child may see can answer, and the answer shown is the card's child sentence, word for word.

// Cards the model may choose from: approved, used for this episode, audience includes the child,
// and with a child sentence.
function askCandidates(kbEntries, record) {
  return kbEntries.filter(
    (c) =>
      c.status === "approved" &&
      record.cards_provided.includes(c.id) &&
      Array.isArray(c.audience) &&
      c.audience.includes("child") &&
      typeof c.meaning_en_child === "string" &&
      c.meaning_en_child.trim() !== ""
  );
}

// The model's choice is accepted only if it is one of the candidates; otherwise the question is referred.
function askAnswer(candidates, decision) {
  if (!decision || decision.in_scope !== true) return null;
  const card = candidates.find((c) => c.id === decision.card_id);
  return card ? { card_id: card.id, text: card.meaning_en_child } : null;
}

module.exports = { askCandidates, askAnswer };
