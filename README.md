Kottab Discovery Engine
Owner: Sara Zaalouk — Kottab Institute
Islamic AI Challenge 2026 — Track 3

## Baseline documented before 4 Oct

The following work existed before the start of the challenge:

- **Three interactive diagnostic games** — the Nour Al-Bayan (نور البيان) diagnostic games.
- **Ten designed episodes for Season 1 (Al-Fatiha)** — all ten episodes complete.
- **The Kottab educational system document** — the document describing the Kottab (كُتّاب) learning system.

Note: these files are currently stored outside this repository and will be added to the `baseline` folder.

## How an episode reaches the child

Every episode is checked automatically before it is shown: meanings must match teacher-approved cards word for word, and the model may not write any Quran text. An episode that passes and has no questions for the teacher is shown to the child at once; a Kottab teacher reviews it afterwards and can withdraw it. An episode with a referral waits for the teacher. An episode that fails the check is never shown.

## What a family sees

- **Letter games** (five stages, fixed rules, no model) set the reading level, from "Does not know the letters yet" to "Reads Arabic well". Parents of children who already read can skip them.
- **Episode** made from teacher-approved cards, adapted to the level, with the Quran text inserted by the server (sukun shown in the Madinah Mushaf form).
- **Before you move on**: three fixed questions from the teacher; passing opens a closing screen. No points, badges or timer.
- **Ask a question**: questions outside the cards go to the teacher, whose own reply appears under the question box.
- **Why this journey**: approved cards about Al-Fatiha on the parent page and the report.

## Documentation

- [Sources](docs/sources.md) — Quran text, Al-Tafsir Al-Muyassar, Tafsir Ibn Kathir (edition and pages), hadith grading, English terminology; aligned with the challenge reference pack "المرجعية والحزمة العلمية".
- [Content levels](docs/content-levels.md) — how the product works in levels أ and ب and refers ج and د to a teacher, with the ayah 7 example.
- [Validator test plan](docs/validator-tests.md) — run with `npm test`.
- [Trial mode](docs/trial-mode.md) — sessions with real children: in memory only, nothing stored.
- [Deploying on Render](docs/deploy.md) — what is ready in the code and the steps in Render.
