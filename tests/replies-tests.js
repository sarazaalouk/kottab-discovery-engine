// Teacher replies to referrals (no model): the "no Arabic words" rule, storage in the log file
// and in trial memory, and what the episode page may show. Run: npm test
const { referralId, replyProblem, setReplyInLines, repliesForEpisode } = require("../lib/referrals");
const episodes = require("../lib/episodes");

let failed = 0;
const check = (name, ok, detail = "") => {
  if (!ok) failed++;
  console.log(`${ok ? "ok  " : "FAIL"} ${name}${detail ? ` -> ${detail}` : ""}`);
};

check("Y1. an English reply is accepted", replyProblem("Great question! Ask me in class tomorrow.") === null);
check("Y2. a reply with an Arabic word is refused", /Arabic word/.test(replyProblem("It means الرحمن.") || ""));
check("Y3. single, separate Arabic letters are allowed", replyProblem("Look for ر ح م (r, h, m) in both ayahs.") === null);
check("Y4. an empty reply is refused", replyProblem("   ") !== null);

// Log file (normal mode): an older line without an id gets a stable id, and the reply is stored on that line.
const old = { created_at: "2026-10-05T10:00:00.000Z", episode_id: "episode-01-x", question: "Why two names?", source: "child_question" };
const other = { id: "ref-aaa", created_at: "2026-10-05T11:00:00.000Z", episode_id: "episode-01-y", question: "Other", source: "child_question" };
const lines = [JSON.stringify(old), JSON.stringify(other)];
const id = referralId(old);
const updated = setReplyInLines(lines, id, " Because Allah's mercy is very great. ", "2026-10-06T09:00:00.000Z");
const saved = updated && JSON.parse(updated[0]);
check("Y5. the reply is stored on the matching line of referrals.jsonl", saved && saved.teacher_reply === "Because Allah's mercy is very great." && saved.id === id && updated[1] === lines[1]);
check("Y6. an unknown referral id saves nothing", setReplyInLines(lines, "ref-none", "x", "t") === null);

const shown = repliesForEpisode([saved, other], "episode-01-x");
check("Y7. the episode page gets only its own replied questions", shown.length === 1 && shown[0].question === "Why two names?" && repliesForEpisode([saved, other], "episode-01-y").length === 0);

// Trial: the reply stays in memory with the referral and is erased with the session.
const sid = "9a8b7c6d-5e4f-4a3b-8c2d-1e0f9a8b7c6d";
episodes.addTrialReferral({ id: "ref-trial1", created_at: "2026-10-06T10:00:00.000Z", trial_session_id: sid, episode_id: "trial-01-2026-10-06T10-00-00-000Z", question: "Q", source: "child_question" });
const kept = episodes.setTrialReply("ref-trial1", "A teacher's answer.", "2026-10-06T10:05:00.000Z") &&
  episodes.listTrialReferrals().find((r) => r.id === "ref-trial1").teacher_reply === "A teacher's answer.";
episodes.endSession(sid);
check("Y8. a trial reply is kept in memory and erased when the session ends", kept && !episodes.listTrialReferrals().some((r) => r.id === "ref-trial1"));

console.log(failed ? `\n${failed} reply case(s) failed` : "\nall reply cases behaved as expected");
process.exit(failed ? 1 : 0);
