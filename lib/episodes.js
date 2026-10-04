// Episode records on disk (data/episodes/). Sample fixtures (sample-*.json) are never served to the app.
const fs = require("fs");
const path = require("path");

const EPISODES_DIR = path.join(__dirname, "..", "data", "episodes");
const ID_RE = /^episode-\d{2}-[0-9TZ-]+$/;

function isValidId(id) {
  return typeof id === "string" && ID_RE.test(id);
}

function filePath(id) {
  return path.join(EPISODES_DIR, `${id}.json`);
}

function get(id) {
  if (!isValidId(id)) return null;
  try {
    return JSON.parse(fs.readFileSync(filePath(id), "utf8"));
  } catch {
    return null;
  }
}

function save(record) {
  fs.mkdirSync(EPISODES_DIR, { recursive: true });
  fs.writeFileSync(filePath(record.id), JSON.stringify(record, null, 2) + "\n", "utf8");
}

function list() {
  let files = [];
  try {
    files = fs.readdirSync(EPISODES_DIR);
  } catch {
    return [];
  }
  return files
    .filter((f) => f.endsWith(".json") && isValidId(f.slice(0, -5)))
    .map((f) => get(f.slice(0, -5)))
    .filter(Boolean)
    .sort((a, b) => b.created_at.localeCompare(a.created_at));
}

module.exports = { get, save, list, isValidId, EPISODES_DIR };
