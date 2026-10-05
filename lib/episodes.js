// Episode records.
// - Normal (demo) episodes are files in data/episodes/. Sample fixtures (sample-*.json) are never served.
// - Trial episodes (sessions with real children, see CLAUDE.md) live in memory only: they are never
//   written to disk, they expire after TRIAL_TTL_MS, and they are erased when the session ends.
const fs = require("fs");
const path = require("path");

const EPISODES_DIR = path.join(__dirname, "..", "data", "episodes");
const FILE_ID_RE = /^episode-\d{2}-[0-9TZ-]+$/;
const TRIAL_ID_RE = /^trial-\d{2}-[0-9TZ-]+$/;
const TRIAL_TTL_MS = 3 * 60 * 60 * 1000;

const trialRecords = new Map(); // id -> record
const trialReferrals = []; // referral entries for trial episodes, memory only

function isTrialId(id) {
  return typeof id === "string" && TRIAL_ID_RE.test(id);
}

function isValidId(id) {
  return typeof id === "string" && (FILE_ID_RE.test(id) || TRIAL_ID_RE.test(id));
}

function purgeExpired() {
  const now = Date.now();
  for (const [id, r] of trialRecords) {
    if (now - Date.parse(r.created_at) > TRIAL_TTL_MS) erase(id);
  }
}

function get(id) {
  if (!isValidId(id)) return null;
  if (isTrialId(id)) {
    purgeExpired();
    return trialRecords.get(id) || null;
  }
  try {
    return JSON.parse(fs.readFileSync(path.join(EPISODES_DIR, `${id}.json`), "utf8"));
  } catch {
    return null;
  }
}

function save(record) {
  if (isTrialId(record.id)) {
    trialRecords.set(record.id, record);
    return;
  }
  fs.mkdirSync(EPISODES_DIR, { recursive: true });
  fs.writeFileSync(path.join(EPISODES_DIR, `${record.id}.json`), JSON.stringify(record, null, 2) + "\n", "utf8");
}

function list() {
  purgeExpired();
  let files = [];
  try {
    files = fs.readdirSync(EPISODES_DIR);
  } catch {
    files = [];
  }
  const onDisk = files
    .filter((f) => f.endsWith(".json") && FILE_ID_RE.test(f.slice(0, -5)))
    .map((f) => get(f.slice(0, -5)))
    .filter(Boolean);
  return [...trialRecords.values(), ...onDisk].sort((a, b) => b.created_at.localeCompare(a.created_at));
}

// Removes a trial episode and every trial referral that points to it.
function erase(id) {
  if (!isTrialId(id)) return false;
  const existed = trialRecords.delete(id);
  for (let i = trialReferrals.length - 1; i >= 0; i--) {
    if (trialReferrals[i].episode_id === id) trialReferrals.splice(i, 1);
  }
  return existed;
}

function addTrialReferral(entry) {
  trialReferrals.push(entry);
}

function listTrialReferrals() {
  purgeExpired();
  return [...trialReferrals];
}

module.exports = { get, save, list, erase, isValidId, isTrialId, addTrialReferral, listTrialReferrals, EPISODES_DIR, TRIAL_TTL_MS };
