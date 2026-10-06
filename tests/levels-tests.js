// Reading level from the letter games, including stage 5 (reading ayah 1:1 in full). Run: npm test
const { levelFrom, parentDiagnosis, levelLabel, startStage, runStages } = require("../public/js/levels");

let failed = 0;
const check = (name, actual, expected) => {
  const ok = actual === expected;
  if (!ok) failed++;
  console.log(`${ok ? "ok  " : "FAIL"} ${name} -> ${actual}${ok ? "" : ` (expected ${expected})`}`);
};
const p = (passed) => ({ passed });

check("L1. stage 1 failed", levelFrom({ sound: p(false) }), "Does not know the letters yet");
check("L2. stage 1 passed, stage 2 failed", levelFrom({ sound: p(true), shape: p(false) }), "Knows some letters");
check("L3. stage 2 passed, stage 3 failed", levelFrom({ sound: p(true), shape: p(true), fatha: p(false) }), "Knows most letters");
check("L4. stage 3 passed, stage 4 failed (no stage 5)", levelFrom({ sound: p(true), shape: p(true), fatha: p(true), fatiha: p(false) }), "Reads short words");
check("L5. stage 4 passed, stage 5 failed", levelFrom({ sound: p(true), shape: p(true), fatha: p(true), fatiha: p(true), ayah: p(false) }), "Reads short words");
check("L6. stage 5 passed", levelFrom({ sound: p(true), shape: p(true), fatha: p(true), fatiha: p(true), ayah: p(true) }), "Reads Arabic well");
check("L7. stage 5 cannot count without stage 4", levelFrom({ sound: p(true), shape: p(true), fatha: p(true), ayah: p(true) }), "Reads short words");

// L8–L11: "Skip the games" (parent page)
const parent = (level, extra = {}) => ({ name: "Adam", parent_reading_level: level, ...extra });
const d = parentDiagnosis(parent("Reads Arabic well"), "2026-10-06T00:00:00Z");
check("L8. skip offered for Reads Arabic well; the level is the parent's choice", d && `${d.reading_level}|${d.diagnosis_source}|${d.reads_fatiha_words}`, "Reads Arabic well|parent|true");
check("L9. skip offered for Reads short words", parentDiagnosis(parent("Reads short words")).reading_level, "Reads short words");
check("L10. skip not offered for the letter levels", ["Does not know the letters yet", "Knows some letters", "Knows most letters"].map((l) => parentDiagnosis(parent(l))).every((x) => x === null), true);
check("L12. Reads Arabic well is shown to parents as reading ayah 1:1 aloud; other levels keep their names",
  `${levelLabel("Reads Arabic well")}|${levelLabel("Reads short words")}`, "Read ayah 1:1 aloud (confirmed by a grown-up)|Reads short words");
check("L13. from the games, the fifth level keeps its reading label", levelLabel("Reads Arabic well", "games"), "Read ayah 1:1 aloud (confirmed by a grown-up)");
check("L14. from the parent (games skipped), both skip levels are shown as the parent's estimate; other levels keep their names",
  `${levelLabel("Reads Arabic well", "parent")}|${levelLabel("Reads short words", "parent")}|${levelLabel("Knows most letters", "parent")}`,
  "Parent's estimate — the letter games were skipped|Parent's estimate — the letter games were skipped|Knows most letters");
check("L11. skip never offered in a trial session", parentDiagnosis(parent("Reads Arabic well", { trial: true })), null);

// L15–L17: adaptive starting point. play() answers from a fixed list; "shown" is what the child actually played.
(async () => {
  const run = (profile, results) => runStages(startStage(profile), async (key) => ({ passed: results[key] }));
  const up = await run({ parent_reading_level: "Reads Arabic well" }, { fatha: true, fatiha: true, ayah: true });
  check("L15. a reader starts at stage 3 and passes: stage 1 is never shown, stages 1–2 are counted as passed",
    `${up.shown.join(",")}|${up.stages.sound.inferred && up.stages.shape.inferred}|${levelFrom(up.stages)}`, "fatha,fatiha,ayah|true|Reads Arabic well");
  const down = await run({ parent_reading_level: "Reads short words" }, { fatha: false, shape: true });
  check("L16. a reader fails stage 3 and passes stage 2 → Knows most letters",
    `${down.shown.join(",")}|${levelFrom(down.stages)}`, "fatha,shape|Knows most letters");
  const none = await run({}, { sound: true, shape: false });
  check("L17. no level chosen (and any trial session) starts at stage 1",
    `${none.shown.join(",")}|${startStage({ trial: true, parent_reading_level: "Reads Arabic well" })}`, "sound,shape|sound");

  console.log(failed ? `\n${failed} level case(s) failed` : "\nall level cases behaved as expected");
  process.exit(failed ? 1 : 0);
})();
