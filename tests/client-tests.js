// Episode page: a shown episode is checked every 30 seconds and the page reacts when it is withdrawn.
// Uses fake timers, so the test runs instantly. Run: npm test
const { watchEpisode, watchReplies } = require("../public/js/episode-watch");

let failed = 0;
const check = (name, ok, detail = "") => {
  if (!ok) failed++;
  console.log(`${ok ? "ok  " : "FAIL"} ${name}${detail ? ` -> ${detail}` : ""}`);
};

function fakeTimers() {
  const t = { fn: null, ms: null, cleared: false };
  t.setInterval = (fn, ms) => { t.fn = fn; t.ms = ms; return 1; };
  t.clearInterval = () => { t.cleared = true; };
  return t;
}

(async () => {
  // W1–W3: approved twice, then withdrawn
  const timers = fakeTimers();
  const statuses = ["approved", "approved", "returned"];
  const seen = [];
  watchEpisode({ fetchStatus: async () => statuses.shift(), onChange: (s) => seen.push(s), timers });
  check("W1. checks every 30 seconds", timers.ms === 30000, `${timers.ms} ms`);
  await timers.fn();
  await timers.fn();
  check("W2. nothing happens while the episode is still approved", seen.length === 0);
  await timers.fn();
  check("W3. a withdrawn episode (returned) is reported once and the checks stop", seen.length === 1 && seen[0] === "returned" && timers.cleared);

  // W4: a failed request does not stop the checks or report anything
  const t2 = fakeTimers();
  const seen2 = [];
  watchEpisode({ fetchStatus: async () => { throw new Error("offline"); }, onChange: (s) => seen2.push(s), timers: t2 });
  await t2.fn();
  check("W4. a dropped request is ignored and tried again next time", seen2.length === 0 && !t2.cleared);

  // W5: the teacher's replies are fetched at once and every 30 seconds; the page updates when a new one arrives
  const t3 = fakeTimers();
  const replies = [[], [], [{ reply: "Ask me tomorrow." }]];
  const got = [];
  watchReplies({ fetchReplies: async () => replies.shift(), onReplies: (l) => got.push(l.length), timers: t3 });
  await new Promise((r) => setImmediate(r));
  await t3.fn();
  await t3.fn();
  check("W5. replies are checked every 30 seconds and shown once a new one arrives", t3.ms === 30000 && got.length === 1 && got[0] === 1);

  console.log(failed ? `\n${failed} client case(s) failed` : "\nall client cases behaved as expected");
  process.exit(failed ? 1 : 0);
})();
