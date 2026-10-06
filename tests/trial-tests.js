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

console.log(failed ? `\n${failed} trial case(s) failed` : "\nall trial cases behaved as expected");
process.exit(failed ? 1 : 0);
