// "Review with a grown-up": fixed questions written by the teacher (data/episode_checks.json), no model.
// Nothing is locked by the result; it is kept only as information.
// The server checks the file when it starts and refuses to run if any question is wrong:
// every card_id must be an approved card, and the only other source is the verified Quran file.
const QURAN_SOURCE = "quran_fatiha.json";

// Returns a list of problems (empty when the file is fine).
function checkProblems(data, kb) {
  const problems = [];
  if (!data || typeof data.episodes !== "object") return ["episodes is missing"];
  if (!Number.isInteger(data.pass_mark) || data.pass_mark < 1) problems.push("pass_mark must be a whole number");
  const cards = new Map(kb.entries.map((c) => [c.id, c]));
  for (const [episode, questions] of Object.entries(data.episodes)) {
    if (!Array.isArray(questions) || !questions.length) {
      problems.push(`episode ${episode}: no questions`);
      continue;
    }
    if (data.pass_mark > questions.length) problems.push(`episode ${episode}: pass_mark is more than the number of questions`);
    questions.forEach((q, i) => {
      const at = `episode ${episode} question ${q.id || i + 1}`;
      if (typeof q.question_en !== "string" || !q.question_en.trim()) problems.push(`${at}: question_en is missing`);
      if (!Array.isArray(q.options) || q.options.length !== 3) problems.push(`${at}: needs exactly 3 options`);
      else if (new Set(q.options).size !== 3) problems.push(`${at}: options must be different`);
      if (!Number.isInteger(q.correct) || q.correct < 0 || q.correct > 2) problems.push(`${at}: correct must be 0, 1 or 2`);
      if (q.card_id !== undefined) {
        const card = cards.get(q.card_id);
        if (!card) problems.push(`${at}: card ${q.card_id} is not in the knowledge base`);
        else if (card.status !== "approved") problems.push(`${at}: card ${q.card_id} is not approved (${card.status})`);
      } else if (q.source !== QURAN_SOURCE) {
        problems.push(`${at}: needs a card_id or source "${QURAN_SOURCE}"`);
      }
    });
  }
  return problems;
}

// What the episode page gets: the questions, and for each the card's source name (for the source chip).
function checksForEpisode(data, kb, episode) {
  const questions = data.episodes[String(episode)];
  if (!questions) return null;
  const cards = new Map(kb.entries.map((c) => [c.id, c]));
  return {
    episode: Number(episode),
    pass_mark: data.pass_mark,
    questions: questions.map((q) => ({
      id: q.id,
      question_en: q.question_en,
      options: q.options,
      correct: q.correct,
      card_id: q.card_id,
      source: q.card_id ? cards.get(q.card_id).source : "Al-Fatiha, verified Quran text",
    })),
  };
}

module.exports = { checkProblems, checksForEpisode, QURAN_SOURCE };
