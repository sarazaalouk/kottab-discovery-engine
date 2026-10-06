// Reviewer PIN for /api/review/*.
// The PIN is set in the environment (REVIEWER_PIN on Render) and given to the judges in the
// submission file, never in the repository. The reviewer page sends it in the X-Reviewer-PIN header.
// Without REVIEWER_PIN the reviewer API is closed (503): it never opens without a PIN, not even locally.
const crypto = require("crypto");

const HOUR = 60 * 60 * 1000;
const MAX_WRONG_PER_HOUR = 10;
const wrong = new Map(); // ip -> timestamps of wrong PINs

function samePin(a, b) {
  const x = Buffer.from(String(a));
  const y = Buffer.from(String(b));
  return x.length === y.length && crypto.timingSafeEqual(x, y);
}

function requireReviewerPin(req, res, next) {
  const pin = process.env.REVIEWER_PIN;
  if (!pin) {
    return res.status(503).json({ error: "the reviewer page is not available: REVIEWER_PIN is not set on the server" });
  }
  const ip = req.ip || "unknown";
  const now = Date.now();
  const recent = (wrong.get(ip) || []).filter((t) => now - t < HOUR);
  if (recent.length >= MAX_WRONG_PER_HOUR) {
    wrong.set(ip, recent);
    return res.status(429).json({ error: "too many wrong PINs, please try again later" });
  }
  if (samePin(req.get("x-reviewer-pin") || "", pin)) return next();
  recent.push(now);
  wrong.set(ip, recent);
  return res.status(401).json({ error: "reviewer PIN required" });
}

module.exports = { requireReviewerPin, pinConfigured: () => Boolean(process.env.REVIEWER_PIN) };
