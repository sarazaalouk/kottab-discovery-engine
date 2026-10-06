// Trial episodes over real HTTP: the episode, the report, the replies and a question are answered only
// for the trial's own session (X-Trial-Session header, or trial_session_id for /api/ask).
// Missing or different session → 404 with no data. Non-trial episodes work as before. Run: npm test
const fs = require("fs");
const path = require("path");
const app = require("../server");
const episodes = require("../lib/episodes");

const ROOT = path.join(__dirname, "..");
const sample = JSON.parse(fs.readFileSync(path.join(ROOT, "data/episodes/sample-episode-01.json"), "utf8"));
const REFERRALS_LOG = path.join(ROOT, "data/referrals.jsonl");
const MARK = "[http-tests] demo question";

let failed = 0;
const check = (name, ok, detail = "") => {
  if (!ok) failed++;
  console.log(`${ok ? "ok  " : "FAIL"} ${name}${detail ? ` -> ${detail}` : ""}`);
};

const SID = "0f1e2d3c-4b5a-4968-8778-695a4b3c2d1e";
const OTHER = "9a9a9a9a-8b8b-4c7c-9d6d-5e5e5e5e5e5e";
const now = new Date().toISOString();
const base = (id, extra) => ({
  id, created_at: now, episode_number: 1, root: "ر-ح-م", review: { decision: "auto_approved", by: "validator", at: now },
  validation: { passed: true, errors: [], warnings: [] },
  child: { name: "Child A", age: 7, home_language: "English", recites: "not shared", reading_level: "Knows most letters", diagnosis_source: "games" },
  episode: sample.episode, quran_inserted_by_server: sample.quran_inserted_by_server, cards_provided: sample.cards_provided, ...extra,
});
const trialId = "trial-01-2026-10-06T14-00-00-000Z";
const trialAskId = "trial-01-2026-10-06T14-01-00-000Z"; // waits for the teacher, so a question is referred with no model
const demoId = "episode-01-2026-10-06T00-00-00-001Z";
const demoAskId = "episode-01-2026-10-06T00-00-00-002Z";

(async () => {
  episodes.save(base(trialId, { status: "approved", trial_session_id: SID }));
  episodes.save(base(trialAskId, { status: "pending_review", trial_session_id: SID }));
  episodes.addTrialReferral({ id: "ref-http", created_at: now, trial_session_id: SID, episode_id: trialId, question: "Why?", source: "child_question", teacher_reply: "Because.", replied_at: now });
  episodes.save(base(demoId, { status: "approved" }));
  episodes.save(base(demoAskId, { status: "pending_review" }));

  const server = app.listen(0);
  const url = `http://127.0.0.1:${server.address().port}`;
  const get = async (p, sid) => {
    const r = await fetch(url + p, { headers: sid ? { "X-Trial-Session": sid } : {} });
    return { status: r.status, body: await r.json() };
  };
  const ask = async (id, sid) => {
    const r = await fetch(url + "/api/ask", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ episode_id: id, trial_session_id: sid, question: MARK }) });
    return { status: r.status, body: await r.json() };
  };
  const notFound = (r) => r.status === 404 && JSON.stringify(r.body) === JSON.stringify({ error: "episode not found" });

  try {
    // H1–H3: GET /api/episodes/:id
    let r = await get(`/api/episodes/${trialId}`, SID);
    check("H1. episode, own session → 200 with the episode", r.status === 200 && r.body.id === trialId && Array.isArray(r.body.meanings));
    check("H2. episode, no session → 404, no data", notFound(await get(`/api/episodes/${trialId}`)));
    check("H3. episode, another session → 404, no data", notFound(await get(`/api/episodes/${trialId}`, OTHER)));

    // H4–H6: GET /api/episodes/:id/report
    r = await get(`/api/episodes/${trialId}/report`, SID);
    check("H4. report, own session → 200 with the report", r.status === 200 && r.body.report && r.body.child_name === "Child A");
    check("H5. report, no session → 404, no data", notFound(await get(`/api/episodes/${trialId}/report`)));
    check("H6. report, another session → 404, no data", notFound(await get(`/api/episodes/${trialId}/report`, OTHER)));

    // H7–H9: GET /api/episodes/:id/replies
    r = await get(`/api/episodes/${trialId}/replies`, SID);
    check("H7. replies, own session → 200 with the teacher's reply", r.status === 200 && r.body.length === 1 && r.body[0].reply === "Because.");
    check("H8. replies, no session → 404, no data", notFound(await get(`/api/episodes/${trialId}/replies`)));
    check("H9. replies, another session → 404, no data", notFound(await get(`/api/episodes/${trialId}/replies`, OTHER)));

    // H10–H12: POST /api/ask (session in the body)
    r = await ask(trialAskId, SID);
    check("H10. question, own session → 200 (referred to the teacher)", r.status === 200 && r.body.type === "referral");
    const before = episodes.listTrialReferrals().length;
    check("H11. question, no session → 404, nothing logged", notFound(await ask(trialAskId)) && episodes.listTrialReferrals().length === before);
    check("H12. question, another session → 404, nothing logged", notFound(await ask(trialAskId, OTHER)) && episodes.listTrialReferrals().length === before);

    // H13: a non-trial episode with no header works as before on all four routes
    const e = await get(`/api/episodes/${demoId}`);
    const rep = await get(`/api/episodes/${demoId}/report`);
    const rpl = await get(`/api/episodes/${demoId}/replies`);
    const q = await ask(demoAskId);
    check("H13. non-trial episode, no header → episode, report, replies and question all answer 200",
      e.status === 200 && e.body.id === demoId && rep.status === 200 && rep.body.report && rpl.status === 200 && Array.isArray(rpl.body) && q.status === 200 && q.body.type === "referral",
      `${e.status} ${rep.status} ${rpl.status} ${q.status}`);
  } finally {
    server.close();
    // Clean up: the demo episodes were written to data/episodes/, the demo question to referrals.jsonl.
    for (const id of [demoId, demoAskId]) fs.rmSync(path.join(episodes.EPISODES_DIR, `${id}.json`), { force: true });
    if (fs.existsSync(REFERRALS_LOG)) {
      const lines = fs.readFileSync(REFERRALS_LOG, "utf8").split("\n").filter(Boolean).filter((l) => !l.includes(MARK));
      fs.writeFileSync(REFERRALS_LOG, lines.length ? lines.join("\n") + "\n" : "");
    }
  }

  console.log(failed ? `\n${failed} http case(s) failed` : "\nall http cases behaved as expected");
  process.exit(failed ? 1 : 0);
})();
