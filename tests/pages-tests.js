// Page structure checks that need no browser. Run: npm test
const fs = require("fs");
const path = require("path");

const read = (p) => fs.readFileSync(path.join(__dirname, "..", p), "utf8");
let failed = 0;
const check = (name, ok, detail = "") => {
  if (!ok) failed++;
  console.log(`${ok ? "ok  " : "FAIL"} ${name}${detail ? ` -> ${detail}` : ""}`);
};

// G1–G2: "Why this journey" on the parent page comes after the parent gate.
const index = read("public/index.html");
check("G1. the Why this journey box is placed after the parent gate", index.indexOf('id="gate"') !== -1 && index.indexOf('id="why"') > index.indexOf('id="gate"'));
const calls = index.match(/loadWhy\(false\)/g) || [];
const parentArea = (index.match(/function showParentArea\(\) \{[\s\S]*?\n  \}/) || [""])[0];
check("G2. the box is filled only once the gate is passed", calls.length === 1 && parentArea.includes("loadWhy(false)"));

console.log(failed ? `\n${failed} page case(s) failed` : "\nall page cases behaved as expected");
process.exit(failed ? 1 : 0);
