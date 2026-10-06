// Episode records.
// - Normal (demo) episodes are files in data/episodes/. Sample fixtures (sample-*.json) are never served.
// - Trial episodes (sessions with real children, see CLAUDE.md) live in memory only: they are never
//   written to disk, they expire after TRIAL_TTL_MS, and they are erased when the session ends.
const fs = require("fs");
const path = require("path");

// Where generated episodes and the referral log are written. DATA_STORE_DIR (optional) points to a
// lasting disk (on Render: /var/data), so they survive a deploy or restart. Not set: inside the project, as before.
// Read-only files (Quran, knowledge base, Noor Al-Bayan, checks, sample fixtures) always stay in data/.
const STORE_DIR = process.env.DATA_STORE_DIR ? path.resolve(process.env.DATA_STORE_DIR) : null;
const EPISODES_DIR = STORE_DIR ? path.join(STORE_DIR, "episodes") : path.join(__dirname, "..", "data", "episodes");
const REFERRALS_LOG = STORE_DIR ? path.join(STORE_DIR, "referrals.jsonl") : path.join(__dirname, "..", "data", "referrals.jsonl");
if (STORE_DIR) fs.mkdirSync(EPISODES_DIR, { recursive: true });
const FILE_ID_RE = /^episode-\d{2}-[0-9TZ-]+$/;
const TRIAL_ID_RE = /^trial-\d{2}-[0-9TZ-]+$/;
const TRIAL_TTL_MS = 3 * 60 * 60 * 1000;
// Trial session id, made in the browser before anything is generated (crypto.randomUUID).
const TRIAL_SESSION_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

const trialRecords = new Map(); // id -> record
const trialReferrals = []; // referral entries for trial episodes, memory only
// Ended sessions: id -> time it was erased. A generation still running for one of these ids
// must not save anything afterwards, so the id is remembered for a while after erasing.
const endedTrialIds = new Map();
// Ended trial sessions: session id -> time it ended. Anything saved later with this session id is dropped,
// even an episode whose id never reached the browser.
const endedSessions = new Map();

function isTrialSessionId(sid) {
  return typeof sid === "string" && TRIAL_SESSION_RE.test(sid);
}

function isSessionEnded(sid) {
  return endedSessions.has(sid);
}

function isEnded(id) {
  return endedTrialIds.has(id);
}

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
  for (const [id, at] of endedTrialIds) {
    if (now - at > 2 * TRIAL_TTL_MS) endedTrialIds.delete(id);
  }
  for (const [sid, at] of endedSessions) {
    if (now - at > 2 * TRIAL_TTL_MS) endedSessions.delete(sid);
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

// Returns false when nothing was saved (a trial session that has already ended).
function save(record) {
  if (isTrialId(record.id)) {
    if (isEnded(record.id) || isSessionEnded(record.trial_session_id)) return false;
    trialRecords.set(record.id, record);
    return true;
  }
  fs.mkdirSync(EPISODES_DIR, { recursive: true });
  fs.writeFileSync(path.join(EPISODES_DIR, `${record.id}.json`), JSON.stringify(record, null, 2) + "\n", "utf8");
  return true;
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

// Removes a trial episode and every trial referral that points to it, and marks the id as ended
// so that a generation still running cannot save it again.
function erase(id) {
  if (!isTrialId(id)) return false;
  endedTrialIds.set(id, Date.now());
  const existed = trialRecords.delete(id);
  for (let i = trialReferrals.length - 1; i >= 0; i--) {
    if (trialReferrals[i].episode_id === id) trialReferrals.splice(i, 1);
  }
  return existed;
}

// Ends a trial session: marks the session id as ended and erases every episode and referral that carries it.
function endSession(sid) {
  if (!isTrialSessionId(sid)) return 0;
  endedSessions.set(sid, Date.now());
  let erased = 0;
  for (const [id, r] of trialRecords) {
    if (r.trial_session_id === sid && erase(id)) erased++;
  }
  for (let i = trialReferrals.length - 1; i >= 0; i--) {
    if (trialReferrals[i].trial_session_id === sid) trialReferrals.splice(i, 1);
  }
  return erased;
}

function addTrialReferral(entry) {
  if (entry.episode_id && isEnded(entry.episode_id)) return false;
  if (isSessionEnded(entry.trial_session_id)) return false;
  trialReferrals.push(entry);
  return true;
}

// Stores the teacher's reply on a trial referral (memory only, erased with the session).
// A late reply for a session or episode that has ended is dropped.
function setTrialReply(id, reply, at) {
  const entry = trialReferrals.find((e) => e.id === id);
  if (!entry) return false;
  if (isSessionEnded(entry.trial_session_id) || (entry.episode_id && isEnded(entry.episode_id))) return false;
  entry.teacher_reply = reply.trim();
  entry.replied_at = at;
  return true;
}

function listTrialReferrals() {
  purgeExpired();
  return [...trialReferrals];
}

module.exports = { get, save, list, erase, endSession, isEnded, isSessionEnded, isTrialSessionId, isValidId, isTrialId, addTrialReferral, setTrialReply, listTrialReferrals, EPISODES_DIR, REFERRALS_LOG, TRIAL_TTL_MS };
