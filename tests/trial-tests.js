// Trial sessions: once ended, nothing about them can be saved again. Run: npm test
const episodes = require("../lib/episodes");

let failed = 0;
const check = (name, ok, detail = "") => {
  if (!ok) failed++;
  console.log(`${ok ? "ok  " : "FAIL"} ${name}${detail ? ` -> ${detail}` : ""}`);
};

const id = "trial-01-2026-10-06T00-00-00-000Z";
const record = { id, status: "generating", created_at: new Date().toISOString(), child: { name: "Child A" } };

check("T1. a trial episode is held in memory", episodes.save(record) === true && episodes.get(id) !== null);
episodes.addTrialReferral({ episode_id: id, question: "test" });

check("T2. ending the session erases it", episodes.erase(id) === true && episodes.get(id) === null);
check("T3. its referrals are erased too", !episodes.listTrialReferrals().some((r) => r.episode_id === id));

// A generation that was still running finishes after the session ended and tries to save.
record.status = "approved";
check("T4. saving after the session ended saves nothing", episodes.save(record) === false && episodes.get(id) === null);
check("T5. a referral after the session ended is not kept", episodes.addTrialReferral({ episode_id: id, question: "late" }) === false && !episodes.listTrialReferrals().some((r) => r.episode_id === id));
check("T6. the id is marked as ended", episodes.isEnded(id) === true);

// T7–T10: the session id. End session is pressed before the episode id reached the browser:
// the browser only knows its session id, and the server must still drop everything from that session.
const sid = "3f2b8c1e-5a6d-4e7f-8a9b-0c1d2e3f4a5b";
const lateId = "trial-01-2026-10-06T12-00-00-000Z";
const late = { id: lateId, trial_session_id: sid, status: "generating", created_at: new Date().toISOString(), child: { name: "Child B" } };
episodes.save(late); // the server saved "generating"; its 202 reply has not reached the browser yet
episodes.addTrialReferral({ episode_id: null, trial_session_id: sid, question: "early" });
check("T7. End session with only the session id erases the episode and its referrals",
  episodes.endSession(sid) === 1 && episodes.get(lateId) === null && !episodes.listTrialReferrals().some((r) => r.trial_session_id === sid));
late.status = "approved"; // the generation finishes after the session ended
check("T8. ended before the reply, then a save: nothing is saved", episodes.save(late) === false && episodes.get(lateId) === null);
const otherId = "trial-01-2026-10-06T12-05-00-000Z";
check("T9. a save with a new episode id from the same ended session is dropped too",
  episodes.save({ id: otherId, trial_session_id: sid, status: "approved", created_at: new Date().toISOString(), child: { name: "Child B" } }) === false && episodes.get(otherId) === null);
check("T10. a late referral carrying the ended session id is not kept",
  episodes.addTrialReferral({ episode_id: lateId, trial_session_id: sid, question: "late" }) === false && !episodes.listTrialReferrals().some((r) => r.trial_session_id === sid));

console.log(failed ? `\n${failed} trial case(s) failed` : "\nall trial cases behaved as expected");
process.exit(failed ? 1 : 0);
