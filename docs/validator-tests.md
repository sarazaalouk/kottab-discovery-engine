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

## Last run

2026-10-05: all 13 cases (0–12) behaved as expected.

## Not covered by the validator (human review)

These rules cannot be checked by code and stay with the reviewer:
- Free text (discovery moment, question, tasks, report) does not state meanings or tafsir.
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

Last run: 2026-10-05, all 8 cases behaved as expected.
