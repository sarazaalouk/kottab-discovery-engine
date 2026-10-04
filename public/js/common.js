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
