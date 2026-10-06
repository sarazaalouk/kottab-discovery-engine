// Publishing rule (CLAUDE.md, "بوابة المراجعة"):
// - passes the validator and has no referrals → approved at once (auto-published);
//   a teacher reviews it after it is shown and can withdraw it
// - passes the validator but has referrals   → pending_review (waits for the teacher)
// - fails the validator                      → rejected (never shown)

// PUBLISH_MODE (environment):
// - "auto" (default when not set): the rule above.
// - "review-first": every episode that passes the validator waits for the teacher (pending_review),
//   e.g. for trials with real children, so a teacher sees each episode before the child does.
// Any other value is treated as "review-first", so a typo can only make publishing stricter.
const PUBLISH_MODES = ["auto", "review-first"];
function publishMode(value = process.env.PUBLISH_MODE) {
  if (value === undefined || value === "") return "auto";
  return PUBLISH_MODES.includes(value) ? value : "review-first";
}

function initialStatus(validationPassed, referralCount, mode = publishMode()) {
  if (!validationPassed) return "rejected";
  if (mode === "review-first") return "pending_review";
  return referralCount === 0 ? "approved" : "pending_review";
}

function autoReview(at = new Date().toISOString()) {
  return { decision: "auto_approved", by: "validator", at };
}

// True when a Kottab teacher (not only the validator) has approved the episode.
function teacherApproved(record) {
  return Boolean(record && record.status === "approved" && record.review && record.review.decision === "approve");
}

// Reviewer decisions. withdraw takes a published (approved) episode away from the child and needs a note.
const DECISIONS = { approve: "approved", return: "returned", refer: "referred", withdraw: "returned" };

// Applies a reviewer decision to a record (in place). Returns an error message, or null on success.
function applyDecision(record, decision, note, at = new Date().toISOString()) {
  if (!DECISIONS[decision]) return "decision must be approve, return, refer, or withdraw";
  if (record.status === "generating") return "the episode is still being generated";
  if (decision === "approve" && !(record.validation && record.validation.passed)) {
    return "an episode rejected by the validator cannot be approved";
  }
  const cleanNote = typeof note === "string" ? note.trim().slice(0, 1000) : "";
  if (decision === "withdraw") {
    if (record.status !== "approved") return "only a published (approved) episode can be withdrawn";
    if (!cleanNote) return "a note is required to withdraw an episode";
  }
  // Keep earlier decisions (including the validator's auto-approval) for the record.
  if (record.review) record.review_history = [...(record.review_history || []), record.review];
  record.status = DECISIONS[decision];
  record.review = { decision, note: cleanNote, reviewed_by: "Kottab teacher", reviewed_at: at };
  return null;
}

module.exports = { initialStatus, publishMode, autoReview, teacherApproved, applyDecision };
