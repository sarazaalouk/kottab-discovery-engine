// "Before you move on": the teacher's fixed questions (data/episode_checks.json). Run: npm test
const fs = require("fs");
const path = require("path");
const { checkProblems, checksForEpisode } = require("../lib/checks");
const { scoreChecks, closingScreen } = require("../public/js/checks");

const ROOT = path.join(__dirname, "..");
const readJson = (p) => JSON.parse(fs.readFileSync(path.join(ROOT, p), "utf8"));
const kb = readJson("data/kb_tafsir.json");
const data = readJson("data/episode_checks.json");
const copy = () => JSON.parse(JSON.stringify(data));

let failed = 0;
const check = (name, ok, detail = "") => {
  if (!ok) failed++;
  console.log(`${ok ? "ok  " : "FAIL"} ${name}${detail ? ` -> ${detail}` : ""}`);
};

const problems = checkProblems(data, kb);
check("C1. the file for episode 1 is accepted (3 questions, approved cards)", problems.length === 0 && data.episodes["1"].length === 3, problems.join("; "));

const unknown = copy();
unknown.episodes["1"][0].card_id = "kb-999";
check("C2. a card that is not in the knowledge base is refused", checkProblems(unknown, kb).some((p) => p.includes("kb-999 is not in the knowledge base")));

const draft = copy();
const draftCard = kb.entries.find((c) => c.status !== "approved");
draft.episodes["1"][1].card_id = draftCard.id;
check("C3. a card that is not approved is refused", checkProblems(draft, kb).some((p) => p.includes(`${draftCard.id} is not approved`)), draftCard.id);

const noSource = copy();
delete noSource.episodes["1"][2].source;
check("C4. a question with no card and no Quran source is refused", checkProblems(noSource, kb).length === 1);

const served = checksForEpisode(data, kb, 1);
check("C5. the page gets each card's source name", served.questions[0].source === "تفسير ابن كثير" && served.questions[2].source === "Al-Fatiha, verified Quran text");

const qs = data.episodes["1"];
check("C6. 2 of 3 right passes", scoreChecks(qs, [0, 0, 1], 2).passed === true);
check("C7. 1 of 3 right does not pass", scoreChecks(qs, [0, 2, 1], 2).passed === false);

// C8–C9: closing screen, only after passing
check("C8. no closing screen before the questions are passed", closingScreen("Two Names", false) === null);
const c = closingScreen("Two Names", true);
check("C9. after passing: today's title, the next root, and the question again (no badges)",
  c.heading === "What you discovered today" && c.title === "Two Names" &&
  c.next === "Next episode: root س-ل-م — opens when your teacher approves its cards" &&
  c.again === "Play the discovery question again" && Object.keys(c).length === 4);

console.log(failed ? `\n${failed} check case(s) failed` : "\nall check cases behaved as expected");
process.exit(failed ? 1 : 0);
