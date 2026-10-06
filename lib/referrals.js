// Referrals (questions for the teacher) and the teacher's replies.
// A reply is written by the teacher (no model). It is checked only by the "no Arabic words" rule
// that the validator uses for model text (single, separate letters are allowed), so the child's
// English screen stays consistent.
const crypto = require("crypto");
const { normalizeArabic } = require("../validator");

const ARABIC_RE = /[؀-ۿݐ-ݿࢠ-ࣿﭐ-﷿ﹰ-﻿]/;
const MAX_REPLY = 600;

// Stable id for a referral: new entries carry one; older log lines get the same id every time.
function referralId(entry) {
  if (entry.id) return entry.id;
  return "ref-" + crypto.createHash("sha256").update(`${entry.created_at}|${entry.question}`).digest("hex").slice(0, 12);
}

function newReferralId() {
  return "ref-" + crypto.randomBytes(6).toString("hex");
}

// Returns an error message, or null when the reply can be saved.
function replyProblem(text) {
  if (typeof text !== "string" || !text.trim()) return "the reply is empty";
  if (text.length > MAX_REPLY) return `the reply is longer than ${MAX_REPLY} characters`;
  if (ARABIC_RE.test(text)) {
    const runs = normalizeArabic(text).match(/[ء-ي]+/g) || [];
    if (!runs.length || runs.some((r) => r.length > 1)) return "the reply has an Arabic word: write it in English (single Arabic letters are fine)";
  }
  return null;
}

// referrals.jsonl lines -> new lines with the reply stored on the matching referral, or null if not found.
function setReplyInLines(lines, id, reply, at) {
  let found = false;
  const out = lines.map((line) => {
    let e;
    try { e = JSON.parse(line); } catch { return line; }
    if (referralId(e) !== id) return line;
    found = true;
    return JSON.stringify({ ...e, id: referralId(e), teacher_reply: reply.trim(), replied_at: at });
  });
  return found ? out : null;
}

// What the episode page may show: the child's questions with the teacher's replies, for one episode.
// A trial referral is shown only to the episode of the same trial session (sessionId = the episode's session).
function repliesForEpisode(entries, episodeId, sessionId) {
  return entries
    .filter((e) => e.episode_id === episodeId && e.teacher_reply)
    .filter((e) => !e.trial_session_id || e.trial_session_id === sessionId)
    .sort((a, b) => a.replied_at.localeCompare(b.replied_at))
    .map((e) => ({ question: e.source === "child_question" ? e.question : null, reply: e.teacher_reply, replied_at: e.replied_at }));
}

module.exports = { referralId, newReferralId, replyProblem, setReplyInLines, repliesForEpisode, MAX_REPLY };
