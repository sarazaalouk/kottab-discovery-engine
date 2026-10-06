// "Ask a question" — only child cards can answer, and the answer is the child sentence. Run: npm test
const fs = require("fs");
const path = require("path");
const { askCandidates, askAnswer } = require("../lib/ask");

const kb = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "data", "kb_tafsir.json"), "utf8"));
const ep1 = kb.entries.filter((c) => c.episode === 1).map((c) => c.id);
const record = { cards_provided: ep1 };

let failed = 0;
const check = (name, ok, detail = "") => {
  if (!ok) failed++;
  console.log(`${ok ? "ok  " : "FAIL"} ${name}${detail ? ` -> ${detail}` : ""}`);
};

const candidates = askCandidates(kb.entries, record);
const ids = candidates.map((c) => c.id);
check("A1. every candidate is approved and for the child", candidates.every((c) => c.status === "approved" && c.audience.includes("child")), ids.join(" "));

// kb-001 is approved and has a child sentence, but it is for parents and teachers only.
check("A2. a parent/teacher-only card is never a candidate", !ids.includes("kb-001"));
check("A3. choosing a parent/teacher-only card gives no answer (referral)", askAnswer(candidates, { in_scope: true, card_id: "kb-001" }) === null);

const ans = askAnswer(candidates, { in_scope: true, card_id: "kb-031" });
const kb031 = kb.entries.find((c) => c.id === "kb-031");
check("A4. the answer is the card's child sentence, word for word", ans && ans.text === kb031.meaning_en_child && ans.text !== kb031.meaning_en);
check("A5. out of scope gives no answer", askAnswer(candidates, { in_scope: false, card_id: "kb-031" }) === null);

console.log(failed ? `\n${failed} ask case(s) failed` : "\nall ask cases behaved as expected");
process.exit(failed ? 1 : 0);
