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

// G3: no next root or "Episode 2" is promised anywhere in the product or the docs.
function files(dir) {
  return fs.readdirSync(path.join(__dirname, "..", dir), { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? files(`${dir}/${e.name}`) : [`${dir}/${e.name}`]
  );
}
const scanned = [...files("public"), ...files("docs"), ...files("lib"), ...files("prompts"), "server.js", "README.md", "CLAUDE.md"]
  .filter((f) => /\.(html|js|md|css)$/.test(f));
const promising = scanned.filter((f) => /س-ل-م|Episode 2\b/i.test(read(f)));
check("G3. no mention of the root س-ل-م or Episode 2", promising.length === 0, promising.join(", ") || `${scanned.length} files`);

console.log(failed ? `\n${failed} page case(s) failed` : "\nall page cases behaved as expected");
process.exit(failed ? 1 : 0);
