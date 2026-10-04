// Kottab Discovery Engine — server
// Project rules: see CLAUDE.md. The API key is read from .env only.

require("dotenv").config();

const path = require("path");
const express = require("express");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// Health check (used by Render). Never returns the key itself.
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    apiKeyConfigured: Boolean(process.env.ANTHROPIC_API_KEY),
  });
});

app.listen(PORT, () => {
  console.log(`Kottab Discovery Engine running on http://localhost:${PORT}`);
});
