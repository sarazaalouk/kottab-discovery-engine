// Kottab Discovery Engine — shared browser helpers.
// All child data stays in this browser (localStorage). Nothing here is sent anywhere
// except the profile fields the episode request needs.

const KEYS = {
  profile: "kottab.profile",
  diagnosis: "kottab.diagnosis",
  episodeId: "kottab.episodeId",
  gate: "kottab.parentGate",
};

const store = {
  get(key) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },
  set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch {
      return false;
    }
  },
  remove(key) {
    try { localStorage.removeItem(key); } catch { /* storage unavailable */ }
  },
};

// Parent gate: unlocked for this browser tab session only.
const gate = {
  isOpen() {
    try { return sessionStorage.getItem(KEYS.gate) === "open"; } catch { return false; }
  },
  open() {
    try { sessionStorage.setItem(KEYS.gate, "open"); } catch { /* storage unavailable */ }
  },
};

const PAGES = [
  { href: "index.html", label: "Parent" },
  { href: "diagnosis.html", label: "Games" },
  { href: "episode.html", label: "Episode" },
  { href: "report.html", label: "Report" },
];

// Renders the top bar. `current` is the page file name.
function renderTopbar(current) {
  const header = document.createElement("header");
  header.className = "topbar";
  header.dir = "ltr"; // the bar is English on every page, including the Arabic reviewer page
  const links = PAGES.map(
    (p) => `<a href="${p.href}"${p.href === current ? ' aria-current="page"' : ""}>${p.label}</a>`
  ).join("");
  const reviewer = gate.isOpen()
    ? `<a href="reviewer.html"${current === "reviewer.html" ? ' aria-current="page"' : ""}>Reviewer</a>`
    : "";
  header.innerHTML = `
    <div class="topbar-inner">
      <div class="brand">Kottab Discovery<small>Al-Fatiha · Season 1</small></div>
      <nav class="nav" aria-label="Pages">${links}${reviewer}</nav>
    </div>`;
  document.body.prepend(header);
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

// Root letters written as "ر ح م (r, h, m)" become tiles [ر / r] [ح / h] [م / m],
// laid out right to left in Arabic order. Other Arabic letters just get the Arabic font.
function letterTiles(letters, names) {
  return `<span class="root-tiles" dir="rtl" lang="ar">${letters
    .map((l, i) => `<span class="tile"><span class="tile-letter">${l}</span><span class="tile-name" lang="en">${escapeHtml(names[i])}</span></span>`)
    .join("")}</span>`;
}

function formatLetters(text) {
  const LETTERS_WITH_NAMES = /([؀-ۿ](?:[\s\-][؀-ۿ])*)\s*\(([^)]*)\)/g;
  let out = "";
  let last = 0;
  for (const m of text.matchAll(LETTERS_WITH_NAMES)) {
    const letters = m[1].split(/[\s\-]+/);
    const names = m[2].split(",").map((s) => s.trim());
    if (letters.length !== names.length) continue;
    out += plainLetters(text.slice(last, m.index)) + letterTiles(letters, names);
    last = m.index + m[0].length;
  }
  return out + plainLetters(text.slice(last));
}

function plainLetters(text) {
  return escapeHtml(text).replace(/([؀-ۿ](?:\s[؀-ۿ])*)/g, '<span class="ar-letters" lang="ar">$1</span>');
}
