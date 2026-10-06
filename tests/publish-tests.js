// Publishing rule tests — see docs/validator-tests.md ("Publishing").
// The validator decides first; then the rule in lib/publish.js decides what the child sees.
// Run: npm test

const fs = require("fs");
const path = require("path");
const { validateEpisode } = require("../validator");
const { initialStatus, publishMode, autoReview, teacherApproved, applyDecision } = require("../lib/publish");

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

// Same order as the server: validate, then decide the status from the result and the referrals.
function publish(output, mode = "auto") {
  const v = validateEpisode(JSON.stringify(output), ctx);
  const referrals = v.output && Array.isArray(v.output.referrals) ? v.output.referrals.length : 0;
  return initialStatus(v.passed, referrals, mode);
}

const copy = () => JSON.parse(JSON.stringify(sample.episode));
let failed = 0;
const check = (name, actual, expected) => {
  const ok = actual === expected;
  if (!ok) failed++;
  console.log(`${ok ? "ok  " : "FAIL"} ${name} -> ${actual}${ok ? "" : ` (expected ${expected})`}`);
};

// 1-3: status after generation
check("P1. passes the validator, no referrals", publish(copy()), "approved");
check("P2. passes the validator, has a referral", publish(Object.assign(copy(), {
  referrals: [{ question: "Who are they?", reason: "people or groups" }],
})), "pending_review");
const broken = copy();
broken.words[0].meanings[0].card_id = "kb-999";
check("P3. fails the validator", publish(broken), "rejected");

// 4-7: reviewer decisions after publishing
const rec = () => ({ status: "approved", validation: { passed: true }, review: autoReview("2026-10-05T10:00:00Z") });
check("P4. auto-published episode is not yet teacher-reviewed", String(teacherApproved(rec())), "false");

const noNote = rec();
check("P5. withdraw without a note is refused", applyDecision(noNote, "withdraw", "  "), "a note is required to withdraw an episode");

const withdrawn = rec();
applyDecision(withdrawn, "withdraw", "Distractor needs a fix");
check("P6. withdraw with a note -> returned (auto-approval kept in history)",
  `${withdrawn.status}|${withdrawn.review_history[0].decision}`, "returned|auto_approved");

const pending = { status: "pending_review", validation: { passed: true }, review: null };
check("P7. only a published episode can be withdrawn", applyDecision(pending, "withdraw", "note"), "only a published (approved) episode can be withdrawn");

const confirmed = rec();
applyDecision(confirmed, "approve", "");
check("P8. teacher confirms after review -> teacher-reviewed", String(teacherApproved(confirmed)), "true");

const generating = { status: "generating", validation: undefined, review: null };
check("P9. no decision while the episode is still being generated", applyDecision(generating, "refer", "x"), "the episode is still being generated");

// P10–P13: PUBLISH_MODE
check("P10. review-first: a passing episode without referrals waits for the teacher", publish(copy(), "review-first"), "pending_review");
check("P11. review-first: a failing episode is still rejected", publish(broken, "review-first"), "rejected");
check("P12. PUBLISH_MODE not set means auto", `${publishMode(undefined)}|${publishMode("")}|${publishMode("auto")}`, "auto|auto|auto");
check("P13. an unknown PUBLISH_MODE is treated as review-first", `${publishMode("autoo")}|${publishMode("review-first")}`, "review-first|review-first");

console.log(failed ? `\n${failed} publishing case(s) failed` : `\nall 13 publishing cases behaved as expected`);
process.exit(failed ? 1 : 0);
