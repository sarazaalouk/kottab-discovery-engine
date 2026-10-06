// The numbers written in the docs must match the project. Run: npm test
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const read = (p) => fs.readFileSync(path.join(ROOT, p), "utf8").replace(/\r\n/g, "\n");

let failed = 0;
const check = (name, ok, detail = "") => {
  if (!ok) failed++;
  console.log(`${ok ? "ok  " : "FAIL"} ${name}${detail ? ` -> ${detail}` : ""}`);
};

// D1: approved cards in the knowledge base, and the count written in CLAUDE.md
const kb = JSON.parse(read("data/kb_tafsir.json"));
const approved = kb.entries.filter((c) => c.status === "approved").length;
const claude = read("CLAUDE.md");
const m = claude.match(/المعتمد حاليًا (\d+) بطاقة/);
check("D1. CLAUDE.md states the real number of approved cards", m && Number(m[1]) === approved, `CLAUDE.md ${m && m[1]}, data ${approved}`);

// D2: validator cases in the plan = cases in tests/validator-tests.js
const plan = read("docs/validator-tests.md");
const validatorRows = (plan.split("## Last run")[0].match(/^\| (\d+[a-z]?) \|/gm) || []).length;
const validatorCases = (read("tests/validator-tests.js").match(/^\s*\["\d+[a-z]?\. /gm) || []).length;
const lastRun = plan.match(/all (\d+) cases \(0–/);
check("D2. validator: plan rows, test cases and 'Last run' agree", validatorRows === validatorCases && lastRun && Number(lastRun[1]) === validatorCases,
  `rows ${validatorRows}, tests ${validatorCases}, last run ${lastRun && lastRun[1]}`);

// D3: publishing cases in the plan = checks in tests/publish-tests.js
const pubRows = (plan.match(/^\| P\d+ \|/gm) || []).length;
const pubChecks = (read("tests/publish-tests.js").match(/check\("P\d+\./g) || []).length;
const pubLast = plan.match(/## Publishing[\s\S]*?Last run: [^,]+, all (\d+) cases/);
check("D3. publishing: plan rows, test checks and 'Last run' agree", pubRows === pubChecks && pubLast && Number(pubLast[1]) === pubChecks,
  `rows ${pubRows}, tests ${pubChecks}, last run ${pubLast && pubLast[1]}`);

console.log(failed ? `\n${failed} docs case(s) failed` : "\nall docs cases behaved as expected");
process.exit(failed ? 1 : 0);
