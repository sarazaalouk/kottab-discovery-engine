// Teacher replies to referrals (no model): the "no Arabic words" rule, storage in the log file
// and in trial memory, and what the episode page may show. Run: npm test
const { referralId, replyProblem, setReplyInLines, repliesForEpisode } = require("../lib/referrals");
const episodes = require("../lib/episodes");
const { renderReplies } = require("../public/js/replies-view");

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

// Y9 (a): a reply reaches only the episode, and the trial session, that the referral belongs to.
const sidA = "11111111-2222-4333-8444-555555555555";
const sidB = "66666666-7777-4888-9999-aaaaaaaaaaaa";
const trialEp = "trial-01-2026-10-06T11-00-00-000Z";
const trialRef = { id: "ref-a", created_at: "t", trial_session_id: sidA, episode_id: trialEp, question: "Q", source: "child_question", teacher_reply: "R", replied_at: "2026-10-06T11:05:00.000Z" };
check("Y9. a reply is shown only to its own episode and its own trial session",
  repliesForEpisode([trialRef], trialEp, sidA).length === 1 &&
  repliesForEpisode([trialRef], trialEp, sidB).length === 0 &&
  repliesForEpisode([trialRef], "trial-01-2026-10-06T12-00-00-000Z", sidA).length === 0 &&
  repliesForEpisode([saved], "episode-01-y", undefined).length === 0);

// Y10 (b): after End session, a late reply to a referral of that session is dropped.
const sidC = "bbbbbbbb-cccc-4ddd-8eee-ffffffffffff";
episodes.addTrialReferral({ id: "ref-late", created_at: "2026-10-06T12:00:00.000Z", trial_session_id: sidC, episode_id: null, question: "Late?", source: "child_question" });
episodes.endSession(sidC);
check("Y10. after End session, a late reply to that session's referral saves nothing",
  episodes.setTrialReply("ref-late", "Too late.", "2026-10-06T12:10:00.000Z") === false && !episodes.listTrialReferrals().some((r) => r.id === "ref-late"));

// Y11 (c): the reply goes on the page as text (textContent), never as HTML.
function fakeDoc() {
  let usedInnerHTML = false;
  const el = (tag) => {
    const node = {
      tag, className: "", childNodes: [], _text: "",
      get firstChild() { return this.childNodes[0] || null; },
      appendChild(c) { this.childNodes.push(c); return c; },
      removeChild(c) { this.childNodes.splice(this.childNodes.indexOf(c), 1); return c; },
      set textContent(v) { this._text = String(v); this.childNodes = []; },
      get textContent() { return this._text + this.childNodes.map((c) => c.textContent).join(""); },
      set innerHTML(v) { usedInnerHTML = true; },
    };
    return node;
  };
  return { createElement: el, createTextNode: (t) => ({ textContent: t }), usedInnerHTML: () => usedInnerHTML, el };
}
const doc = fakeDoc();
const container = doc.el("div");
renderReplies(container, [{ question: "Why <i>two</i>?", reply: "<b>Mercy</b> twice" }], doc);
const answerP = container.childNodes[0].childNodes[1];
check("Y11. the reply is inserted with textContent: <b> stays plain text",
  !doc.usedInnerHTML() && answerP.childNodes[1].textContent === " <b>Mercy</b> twice" &&
  container.textContent === "You asked: Why <i>two</i>?Your teacher answered: <b>Mercy</b> twice");

console.log(failed ? `\n${failed} reply case(s) failed` : "\nall reply cases behaved as expected");
process.exit(failed ? 1 : 0);
