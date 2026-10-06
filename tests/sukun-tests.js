// Quran display: the sukun in the Madinah Mushaf form (U+0652 -> U+06E1); the verified file is unchanged. Run: npm test
const fs = require("fs");
const path = require("path");
const { mushafSukun } = require("../public/js/sukun");

let failed = 0;
const check = (name, ok, detail = "") => {
  if (!ok) failed++;
  console.log(`${ok ? "ok  " : "FAIL"} ${name}${detail ? ` -> ${detail}` : ""}`);
};

const quran = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "data", "quran_fatiha.json"), "utf8"));
const ayah1 = quran.ayahs.find((a) => a.ayah === 1).text_ar;
const shown = mushafSukun(ayah1);

check("K1. every U+0652 becomes U+06E1", !shown.includes("ْ") && shown.split("ۡ").length - 1 === ayah1.split("ْ").length - 1, `${ayah1.split("ْ").length - 1} sukun`);
check("K2. nothing else changes", shown.replace(/ۡ/g, "ْ") === ayah1 && shown.length === ayah1.length);
check("K3. text without sukun is unchanged", mushafSukun("Al-Fatiha 1:1") === "Al-Fatiha 1:1");
const fileText = fs.readFileSync(path.join(__dirname, "..", "data", "quran_fatiha.json"), "utf8");
check("K4. the verified file still has U+0652 and no U+06E1", fileText.includes("ْ") && !fileText.includes("ۡ"));

console.log(failed ? `\n${failed} sukun case(s) failed` : "\nall sukun cases behaved as expected");
process.exit(failed ? 1 : 0);
