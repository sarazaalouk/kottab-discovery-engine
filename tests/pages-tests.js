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

// G4: the episode page never has Quran text typed into it: any Arabic in episode.html is a single, separate letter
// (the "While you wait" ayah comes from GET /api/quran).
const episodeHtml = read("public/episode.html");
const arabicRuns = episodeHtml.replace(/[\u064B-\u0652\u0670\u06E1]/g, "").match(/[\u0621-\u064A\u0671]+/g) || [];
const longRuns = arabicRuns.filter((r) => r.length > 1);
check("G4. episode.html has no Arabic beyond single letters (no ayah typed in by hand)", longRuns.length === 0 && episodeHtml.includes('fetch("/api/quran")'),
  longRuns.join(" ") || `${arabicRuns.length} single letters`);

// G5: the "While you wait" count is worked out from the verified ayah: ر appears twice in 1:1.
const { countLetter } = require("../public/js/wait-steps");
const quranFile = JSON.parse(read("data/quran_fatiha.json"));
check("G5. counting ر in ayah 1:1 from the verified file gives 2", countLetter(quranFile.ayahs.find((a) => a.ayah === 1).text_ar, "ر") === 2);

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
