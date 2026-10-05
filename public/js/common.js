// Kottab Discovery Engine — shared browser helpers.
// Demo mode: child data stays in this browser (localStorage).
// Trial mode (sessions with real children, see CLAUDE.md): data lives only in this tab
// (sessionStorage) and is erased, here and on the server, when the session ends.
// Nothing is sent anywhere except the profile fields the episode request needs.

const KEYS = {
  profile: "kottab.profile",
  diagnosis: "kottab.diagnosis",
  episodeId: "kottab.episodeId",
  gate: "kottab.parentGate",
  trial: "kottab.trial",
  trialEpisodes: "kottab.trialEpisodes",
  letters: "kottab.letters",
};

const trial = {
  isOn() {
    try { return sessionStorage.getItem(KEYS.trial) === "on"; } catch { return false; }
  },
  start() {
    try { sessionStorage.setItem(KEYS.trial, "on"); return true; } catch { return false; }
  },
  // Erases the session's episodes on the server, then everything in this tab.
  async end() {
    const ids = store.get(KEYS.trialEpisodes) || [];
    try {
      await fetch("/api/trial/end", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ episode_ids: ids }),
      });
    } catch { /* the server also forgets trial episodes after a few hours */ }
    try {
      [KEYS.profile, KEYS.diagnosis, KEYS.episodeId, KEYS.letters, KEYS.trialEpisodes, KEYS.trial].forEach((k) => sessionStorage.removeItem(k));
    } catch { /* storage unavailable */ }
  },
};

// Demo mode uses localStorage; trial mode uses sessionStorage only.
function backend() {
  return trial.isOn() ? sessionStorage : localStorage;
}

const store = {
  get(key) {
    try {
      const raw = backend().getItem(key);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },
  set(key, value) {
    try {
      backend().setItem(key, JSON.stringify(value));
      return true;
    } catch {
      return false;
    }
  },
  remove(key) {
    try { backend().removeItem(key); } catch { /* storage unavailable */ }
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
    </div>
    ${trial.isOn() ? `<div class="trial-bar">
      <span><b>Trial session</b> · nothing is saved</span>
      <button type="button" id="end-trial">End session</button>
    </div>` : ""}`;
  document.body.prepend(header);
  const endBtn = header.querySelector("#end-trial");
  if (endBtn) {
    endBtn.addEventListener("click", async () => {
      endBtn.disabled = true;
      endBtn.textContent = "Erasing…";
      await trial.end();
      location.href = "index.html?ended=1";
    });
  }
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

// AI-transparency line (challenge reference pack). It states what actually happened:
// a teacher has reviewed it, or it was checked automatically and a teacher reviews it after it is shown.
function transparencyLine(teacherReviewed) {
  return teacherReviewed
    ? "This episode was prepared with an AI assistant from teacher-approved cards and reviewed by a Kottab teacher."
    : "This episode was prepared with an AI assistant from teacher-approved cards, checked automatically against the sources, and is reviewed by a Kottab teacher after it is shown.";
}
