// Simple in-memory limits that protect the API budget on a public deployment.
// - per visitor (IP): a few model calls per hour
// - whole server: a daily cap on episode generations
// Counters reset when the server restarts, which is fine for a demo.

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;

function makeLimiter({ perIpPerHour, dailyCap }) {
  const hits = new Map(); // ip -> timestamps in the last hour
  let dayStart = Date.now();
  let dayCount = 0;

  return function limit(req, res, next) {
    const now = Date.now();
    if (now - dayStart > DAY) {
      dayStart = now;
      dayCount = 0;
    }
    if (dailyCap && dayCount >= dailyCap) {
      return res.status(429).json({ error: "daily limit reached, please try again tomorrow" });
    }
    const ip = req.ip || "unknown";
    const recent = (hits.get(ip) || []).filter((t) => now - t < HOUR);
    if (recent.length >= perIpPerHour) {
      hits.set(ip, recent);
      return res.status(429).json({ error: "too many requests, please try again later" });
    }
    recent.push(now);
    hits.set(ip, recent);
    dayCount++;
    next();
  };
}

const num = (v, fallback) => (Number.isInteger(Number(v)) && Number(v) > 0 ? Number(v) : fallback);

module.exports = {
  generateLimit: makeLimiter({
    perIpPerHour: num(process.env.GENERATIONS_PER_IP_PER_HOUR, 6),
    dailyCap: num(process.env.GENERATIONS_PER_DAY, 80),
  }),
  askLimit: makeLimiter({
    perIpPerHour: num(process.env.QUESTIONS_PER_IP_PER_HOUR, 30),
    dailyCap: num(process.env.QUESTIONS_PER_DAY, 400),
  }),
};
