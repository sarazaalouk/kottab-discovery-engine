// Reading level from the letter games, including stage 5 (reading ayah 1:1 in full). Run: npm test
const { levelFrom } = require("../public/js/levels");

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

console.log(failed ? `\n${failed} level case(s) failed` : "\nall level cases behaved as expected");
process.exit(failed ? 1 : 0);
