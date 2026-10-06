// Reviewer PIN: closed without a PIN on the server, open only with the right PIN. Run: npm test
const { requireReviewerPin } = require("../lib/reviewer-pin");

let failed = 0;
const check = (name, ok, detail = "") => {
  if (!ok) failed++;
  console.log(`${ok ? "ok  " : "FAIL"} ${name}${detail ? ` -> ${detail}` : ""}`);
};

function call(pinHeader, ip) {
  const req = { ip, get: (h) => (h.toLowerCase() === "x-reviewer-pin" ? pinHeader : undefined) };
  const out = { status: 200, next: false };
  const res = { status(code) { out.status = code; return this; }, json(body) { out.body = body; return this; } };
  requireReviewerPin(req, res, () => { out.next = true; });
  return out;
}

const saved = process.env.REVIEWER_PIN;

delete process.env.REVIEWER_PIN;
const closed = call("anything", "10.0.0.1");
check("R1. no PIN set on the server: 503, never open", closed.status === 503 && !closed.next, closed.body && closed.body.error);

process.env.REVIEWER_PIN = "246810";
check("R2. wrong PIN: 401", call("111111", "10.0.0.2").status === 401);
check("R3. no PIN sent: 401", call(undefined, "10.0.0.2").status === 401);
const ok = call("246810", "10.0.0.3");
check("R4. right PIN: allowed", ok.next === true);

if (saved === undefined) delete process.env.REVIEWER_PIN;
else process.env.REVIEWER_PIN = saved;

console.log(failed ? `\n${failed} PIN case(s) failed` : "\nall PIN cases behaved as expected");
process.exit(failed ? 1 : 0);
