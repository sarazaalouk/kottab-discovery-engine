# Validator reliability test plan

The validator (`validator.js`) runs on every model output before an episode is saved for review. Any failure rejects the episode with the reason.

Each test takes the sample episode (`data/episodes/sample-episode-01.json`), breaks **one** rule on purpose, and checks that the validator rejects it with the right reason. The unchanged sample must pass.

**Run:** `npm test` (script: `tests/validator-tests.js`)

**Rule:** every new validator case is added to this table **and** to the test script.

| # | Rule | What is broken | Expected result |
|---|---|---|---|
| 0 | — | Nothing (sample as generated) | Passes |
| 1 | (a) every meaning has a card_id | `card_id` emptied | Rejected: `[a] meaning has no card_id` |
| 2 | (b) card exists | `card_id` set to `kb-999` | Rejected: `[b] card_id kb-999 does not exist` |
| 3 | (b) card is approved | `card_id` set to `kb-050` (draft) | Rejected: `[b] card kb-050 is not approved` |
| 4 | (c) text matches the card exactly | Meaning text paraphrased | Rejected: `[c] text does not exactly match card kb-031` |
| 5 | (d) ayah reference exists | `1:9` added to `salah_connection.ayah_refs` | Rejected: `[d] "1:9" is not an ayah in quran_fatiha.json` |
| 6 | (d) no ayah text from the model | "الرحمن الرحيم" added to free text | Rejected: `[d] Arabic text that resembles ayah text` |
| 7 | (e) memory picture is labelled | Label changed to "memory picture" | Rejected: `[schema] must be "memory picture, not a tafsir"` |
| 8 | (f) JSON matches the schema | Extra field `extra` added | Rejected: `[schema] $.extra: not allowed` |
| 9 | (f) output is JSON | Output is `{not json` | Rejected: `[schema] output is not valid JSON` |
| 10 | (d) single root letters are allowed | "ر ح م (r, h, m)" added to the question | Passes |
| 11 | (d) no Arabic words from the model | "رحم" (letters joined) added to the question | Rejected: `[d] Arabic text written by the model` |
| 12 | (b) child screens use child cards only | Teacher/parent-only card kb-020 (approved for this test) put in a word meaning | Rejected: `[b] card kb-020 is not for children` |
| 14 | (adapt) discovery mode matches the reading level | `discovery_mode` set to `letter` for a child at "Knows most letters" | Rejected: `[adapt] discovery_mode is "letter", expected "root"` |
| 14b | (adapt) letter mode compares one letter only | Child at "Knows some letters", an option names ر ح م | Rejected: `[adapt] 3 Arabic letters in letter mode (at most 1)` |
| 14c | (adapt) fifth level uses reading mode | Child at "Reads Arabic well", `discovery_mode` = `reading` | Accepted |
| 14d | (adapt) fifth level with another mode | Child at "Reads Arabic well", `discovery_mode` = `root` | Rejected: `[adapt] discovery_mode is "root", expected "reading" for "Reads Arabic well"` |
| 16 | (c) a child meaning is the child sentence | A word meaning uses the card's parent text (`meaning_en`) | Rejected: `[c] a meaning for the child must be card kb-030's meaning_en_child, word for word` |
| 16b | (c) the child's positions decide, not the model's audience label | A word meaning labelled `parent` by the model, with the parent text | Rejected: `[c]` — word meanings and the revealed answer card are always shown to the child, so they must be the child sentence |
| 17 | (options) the three options are different | Option 2 is option 1 in capitals with a space | Rejected: `[options] two options are the same text` |
| 18 | (word) a meaning card is about the word it is attached to | kb-030 (الرحمن الرحيم) attached to 1:1 word 1 (بِسْمِ) | Rejected: `[word]`. Rule: the word at ayah_ref/word_index must be one of the card's words (word_ar split into words) and the ayah must be one of the card's ayahs (a number, a list like [1, 3], or a range like "2-7"). Both sides in one normal form: marks removed, hamzat al-wasl and hamza seats as alif, ة as ه, ال removed, and alif removed (the Uthmani small alif). Context cards are exempt. Unit cases M1–M8 in `tests/word-tests.js` |
| 18b | (word) positive: kb-030 on Ar-Rahman and Ar-Raheem in 1:1 and in 1:3 | Four words, all with kb-030 | Passes |
| 18c | (word) negative: kb-030 on a word of an ayah it does not cover | kb-030 on 1:2 word 1 (الحمد) | Rejected: `[word]` |
| 19 | (define) free text does not define words | "The word Ar-Rahman is about mercy…" added to the discovery moment | Rejected: `[define] free text uses a definition phrase` |
| 19b | (define) same rule for the memory picture | "…because Ar-Rahman means mercy" | Rejected: `[define]` |
| 19c | (define) same rule for the three options | "Ar-Rahman means the Most Merciful" as an option | Rejected: `[define]` |

## Last run

2026-10-06: all 26 cases (0–12, 14, 14b, 14c, 14d, 16, 16b, 17, 18, 18b, 18c, 19, 19b, 19c) behaved as expected. The sample fixture got the `adaptation` field (Knows most letters → root) by hand when the field was added to the schema.

## Not covered by the validator (human review)

These rules cannot be checked by code and stay with the reviewer:
- Free text (discovery moment, question, options, tasks, report): we check for specific phrasings that define meanings (case 19), and other claims may get past this check; the teacher reviews after the episode is shown and can withdraw it.
- The discovery question can be answered by looking at the ayah, and the wrong options are the same kind of answer.
- The parent report is written as an invitation, not as something the child already did.
- The memory picture is a memory aid, not an explanation.

## Publishing (after the validator)

Script: `tests/publish-tests.js` (also run by `npm test`). Rule in `lib/publish.js`.

| # | Situation | Expected result |
|---|---|---|
| P1 | Sample episode passes the validator, no referrals | `approved` (published at once, `auto_approved` by the validator) |
| P2 | Passes the validator, has a referral | `pending_review` (waits for the teacher) |
| P3 | Fails the validator | `rejected` (never shown) |
| P4 | Auto-published episode | Not yet counted as teacher-reviewed |
| P5 | Teacher withdraws without a note | Refused: a note is required |
| P6 | Teacher withdraws with a note | `returned`; the auto-approval is kept in `review_history` |
| P7 | Withdraw an episode that is not published | Refused |
| P8 | Teacher confirms an auto-published episode | Counted as teacher-reviewed |
| P9 | Any decision while the episode is still being generated | Refused |
| P10 | `PUBLISH_MODE=review-first`: passes the validator, no referrals | `pending_review` (waits for the teacher) |
| P11 | `PUBLISH_MODE=review-first`: fails the validator | `rejected` |
| P12 | `PUBLISH_MODE` not set (or empty, or `auto`) | `auto` |
| P13 | `PUBLISH_MODE` with an unknown value | Treated as `review-first` |

Last run: 2026-10-06, all 13 cases behaved as expected.

## Bismillah letters path (case 15)

Script: `tests/letters-tests.js` (also run by `npm test`). Check in `lib/noor.js` (`unknownArabicWords`), applied by the server to every `GET /api/letters/:step` response.

| # | What is checked | Expected result |
|---|---|---|
| 15.1 / 15.2 | Steps 1 and 2 as served | Every Arabic word is found exactly in `noor_albayan.json` or `quran_fatiha.json` |
| 15.1b / 15.2b | Reading words of each step | Three fatha words, each with at least two letters of that step |
| 15.3 | A word that is not in the sources is added | Caught (the server would answer 500 and not show it) |
| 15.4 | A Quran word without its Mushaf marks | Caught: words must match with their marks |

Last run: 2026-10-06, all cases behaved as expected.

## Other checks run by `npm test`

| Script | What it checks | Cases |
|---|---|---|
| `tests/word-tests.js` | Meaning card ↔ ayah word (case 18): kb-030 on Ar-Rahman / Ar-Raheem in 1:1 and 1:3, a wrong word, an ayah outside the card, a range ayah, the Uthmani small alif | M1–M8 |
| `tests/levels-tests.js` | Reading level from the letter games, including stage 5 (ayah 1:1 read in full → "Reads Arabic well"), and "Skip the games" (parent's choice, reading levels only, never in a trial) | L1–L11 |
| `tests/checks-tests.js` | "Before you move on": the teacher's questions file is refused if a card is missing or not approved, or a question has no source; 2 of 3 passes; the closing screen shows only after passing | C1–C9 |
| `tests/sukun-tests.js` | Quran display: U+0652 shown as U+06E1 (Madinah Mushaf sukun) in `.quran` elements only; the verified file is unchanged | K1–K4 |
| `tests/why-tests.js` | "Why this journey": approved cards kb-002, kb-003, kb-001 only, in that order, texts and sources as in the knowledge base | V1–V3 |
| `tests/ask-tests.js` | "Ask a question": only approved cards for the child (with a child sentence) can answer; a parent/teacher-only card is never offered or shown; the answer is the child sentence word for word | A1–A5 |
| `tests/trial-tests.js` | Trial sessions: erased on "End session", and a generation that finishes later saves nothing and logs no referral; the session id (made in the browser before any generation) erases everything from the session even if the episode id never reached the browser | T1–T10 |
| `tests/replies-tests.js` | Teacher replies to referrals: English only (single Arabic letters allowed), stored on the referral in `referrals.jsonl` or in trial memory (erased with the session), shown only on their own episode | Y1–Y8 |
| `tests/client-tests.js` | Episode page: a shown episode is checked every 30 seconds; a withdrawn one is reported once and the checks stop; a dropped request is retried; the teacher's replies are checked every 30 seconds | W1–W5 |
| `tests/pin-tests.js` | Reviewer PIN: 503 when no PIN is set on the server, 401 for a wrong or missing PIN, allowed with the right PIN | R1–R4 |
| `tests/docs-tests.js` | The numbers in the docs match the project: approved cards (19), the number of cases in each table of this file, every test script listed here, and the new features described in CLAUDE.md and content-levels.md | D1–D5 |

Last run: 2026-10-06, all cases behaved as expected.
