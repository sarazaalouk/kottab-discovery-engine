// DATA_STORE_DIR: generated episodes and referrals go to a lasting folder when it is set. Run: npm test
const fs = require("fs");
const os = require("os");
const path = require("path");

// Must be set before the server and lib/episodes.js are loaded.
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "kottab-store-"));
process.env.DATA_STORE_DIR = tmp;
const episodes = require("../lib/episodes");
const app = require("../server");

const ROOT = path.join(__dirname, "..");
const id = "episode-01-2026-10-06T00-00-00-003Z";
let failed = 0;
const check = (name, ok, detail = "") => {
  if (!ok) failed++;
  console.log(`${ok ? "ok  " : "FAIL"} ${name}${detail ? ` -> ${detail}` : ""}`);
};

(async () => {
  const projectLog = path.join(ROOT, "data", "referrals.jsonl");
  const projectLogBefore = fs.existsSync(projectLog) ? fs.readFileSync(projectLog, "utf8") : null;
  const server = app.listen(0);
  try {
    // A waiting episode, so the question is referred without the model.
    const record = { id, status: "pending_review", created_at: new Date().toISOString(), episode_number: 1, child: { name: "Adam" }, review: null };
    episodes.save(record);
    const r = await fetch(`http://127.0.0.1:${server.address().port}/api/ask`, {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ episode_id: id, question: "[store-tests] question" }),
    });
    const log = fs.existsSync(path.join(tmp, "referrals.jsonl")) ? fs.readFileSync(path.join(tmp, "referrals.jsonl"), "utf8") : "";
    check("S1. with DATA_STORE_DIR, the episode and the referral are saved and read there, not in the project",
      fs.existsSync(path.join(tmp, "episodes", `${id}.json`)) && episodes.get(id).status === "pending_review" &&
      !fs.existsSync(path.join(ROOT, "data", "episodes", `${id}.json`)) &&
      r.status === 200 && log.includes("[store-tests] question") &&
      (fs.existsSync(projectLog) ? fs.readFileSync(projectLog, "utf8") : null) === projectLogBefore &&
      episodes.EPISODES_DIR === path.join(tmp, "episodes"));
  } finally {
    server.close();
    fs.rmSync(tmp, { recursive: true, force: true });
  }
  console.log(failed ? `\n${failed} store case(s) failed` : "\nall store cases behaved as expected");
  process.exit(failed ? 1 : 0);
})();
